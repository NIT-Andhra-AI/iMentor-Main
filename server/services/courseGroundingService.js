// server/services/courseGroundingService.js
/**
 * Course Grounding Service
 * Grounding engine for iMentor Tutor Mode & Agentic Chat.
 *
 * Integrates:
 * 1. Course Syllabus (syllabus.csv) - Modules, Topics, Subtopics, References
 * 2. Course Lecture Notes (lecture_notes/subtopics/*.md) -
 *    Definition, Intuition, Mathematical Foundation, Diagrams, Worked Examples,
 *    Key Takeaways, Common Misconceptions, or Full Lecture Excerpts
 * 3. Precomputed Study Questions (_study_questions/*.json) -
 *    MCQs, Short Answer Model Answers, Key Concepts, Bloom Levels, Flashcard Hints
 * 4. Python RAG / STN Notes / Qdrant Chunks (when online)
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const log = require('../utils/logger');

// Cache to keep resolved grounding in memory for ultra-fast turns (<1ms)
const _groundingMemoryCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Standardize string to snake_case identifier slug
 */
function toSlug(str) {
    if (!str) return '';
    return String(str)
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

/**
 * Extract clean technical excerpt from numbered lecture notes (e.g. # Lecture 10: ...)
 * when canonical ### Definition headings are not used.
 */
function extractTechnicalLectureExcerpt(mdContent) {
    if (!mdContent || typeof mdContent !== 'string') return '';
    // Strip the 40-minute lecture plan section if present and start from ## 2.
    const sec2Idx = mdContent.search(/^##\s+2\./m);
    const body = sec2Idx >= 0 ? mdContent.slice(sec2Idx) : mdContent;
    const cleaned = body
        .replace(/^\*\s+\*\*Available Formats:\*\*.*$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    return cleaned.substring(0, 2400);
}

/**
 * Parse markdown lecture note into canonical pedagogical sections
 */
function parseLectureNoteSections(mdContent) {
    if (!mdContent || typeof mdContent !== 'string') return {};

    const sections = {
        title: '',
        definition: '',
        intuition: '',
        mathematicalFoundation: '',
        diagram: '',
        workedExample: '',
        keyTakeaways: '',
        commonMisconceptions: '',
        technicalExcerpt: '',
        rawMarkdown: mdContent
    };

    // Extract title (# Title or ## Title)
    const titleMatch = mdContent.match(/^#{1,2}\s+([^\n]+)/m);
    if (titleMatch) sections.title = titleMatch[1].trim();

    // Section splitter for ### Headings
    const headingRegex = /###\s+([^\n]+)\n([\s\S]*?)(?=(?:###\s+|$))/g;
    let match;
    while ((match = headingRegex.exec(mdContent)) !== null) {
        const heading = match[1].trim().toLowerCase();
        const body = match[2].trim();

        if (heading.includes('definition')) {
            sections.definition = body;
        } else if (heading.includes('intuition')) {
            sections.intuition = body;
        } else if (heading.includes('mathematical') || heading.includes('formula') || heading.includes('equation')) {
            sections.mathematicalFoundation = body;
        } else if (heading.includes('diagram') || heading.includes('visual')) {
            sections.diagram = body;
        } else if (heading.includes('worked example') || heading.includes('example')) {
            sections.workedExample = body;
        } else if (heading.includes('takeaway') || heading.includes('summary')) {
            sections.keyTakeaways = body;
        } else if (heading.includes('misconception') || heading.includes('mistake')) {
            sections.commonMisconceptions = body;
        }
    }

    if (!sections.definition && !sections.intuition && !sections.mathematicalFoundation) {
        sections.technicalExcerpt = extractTechnicalLectureExcerpt(mdContent);
    }

    return sections;
}

/**
 * Parse syllabus.csv to match topic or subtopic metadata
 */
function parseSyllabusRow(csvContent, queryTopicOrSubtopic) {
    if (!csvContent || !queryTopicOrSubtopic) return null;
    const targetSlug = toSlug(queryTopicOrSubtopic);
    const targetTokens = targetSlug.split('_').filter(t => t.length > 2);

    const lines = csvContent.split('\n');
    let header = null;
    let bestRow = null;
    let bestScore = 0;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const fields = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                fields.push(cur.trim());
                cur = '';
            } else {
                cur += ch;
            }
        }
        fields.push(cur.trim());

        if (!header) {
            header = fields.map(f => f.toLowerCase().replace(/[^a-z0-9]/g, ''));
            continue;
        }

        const modIdx = header.findIndex(h => h.includes('module') || h.includes('unit'));
        const topicIdx = header.findIndex(h => h.includes('lecturetopic') || h.includes('topic'));
        const subtopicIdx = header.findIndex(h => h.includes('subtopic'));
        const resIdx = header.findIndex(h => h.includes('resource') || h.includes('source') || h.includes('prerequisite'));
        const lecNumIdx = header.findIndex(h => h.includes('lecturenumber') || h.includes('code'));

        const moduleName = (modIdx >= 0 ? fields[modIdx] : fields[0]) || '';
        const lectureNum = (lecNumIdx >= 0 ? fields[lecNumIdx] : fields[1]) || '';
        const lectureTopic = (topicIdx >= 0 ? fields[topicIdx] : fields[2]) || '';
        const subtopicsStr = (subtopicIdx >= 0 ? fields[subtopicIdx] : fields[3]) || '';
        const resources = (resIdx >= 0 ? fields[resIdx] : fields[4]) || '';

        const subtopics = subtopicsStr
            .replace(/["']/g, '')
            .split(/[,;]/)
            .map(s => s.trim())
            .filter(Boolean);

        const rowSlugs = [
            toSlug(moduleName),
            toSlug(lectureTopic),
            ...subtopics.map(toSlug)
        ];

        const isExactMatch = rowSlugs.some(s => s && (s === targetSlug || s.includes(targetSlug) || targetSlug.includes(s)));
        if (isExactMatch) {
            return {
                module: moduleName,
                lectureNumber: lectureNum,
                lectureTopic,
                subtopics,
                resources
            };
        }

        // Token overlap fallback against syllabus row
        if (targetTokens.length > 0) {
            const combinedRowSlug = rowSlugs.join('_');
            const hits = targetTokens.filter(t => combinedRowSlug.includes(t)).length;
            const score = hits / targetTokens.length;
            if (score >= 0.5 && score > bestScore) {
                bestScore = score;
                bestRow = {
                    module: moduleName,
                    lectureNumber: lectureNum,
                    lectureTopic,
                    subtopics,
                    resources
                };
            }
        }
    }

    return bestRow;
}

/**
 * Locate course folder on disk
 */
function resolveCanonicalCourseCode(courseName) {
    if (!courseName) return '';
    const s = String(courseName).trim();
    const lower = s.toLowerCase();
    if (lower.includes('digital signal processing') || lower === 'dsp' || lower.includes('ee3621')) return 'EE3621';
    if (lower.includes('signals and systems') || lower.includes('ec1521')) return 'EC1521';
    if (lower.includes('control system') || lower.includes('ee3601')) return 'EE3601';
    if (lower.includes('data structure') || lower.includes('cs2101')) return 'CS2101';
    return s;
}

function findCourseDirectory(courseName) {
    if (!courseName) return null;
    const cleanName = resolveCanonicalCourseCode(courseName);
    const candidateBases = [
        path.join(__dirname, '..', 'course_bootstrap'),
        path.join(__dirname, '..', '..', 'course_bootstrap')
    ];

    for (const base of candidateBases) {
        if (!fs.existsSync(base)) continue;
        const entries = fs.readdirSync(base);

        // Exact match
        if (entries.includes(cleanName)) {
            return path.join(base, cleanName);
        }

        // Case-insensitive / underscore match
        const slug = toSlug(cleanName);
        for (const entry of entries) {
            if (toSlug(entry) === slug) {
                return path.join(base, entry);
            }
        }
    }

    return null;
}

/**
 * Find subtopic note file on disk
 */
function findSubtopicNoteFile(courseDir, subtopicIdentifier) {
    if (!courseDir || !subtopicIdentifier) return null;
    const subtopicsDir = path.join(courseDir, 'lecture_notes', 'subtopics');
    if (!fs.existsSync(subtopicsDir)) return null;

    const files = fs.readdirSync(subtopicsDir);
    const targetSlug = toSlug(subtopicIdentifier);

    // 1. Exact filename match
    const exactFile = files.find(f => f.toLowerCase() === `${targetSlug}.md`);
    if (exactFile) return path.join(subtopicsDir, exactFile);

    // 2. Fuzzy slug match on filename
    for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const fileSlug = toSlug(file.replace(/\.md$/i, ''));
        if (fileSlug === targetSlug || fileSlug.includes(targetSlug) || targetSlug.includes(fileSlug)) {
            return path.join(subtopicsDir, file);
        }
    }

    // 3. Token overlap match on filename
    const stopWords = new Set(['the', 'and', 'for', 'with', 'via', 'how', 'what', 'explain', 'design', 'method']);
    const targetTokens = targetSlug.split('_').filter(t => t.length > 2 && !stopWords.has(t));
    let bestFile = null;
    let bestScore = 0;
    for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const fileTokens = toSlug(file.replace(/\.md$/i, '')).split('_').filter(t => t.length > 2);
        const matchCount = targetTokens.filter(t => fileTokens.some(ft => ft.includes(t) || t.includes(ft))).length;
        const score = matchCount / Math.max(1, targetTokens.length);
        if (score > 0.4 && score > bestScore) {
            bestScore = score;
            bestFile = path.join(subtopicsDir, file);
        }
    }
    if (bestFile) return bestFile;

    // 4. Title & Lecture Plan scan in first 1000 chars of file (for numbered files like ee3621_l10.md)
    const targetLower = String(subtopicIdentifier).toLowerCase();
    let bestHeaderFile = null;
    let bestHeaderScore = 0;

    // Prefer ee3621_l*.md or descriptive files first to avoid duplicate scanning
    const sortedFiles = [...files].sort((a, b) => {
        const aIsCanonical = a.startsWith('ee') || a.includes('_');
        const bIsCanonical = b.startsWith('ee') || b.includes('_');
        return (bIsCanonical ? 1 : 0) - (aIsCanonical ? 1 : 0);
    });

    for (const file of sortedFiles) {
        if (!file.endsWith('.md')) continue;
        try {
            const p = path.join(subtopicsDir, file);
            const head = fs.readFileSync(p, 'utf8').substring(0, 1000).toLowerCase();
            if (head.includes(targetLower)) {
                return p;
            }
            if (targetTokens.length > 0) {
                const firstLine = head.split('\n')[0] || '';
                const titleHits = targetTokens.filter(t => firstLine.includes(t)).length;
                const bodyHits = targetTokens.filter(t => head.includes(t)).length;
                const weightedScore = (titleHits * 2 + bodyHits) / (targetTokens.length * 3);
                if (weightedScore >= 0.35 && weightedScore > bestHeaderScore) {
                    bestHeaderScore = weightedScore;
                    bestHeaderFile = p;
                }
            }
        } catch (_) {}
    }

    return bestHeaderFile;
}

/**
 * Find study questions JSON on disk
 */
function findStudyQuestionsFile(courseDir, subtopicIdentifier) {
    if (!courseDir || !subtopicIdentifier) return null;
    const qDir = path.join(courseDir, '_study_questions');
    if (!fs.existsSync(qDir)) return null;

    const files = fs.readdirSync(qDir);
    const targetSlug = toSlug(subtopicIdentifier);

    const exactFile = files.find(f => f.toLowerCase() === `${targetSlug}.json`);
    if (exactFile) return path.join(qDir, exactFile);

    for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const fileSlug = toSlug(file.replace(/\.json$/i, ''));
        if (fileSlug === targetSlug || fileSlug.includes(targetSlug) || targetSlug.includes(fileSlug)) {
            return path.join(qDir, file);
        }
    }

    return null;
}

/**
 * Core function: Resolve complete grounding for a subtopic or topic in a course
 */
async function resolveCourseGrounding(courseName, subtopicIdOrName, topicIdOrName = null, position = null) {
    const primaryId = subtopicIdOrName || topicIdOrName || position?.subtopicId || position?.topicId || '';
    const cacheKey = `${toSlug(courseName)}::${toSlug(primaryId)}`;

    const cached = _groundingMemoryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return cached.data;
    }

    const grounding = {
        course: courseName || 'General',
        module: position?.moduleName || '',
        topic: position?.topicName || topicIdOrName || '',
        subtopic: position?.subtopicName || subtopicIdOrName || '',
        resources: '',
        definition: '',
        intuition: '',
        mathematicalFoundation: '',
        diagram: '',
        workedExample: '',
        keyTakeaways: '',
        commonMisconceptions: '',
        technicalExcerpt: '',
        mcqs: [],
        shortAnswers: [],
        flashcards: [],
        groundTruth: '',
        groundingBlock: '',
        source: 'llm_inherent'
    };

    const courseDir = findCourseDirectory(courseName);

    if (courseDir) {
        // 1. Parse syllabus.csv
        const syllabusPath = path.join(courseDir, 'syllabus.csv');
        if (fs.existsSync(syllabusPath)) {
            try {
                const csvContent = fs.readFileSync(syllabusPath, 'utf8');
                const syllabusRow = parseSyllabusRow(csvContent, primaryId) ||
                                     parseSyllabusRow(csvContent, topicIdOrName);
                if (syllabusRow) {
                    if (!grounding.module) grounding.module = syllabusRow.module;
                    if (!grounding.topic) grounding.topic = syllabusRow.lectureTopic;
                    grounding.resources = syllabusRow.resources || '';
                    grounding.syllabusSubtopics = syllabusRow.subtopics || [];
                    grounding.source = 'course_syllabus';
                }
            } catch (err) {
                log.warn('GROUNDING', `Syllabus CSV parse error: ${err.message}`);
            }
        }

        // 2. Parse lecture note markdown
        const noteFile = findSubtopicNoteFile(courseDir, primaryId) ||
                         (topicIdOrName ? findSubtopicNoteFile(courseDir, topicIdOrName) : null) ||
                         (grounding.topic ? findSubtopicNoteFile(courseDir, grounding.topic) : null);
        if (noteFile) {
            try {
                const mdContent = fs.readFileSync(noteFile, 'utf8');
                const sections = parseLectureNoteSections(mdContent);

                if (sections.title && !grounding.topic) {
                    grounding.topic = sections.title;
                }
                grounding.definition = sections.definition || '';
                grounding.intuition = sections.intuition || '';
                grounding.mathematicalFoundation = sections.mathematicalFoundation || '';
                grounding.diagram = sections.diagram || '';
                grounding.workedExample = sections.workedExample || '';
                grounding.keyTakeaways = sections.keyTakeaways || '';
                grounding.commonMisconceptions = sections.commonMisconceptions || '';
                grounding.technicalExcerpt = sections.technicalExcerpt || '';
                grounding.rawNotes = sections.rawMarkdown || '';
                grounding.source = 'course_lecture_notes';
            } catch (err) {
                log.warn('GROUNDING', `Lecture note read error: ${err.message}`);
            }
        }

        // 3. Parse study questions JSON
        const qFile = findStudyQuestionsFile(courseDir, primaryId) ||
                      (topicIdOrName ? findStudyQuestionsFile(courseDir, topicIdOrName) : null);
        if (qFile) {
            try {
                const qContent = JSON.parse(fs.readFileSync(qFile, 'utf8'));
                grounding.mcqs = Array.isArray(qContent.mcq) ? qContent.mcq : [];
                grounding.shortAnswers = Array.isArray(qContent.short_answer) ? qContent.short_answer : [];
                grounding.flashcards = Array.isArray(qContent.flashcards) ? qContent.flashcards : [];
                if (grounding.source === 'llm_inherent') grounding.source = 'course_study_questions';
            } catch (err) {
                log.warn('GROUNDING', `Study questions JSON read error: ${err.message}`);
            }
        }
    }

    // 4. Try Python RAG / STN Notes if available
    const pythonUrl = process.env.PYTHON_RAG_SERVICE_URL;
    if (pythonUrl && courseName && primaryId) {
        try {
            const stnUrl = `${pythonUrl}/stn/${encodeURIComponent(courseName)}/${encodeURIComponent(primaryId)}`;
            const stnResp = await axios.get(stnUrl, { timeout: 1500 });
            if (stnResp.data?.cached && stnResp.data?.data?.teaching_context) {
                grounding.stnTeachingContext = stnResp.data.data.teaching_context;
                grounding.stnKeyEquations = stnResp.data.data.key_equations || [];
                grounding.stnCommonMisconceptions = stnResp.data.data.common_misconceptions || [];
            }
        } catch (_ignore) {
            // Non-fatal
        }
    }

    // 5. Construct Ground Truth Summary for Assessment
    const groundTruthParts = [];
    if (grounding.definition) {
        groundTruthParts.push(`Definition: ${grounding.definition}`);
    }
    if (grounding.intuition) {
        groundTruthParts.push(`Intuition: ${grounding.intuition.substring(0, 300)}...`);
    }
    if (grounding.mathematicalFoundation) {
        groundTruthParts.push(`Formulas / Math: ${grounding.mathematicalFoundation}`);
    }
    if (grounding.technicalExcerpt) {
        groundTruthParts.push(`Lecture Notes Reference:\n${grounding.technicalExcerpt.substring(0, 1000)}`);
    }
    if (grounding.shortAnswers.length > 0) {
        const sa = grounding.shortAnswers[0];
        groundTruthParts.push(`Expected Model Answer: ${sa.model_answer} (Key Concepts: ${(sa.key_concepts || []).join(', ')})`);
    }
    if (grounding.commonMisconceptions) {
        groundTruthParts.push(`Known Student Misconceptions: ${grounding.commonMisconceptions}`);
    }
    grounding.groundTruth = groundTruthParts.join('\n\n');

    // 6. Construct Formatted Grounding Block for Prompt Injection
    const promptParts = [];
    promptParts.push(`## OFFICIAL UNIVERSITY COURSE GROUNDING: ${grounding.course.toUpperCase()}`);
    if (grounding.module) promptParts.push(`- **Module / Unit**: ${grounding.module}`);
    if (grounding.topic) promptParts.push(`- **Lecture Topic**: ${grounding.topic}`);
    if (grounding.subtopic) promptParts.push(`- **Focus Concept**: ${grounding.subtopic}`);
    if (Array.isArray(grounding.syllabusSubtopics) && grounding.syllabusSubtopics.length > 0) {
        promptParts.push(`- **Syllabus Subtopics Covered**: ${grounding.syllabusSubtopics.join(', ')}`);
    }
    if (grounding.resources) promptParts.push(`- **Curriculum Reference**: ${grounding.resources}`);

    if (grounding.definition) {
        promptParts.push(`### Official Course Definition\n${grounding.definition}`);
    }
    if (grounding.intuition) {
        promptParts.push(`### Core Physical Intuition\n${grounding.intuition}`);
    }
    if (grounding.mathematicalFoundation) {
        promptParts.push(`### Mathematical Foundation & Equations\n${grounding.mathematicalFoundation}`);
    }
    if (grounding.diagram) {
        promptParts.push(`### Diagram / Architectural Visual\n${grounding.diagram}`);
    }
    if (grounding.workedExample) {
        promptParts.push(`### Worked Example\n${grounding.workedExample}`);
    }
    if (grounding.commonMisconceptions) {
        promptParts.push(`### Critical Misconceptions to Address & Clarify\n${grounding.commonMisconceptions}`);
    }
    if (grounding.keyTakeaways) {
        promptParts.push(`### Key Takeaways\n${grounding.keyTakeaways}`);
    }
    if (grounding.technicalExcerpt) {
        promptParts.push(`### Official Lecture Notes Reference Excerpt\n${grounding.technicalExcerpt}`);
    }
    if (grounding.shortAnswers.length > 0) {
        const topQA = grounding.shortAnswers.slice(0, 2);
        promptParts.push(`### Benchmark Study Question & Model Answer\n` +
            topQA.map((q, idx) => `Q${idx + 1}: ${q.question}\nModel Answer: ${q.model_answer}\nKey Concepts: ${(q.key_concepts || []).join(', ')}`).join('\n\n')
        );
    }

    grounding.groundingBlock = promptParts.join('\n\n');
    grounding.hasLectureNotes = !!(grounding.definition || grounding.intuition || grounding.mathematicalFoundation || grounding.technicalExcerpt || grounding.rawNotes);
    grounding.hasSyllabus = !!(grounding.module || grounding.resources || (grounding.syllabusSubtopics && grounding.syllabusSubtopics.length > 0));
    grounding.hasStudyQuestions = (grounding.shortAnswers && grounding.shortAnswers.length > 0) || (grounding.mcqs && grounding.mcqs.length > 0);
    grounding.found = grounding.hasLectureNotes || grounding.hasSyllabus || grounding.hasStudyQuestions;

    _groundingMemoryCache.set(cacheKey, { timestamp: Date.now(), data: grounding });
    return grounding;
}

module.exports = {
    resolveCourseGrounding,
    toSlug,
    parseLectureNoteSections,
    parseSyllabusRow,
    findCourseDirectory
};
