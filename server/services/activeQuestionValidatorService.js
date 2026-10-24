/**
 * Active Question Validator, Bank Replenishment & Server-Side Grading Vault
 * =========================================================================
 * 1. Enforces per-student & per-retry uniqueness via GamificationProfile.seenQuestionTexts
 *    and global cohort load-balancing via ConceptQuestionBank.usageCount.
 * 2. Shuffles MCQ options per student/attempt and recomputes correctIndex accurately.
 * 3. Automatically replenishes ConceptQuestionBank when unseen questions are exhausted
 *    using the DSP Parametric Engine (for EE3621) + Local LLM (SGLang / Ollama).
 * 4. Vaults correctIndex / correctAnswer on the server and strips them from all
 *    client-facing payloads so answers are NEVER leaked in the UI or network tab.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const GamificationProfile = require('../models/GamificationProfile');
const ConceptQuestionBank = require('../models/ConceptQuestionBank');
const SkillTree = require('../models/SkillTree');
const { callWithFallback } = require('./llmFallbackService');
const {
    EE3621_NODES,
    generateUnseenQuestionsForSubtopic,
    resolveEE3621SubtopicIndex
} = require('./dspQuestionGeneratorService');
const log = require('../utils/logger');

const COURSE_BOOTSTRAP_DIR = path.join(__dirname, '..', 'course_bootstrap');

// In-memory fast vault for active student attempts (backed by MongoDB GamificationProfile.activeAssessments)
// Keyed by `${userId}:${assessmentKey}` -> Array of full question objects with correctIndex/correctAnswer
// Also keyed by `${userId}:q:${normQuestion}` -> single question object for per-question lookup
const activeAttemptVault = new Map();

// Synchronous cohort-wide question usage tracker so concurrent or back-to-back students
// never draw the same question on Attempt #1
const globalQuestionUsageMap = new Map();

function normalizeQuestionText(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeQuestionAlphaNum(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

/**
 * Cryptographically shuffles options for a specific student attempt and updates correctIndex.
 */
function shuffleQuestionOptions(q) {
    const rawOptions = Array.isArray(q.options) && q.options.length > 0
        ? [...q.options]
        : ['Option A', 'Option B', 'Option C', 'Option D'];

    const origCorrectIdx = typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < rawOptions.length
        ? q.correctIndex
        : 0;
    const origCorrectAns = q.correctAnswer != null && String(q.correctAnswer).trim() !== ''
        ? String(q.correctAnswer).trim()
        : String(rawOptions[origCorrectIdx] || rawOptions[0]).trim();

    // Tag each option with whether it is the correct answer
    let tagged = rawOptions.map((opt, idx) => ({
        text: String(opt),
        isCorrect: String(opt).trim().toLowerCase() === origCorrectAns.toLowerCase()
    }));
    if (!tagged.some(t => t.isCorrect)) {
        tagged[origCorrectIdx].isCorrect = true;
    }

    // Fisher-Yates shuffle
    for (let i = tagged.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        const tmp = tagged[i];
        tagged[i] = tagged[j];
        tagged[j] = tmp;
    }

    const shuffledOptions = tagged.map(t => t.text);
    const newCorrectIndex = Math.max(0, tagged.findIndex(t => t.isCorrect));
    const newCorrectAnswer = shuffledOptions[newCorrectIndex];

    const subtopicLabel = q.subtopic || q.rubricLevel || q.topic || 'Core DSP Concept';
    const coLabel = q.courseOutcome || q.course_outcome_aligned || 'CO1';
    const conceptHint = q.conceptHint || `Review Concept: ${subtopicLabel} (${String(coLabel).split(':')[0]})`;

    return {
        ...q,
        id: q.id || q._id?.toString() || `q_${crypto.randomBytes(4).toString('hex')}`,
        question: q.question,
        options: shuffledOptions,
        correctIndex: newCorrectIndex,
        correctAnswer: newCorrectAnswer,
        conceptHint
    };
}

const CO_METADATA = {
    CO1: {
        code: 'CO1',
        title: 'Time & Frequency Domain Signals/Systems',
        description: 'Understand the characteristics of signals and systems in time domain and frequency domain.'
    },
    CO2: {
        code: 'CO2',
        title: 'Transforms & Fast Algorithms (DTFT, Z, DFT, FFT)',
        description: 'Understand the transforms and their properties (DTFT, Z-Transform, DFT, FFT).'
    },
    CO3: {
        code: 'CO3',
        title: 'LTI System Analysis in Fourier & Z Domains',
        description: 'Analyze discrete-time LTI systems in Fourier and Z domains.'
    },
    CO4: {
        code: 'CO4',
        title: 'FIR/IIR Filter Realization & Finite Wordlength',
        description: 'Synthesize FIR and IIR digital filter structures (Direct, Cascade, Parallel, Lattice) and finite wordlength effects.'
    },
    CO5: {
        code: 'CO5',
        title: 'FIR/IIR Filter Design, Multirate & Adaptive DSP',
        description: 'Design FIR and IIR type digital filters for signal processing, equalization, and noise cancellation.'
    }
};

const BLOOM_CODE_MAP = {
    remember: 'L1: Remember',
    understand: 'L2: Understand',
    apply: 'L3: Apply',
    analyze: 'L4: Analyze',
    evaluate: 'L5: Evaluate',
    create: 'L6: Create'
};

function normalizeDifficultyAndBloom(q = {}) {
    let bloom = String(q.bloomLevel || q.bloomsLevel || '').toLowerCase().trim();
    let diff = String(q.difficulty || '').toLowerCase().trim();

    if (diff === 'beginner') diff = 'easy';
    if (diff === 'intermediate') diff = 'medium';
    if (diff === 'advanced' || diff === 'expert') diff = 'hard';

    if (!['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].includes(bloom)) {
        if (diff === 'easy') bloom = 'understand';
        else if (diff === 'hard') bloom = 'analyze';
        else bloom = 'apply';
    }

    if (!['easy', 'medium', 'hard'].includes(diff)) {
        if (bloom === 'remember' || bloom === 'understand') diff = 'easy';
        else if (bloom === 'analyze' || bloom === 'evaluate' || bloom === 'create') diff = 'hard';
        else diff = 'medium';
    }

    return {
        difficulty: diff,
        bloomLevel: bloom,
        bloomCode: q.bloomCode || BLOOM_CODE_MAP[bloom] || 'L3: Apply'
    };
}

function computeStratifiedQuota(requestedCount = 5) {
    const n = Math.max(1, Number(requestedCount) || 5);
    if (n === 5) {
        return { easy: 2, medium: 2, hard: 1 };
    }
    const easy = Math.max(1, Math.round(n * 0.4));
    const medium = Math.max(1, Math.round(n * 0.4));
    const hard = Math.max(1, n - easy - medium);
    return { easy, medium, hard };
}

function selectStratifiedBalancedQuestions(validUnseen = [], requestedCount = 5) {
    const quota = computeStratifiedQuota(requestedCount);
    const sortByUsageAndRand = (arr) =>
        [...arr].sort((a, b) => {
            const ua = a.usageCount || 0;
            const ub = b.usageCount || 0;
            if (ua !== ub) return ua - ub;
            return Math.random() - 0.5;
        });

    const easyPool = sortByUsageAndRand(validUnseen.filter(q => q.difficulty === 'easy'));
    const mediumPool = sortByUsageAndRand(validUnseen.filter(q => q.difficulty === 'medium'));
    const hardPool = sortByUsageAndRand(validUnseen.filter(q => q.difficulty === 'hard'));

    const chosen = [];
    const chosenIds = new Set();

    const pickFrom = (pool, countNeeded) => {
        const picked = [];
        for (const item of pool) {
            const key = normalizeQuestionAlphaNum(item.question);
            if (!chosenIds.has(key)) {
                chosenIds.add(key);
                picked.push(item);
                if (picked.length >= countNeeded) break;
            }
        }
        return picked;
    };

    // For easy slot, try to pick 1 'remember' (L1) + 1 'understand' (L2) first when quota.easy === 2
    if (quota.easy >= 2) {
        const rememberPool = easyPool.filter(q => q.bloomLevel === 'remember');
        const understandPool = easyPool.filter(q => q.bloomLevel === 'understand');
        chosen.push(...pickFrom(rememberPool, 1));
        chosen.push(...pickFrom(understandPool, 1));
        if (chosen.length < quota.easy) {
            chosen.push(...pickFrom(easyPool, quota.easy - chosen.length));
        }
    } else {
        chosen.push(...pickFrom(easyPool, quota.easy));
    }

    // Medium slots (L3: Apply)
    chosen.push(...pickFrom(mediumPool, quota.medium));

    // Hard slots (L4: Analyze / L5: Evaluate)
    chosen.push(...pickFrom(hardPool, quota.hard));

    // Fallback if any bucket was still short (e.g. non-DSP custom course)
    if (chosen.length < requestedCount) {
        const remainingPool = sortByUsageAndRand(validUnseen);
        chosen.push(...pickFrom(remainingPool, requestedCount - chosen.length));
    }

    return chosen.slice(0, requestedCount);
}

/**
 * Strips correctAnswer, correctIndex, and solution-leaking explanation before sending to browser.
 * Preserves Course Outcome (CO), Bloom's Taxonomy level/code, and Difficulty tier for transparent student/faculty display.
 */
function sanitizeQuestionsForClient(questions = []) {
    return (questions || []).map((q, idx) => {
        const { difficulty, bloomLevel, bloomCode } = normalizeDifficultyAndBloom(q);
        const coCode = String(q.courseOutcome || 'CO1').split(':')[0].trim().toUpperCase();
        const isQuestionDSP = /^(ee3621|digital signal|dsp)/i.test(String(q.course || '')) || /^node_ee3621|^sq_l/i.test(String(q.id || ''));
        const coMeta = isQuestionDSP ? (CO_METADATA[coCode] || CO_METADATA.CO1) : { code: coCode, title: q.subtopic || 'Core Course Outcome', description: q.subtopic || 'Course Curriculum', units: 'Course Curriculum' };
        return {
            id: q.id || q._id?.toString() || `q_${idx}`,
            questionId: q.id || q._id?.toString() || `q_${idx}`,
            question: q.question,
            type: q.type || 'mcq',
            options: Array.isArray(q.options) ? q.options : [],
            difficulty,
            bloomLevel,
            bloomsLevel: bloomLevel,
            bloomCode,
            subtopic: q.subtopic || q.rubricLevel || '',
            unit: q.unit || '',
            courseOutcome: coMeta.code,
            coTitle: q.coTitle || coMeta.title,
            coDescription: q.coDescription || coMeta.description,
            rubricLevel: q.rubricLevel || q.subtopic || '',
            points: q.points || 10,
            conceptHint: q.conceptHint || `Review ${coMeta.code} (${coMeta.title}): ${q.subtopic || q.rubricLevel || 'Course Lecture Notes'}`
        };
    });
}

/**
 * Stores the server-only answer key for a student's active assessment attempt.
 */
async function storeActiveAssessmentAttempt({ userId, assessmentKey, questions = [] }) {
    if (!userId || !Array.isArray(questions) || questions.length === 0) return;
    const uid = String(userId);
    const key = String(assessmentKey || 'default').toLowerCase().trim();

    activeAttemptVault.set(`${uid}:${key}`, questions);
    activeAttemptVault.set(`${uid}:latest`, questions);
    for (const q of questions) {
        activeAttemptVault.set(`${uid}:q:${normalizeQuestionAlphaNum(q.question)}`, q);
        if (q.id) activeAttemptVault.set(`${uid}:id:${String(q.id)}`, q);
    }

    try {
        const updatePath = `activeAssessments.${key.replace(/\./g, '_')}`;
        await GamificationProfile.updateOne(
            { userId },
            {
                $set: {
                    [updatePath]: {
                        questions,
                        issuedAt: new Date()
                    },
                    'activeAssessments.__latest': {
                        key,
                        questions,
                        issuedAt: new Date()
                    }
                }
            },
            { upsert: true }
        );
    } catch (err) {
        log.warn('ACTIVE_VALIDATOR', `Failed to persist activeAssessment in DB: ${err.message}`);
    }
}

/**
 * Grades a student's submitted answers on the server against the vaulted attempt.
 * Never returns correctAnswer or correctIndex in the graded result!
 */
async function gradeAssessmentSubmission({
    userId,
    assessmentKey,
    answers = [],
    submittedQuestions = []
}) {
    const uid = String(userId || '');
    const key = String(assessmentKey || 'default').toLowerCase().trim();

    let vaultedQuestions = activeAttemptVault.get(`${uid}:${key}`) || null;

    if (!vaultedQuestions && userId) {
        try {
            const profile = await GamificationProfile.findOne({ userId }).lean();
            const safeKey = key.replace(/\./g, '_');
            if (profile?.activeAssessments?.[safeKey]?.questions) {
                vaultedQuestions = profile.activeAssessments[safeKey].questions;
            } else if (profile?.activeAssessments?.__latest?.questions) {
                vaultedQuestions = profile.activeAssessments.__latest.questions;
            }
        } catch (err) {
            log.warn('ACTIVE_VALIDATOR', `Error loading activeAssessments from DB: ${err.message}`);
        }
    }

    const totalQuestions = Math.max(
        Array.isArray(answers) ? answers.length : 0,
        Array.isArray(vaultedQuestions) ? vaultedQuestions.length : 0,
        Array.isArray(submittedQuestions) ? submittedQuestions.length : 0
    );

    let correctCount = 0;
    const results = [];

    for (let i = 0; i < totalQuestions; i++) {
        const ansEntry = Array.isArray(answers) ? answers[i] : undefined;
        const subQ = Array.isArray(submittedQuestions) ? submittedQuestions[i] : null;

        // Look up the authoritative server question
        let serverQ = vaultedQuestions?.[i] || null;
        const qTextToMatch = subQ?.question || (typeof ansEntry === 'object' ? ansEntry?.question : '') || serverQ?.question || '';

        if (qTextToMatch) {
            const byText = activeAttemptVault.get(`${uid}:q:${normalizeQuestionAlphaNum(qTextToMatch)}`);
            if (byText) serverQ = byText;
        }
        if (!serverQ && subQ?.id) {
            serverQ = activeAttemptVault.get(`${uid}:id:${String(subQ.id)}`) || null;
        }

        // Fallback: look up in ConceptQuestionBank by question text if server restarted and vault missed
        if (!serverQ && qTextToMatch) {
            try {
                const dbQ = await ConceptQuestionBank.findOne({
                    question: qTextToMatch
                }).lean();
                if (dbQ) {
                    const opts = Array.isArray(subQ?.options) && subQ.options.length > 0 ? subQ.options : dbQ.options;
                    const dbCorrectAnswer = dbQ.correctAnswer || (Array.isArray(dbQ.options) && typeof dbQ.correctIndex === 'number' ? dbQ.options[dbQ.correctIndex] : '');
                    const cIdx = opts.findIndex(o => String(o).trim().toLowerCase() === String(dbCorrectAnswer).trim().toLowerCase());
                    serverQ = {
                        question: dbQ.question,
                        options: opts,
                        correctIndex: cIdx >= 0 ? cIdx : (typeof dbQ.correctIndex === 'number' ? dbQ.correctIndex : 0),
                        correctAnswer: dbCorrectAnswer,
                        conceptHint: `Review Concept: ${dbQ.concept || dbQ.topic || 'Course Material'}`
                    };
                }
            } catch (e) { /* ignore */ }
        }

        // Determine student's selected index and/or answer text
        let selectedIndex = undefined;
        let userAnswerText = '';

        if (typeof ansEntry === 'number') {
            selectedIndex = ansEntry;
            userAnswerText = serverQ?.options?.[selectedIndex] || '';
        } else if (typeof ansEntry === 'string') {
            userAnswerText = ansEntry;
            if (serverQ?.options) {
                const idx = serverQ.options.findIndex(o => String(o).trim().toLowerCase() === ansEntry.trim().toLowerCase());
                if (idx >= 0) selectedIndex = idx;
            }
        } else if (ansEntry && typeof ansEntry === 'object') {
            if (typeof ansEntry.selectedIndex === 'number') {
                selectedIndex = ansEntry.selectedIndex;
            } else if (typeof ansEntry.answer === 'number') {
                selectedIndex = ansEntry.answer;
            }
            userAnswerText = ansEntry.userAnswer || ansEntry.text || (typeof ansEntry.answer === 'string' ? ansEntry.answer : '') || (selectedIndex != null ? (serverQ?.options?.[selectedIndex] || '') : '');
            if (selectedIndex === undefined && userAnswerText && serverQ?.options) {
                const idx = serverQ.options.findIndex(o => String(o).trim().toLowerCase() === String(userAnswerText).trim().toLowerCase());
                if (idx >= 0) selectedIndex = idx;
            }
        }

        let isCorrect = false;
        if (serverQ) {
            if (selectedIndex !== undefined && typeof serverQ.correctIndex === 'number') {
                isCorrect = Number(selectedIndex) === Number(serverQ.correctIndex);
            }
            if (!isCorrect && userAnswerText && serverQ.correctAnswer) {
                isCorrect = String(userAnswerText).trim().toLowerCase() === String(serverQ.correctAnswer).trim().toLowerCase();
            }
        }

        if (isCorrect) correctCount++;

        results.push({
            questionIndex: i,
            question: serverQ?.question || qTextToMatch || `Question ${i + 1}`,
            selectedIndex: selectedIndex !== undefined ? selectedIndex : null,
            userAnswer: userAnswerText,
            isCorrect,
            correct: isCorrect,
            conceptHint: serverQ?.conceptHint || `Review Concept: ${serverQ?.subtopic || 'Lecture Notes & Guided Learning Mode'}`
        });
    }

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return {
        score: correctCount,
        correctCount,
        totalQuestions,
        percentage,
        quizScore: percentage,
        results
    };
}

function resolveEvalPath(cleanCourse) {
    if (!cleanCourse || !fs.existsSync(COURSE_BOOTSTRAP_DIR)) return null;
    const dirs = fs.readdirSync(COURSE_BOOTSTRAP_DIR);
    const rawNorm = cleanCourse.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanNorm = rawNorm === 'ee2061' ? 'ee3601' : rawNorm;

    let matched = dirs.find(d => d.toLowerCase() === cleanCourse.toLowerCase() || d.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNorm);
    if (matched) {
        const p = path.join(COURSE_BOOTSTRAP_DIR, matched, 'skill_tree_evaluation.json');
        if (fs.existsSync(p)) return p;
    }

    for (const d of dirs) {
        const evalPath = path.join(COURSE_BOOTSTRAP_DIR, d, 'skill_tree_evaluation.json');
        if (fs.existsSync(evalPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
                const cCode = String(data.course_code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const cName = String(data.course_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                if ((cCode && cCode === cleanNorm) || (cName && cName.length >= 3 && (cName.includes(cleanNorm) || cleanNorm.includes(cName)))) {
                    return evalPath;
                }
            } catch (e) {}
        }
    }
    return null;
}

function isDSPCourse(cleanCourse = '', skillId = '', levelName = '') {
    const combined = `${cleanCourse} ${skillId} ${levelName}`.toLowerCase();
    return combined.includes('ee3621') || combined.includes('digital signal') || combined.includes('dsp');
}

/**
 * Validates requested questions for a student skill/level evaluation.
 * Enforces per-student & per-retry uniqueness, shuffles options per student,
 * automatically replenishes ConceptQuestionBank when exhausted, and vaults answers server-side.
 */
async function validateAndGenerateFreshQuestions({
    userId,
    courseCode,
    course,
    topic,
    skillId,
    levelId,
    levelName,
    difficulty = 'medium',
    requestedCount = 5,
    seenQuestions = [],
    assessmentKey = null
}) {
    const t0 = Date.now();
    const cleanCourse = (courseCode || course || topic || 'EE3621').trim();
    const isDSP = isDSPCourse(cleanCourse, skillId, levelName);
    const subtopicIdx = isDSP
        ? resolveEE3621SubtopicIndex({ skillId, levelId, levelName })
        : (parseInt(String(levelId || skillId || '1').replace(/\D/g, ''), 10) || 1);
    const dspNodeMeta = isDSP ? (EE3621_NODES[(subtopicIdx - 1) % EE3621_NODES.length] || EE3621_NODES[0]) : null;
    const resolvedConceptName = dspNodeMeta?.name || levelName || topic || cleanCourse;

    log.info('ACTIVE_VALIDATOR', `Serving unique questions for User: ${userId} | Course: ${cleanCourse} | Subtopic/Level: ${subtopicIdx} (${resolvedConceptName}) | Count: ${requestedCount}`);

    // 1. Gather all previously seen questions for this student
    const allSeenNorm = new Set();
    for (const s of (seenQuestions || [])) {
        if (s) {
            allSeenNorm.add(normalizeQuestionText(s));
            allSeenNorm.add(normalizeQuestionAlphaNum(s));
        }
    }

    if (userId) {
        try {
            const profile = await GamificationProfile.findOne({ userId }).lean();
            if (profile && Array.isArray(profile.seenQuestionTexts)) {
                for (const txt of profile.seenQuestionTexts) {
                    allSeenNorm.add(normalizeQuestionText(txt));
                    allSeenNorm.add(normalizeQuestionAlphaNum(txt));
                }
            }
        } catch (err) {
            log.warn('ACTIVE_VALIDATOR', `Error fetching user seenQuestionTexts: ${err.message}`);
        }
    }

    const candidatePool = [];
    const candidateKeys = new Set();

    const addCandidate = (qObj) => {
        if (!qObj || !qObj.question) return;
        const normKey = normalizeQuestionAlphaNum(qObj.question);
        if (!normKey || candidateKeys.has(normKey)) return;
        candidateKeys.add(normKey);
        const { difficulty: normDiff, bloomLevel: normBloom, bloomCode } = normalizeDifficultyAndBloom(qObj);
        const coCode = String(qObj.courseOutcome || dspNodeMeta?.co || 'CO1').split(':')[0].trim().toUpperCase();
        const coMeta = isDSP ? (CO_METADATA[coCode] || CO_METADATA.CO1) : { code: coCode, title: qObj.subtopic || resolvedConceptName || 'Core Course Outcome', description: `${cleanCourse} — ${qObj.subtopic || resolvedConceptName}` };
        const effectiveUsage = Math.max(Number(qObj.usageCount || 0), Number(globalQuestionUsageMap.get(normKey) || 0));
        candidatePool.push({
            ...qObj,
            difficulty: normDiff,
            bloomLevel: normBloom,
            bloomsLevel: normBloom,
            bloomCode,
            unit: qObj.unit || dspNodeMeta?.unit || '',
            courseOutcome: coMeta.code,
            coTitle: qObj.coTitle || coMeta.title,
            coDescription: qObj.coDescription || coMeta.description,
            usageCount: effectiveUsage
        });
    };

    // 2A. Query ConceptQuestionBank sorted by lowest usageCount first (so different students get different questions!)
    try {
        const cqbFilter = isDSP
            ? {
                course: { $regex: /EE3621|Digital Signal/i },
                concept: dspNodeMeta ? dspNodeMeta.name : { $regex: new RegExp(resolvedConceptName.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
            }
            : {
                course: { $regex: new RegExp(cleanCourse.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
                ...(resolvedConceptName && resolvedConceptName.toLowerCase() !== cleanCourse.toLowerCase()
                    ? {
                        $or: [
                            { concept: { $regex: new RegExp(resolvedConceptName.slice(0, 18).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
                            { topic: { $regex: new RegExp(resolvedConceptName.slice(0, 18).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
                        ]
                    }
                    : {})
            };

        const bankDocs = await ConceptQuestionBank.find(cqbFilter)
            .sort({ usageCount: 1, lastUsedAt: 1 })
            .limit(120)
            .lean();

        for (const doc of bankDocs) {
            const opts = Array.isArray(doc.options) ? doc.options : [];
            const cIdx = (typeof doc.correctIndex === 'number' && doc.correctIndex >= 0 && doc.correctIndex < opts.length)
                ? doc.correctIndex
                : Math.max(0, opts.findIndex(o => String(o).trim().toLowerCase() === String(doc.correctAnswer || '').trim().toLowerCase()));
            addCandidate({
                _cqbId: doc._id,
                id: doc._id.toString(),
                question: doc.question,
                options: opts,
                correctIndex: cIdx,
                correctAnswer: doc.correctAnswer || opts[cIdx] || '',
                explanation: doc.explanation || '',
                difficulty: doc.difficulty || difficulty,
                bloomLevel: doc.bloomLevel || 'apply',
                subtopic: doc.concept || resolvedConceptName,
                courseOutcome: dspNodeMeta?.co || 'CO1',
                usageCount: doc.usageCount || 0
            });
        }
    } catch (cqbErr) {
        log.warn('ACTIVE_VALIDATOR', `ConceptQuestionBank query warning: ${cqbErr.message}`);
    }

    // 2B & 2C: Only use static SkillTree / _study_questions as fallback when ConceptQuestionBank has fewer than requestedCount * 2
    if (candidatePool.length < requestedCount * 2) {
        try {
            const targetSkillId = skillId || (isDSP ? `node_ee3621_l${subtopicIdx}` : null);
            if (targetSkillId) {
                const stNode = await SkillTree.findOne({ skillId: targetSkillId }).lean();
                if (stNode && Array.isArray(stNode.assessmentQuestions)) {
                    for (let i = 0; i < stNode.assessmentQuestions.length; i++) {
                        const q = stNode.assessmentQuestions[i];
                        const opts = Array.isArray(q.options) ? q.options : [];
                        const cIdx = Math.max(0, opts.findIndex(o => String(o).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()));
                        addCandidate({
                            id: `${targetSkillId}_q_${i}`,
                            question: q.question,
                            options: opts,
                            correctIndex: cIdx,
                            correctAnswer: q.correctAnswer || opts[cIdx] || '',
                            explanation: q.explanation || '',
                            difficulty: q.difficulty || difficulty,
                            subtopic: stNode.name || resolvedConceptName,
                            courseOutcome: dspNodeMeta?.co || 'CO1',
                            usageCount: 1
                        });
                    }
                }
            }
        } catch (stErr) {
            log.warn('ACTIVE_VALIDATOR', `SkillTree node lookup warning: ${stErr.message}`);
        }

        if (isDSP) {
            try {
                const sqFile = path.join(COURSE_BOOTSTRAP_DIR, 'EE3621', '_study_questions', `ee3621_l${subtopicIdx}.json`);
                if (fs.existsSync(sqFile)) {
                    const sqData = JSON.parse(fs.readFileSync(sqFile, 'utf8'));
                    const mcqs = Array.isArray(sqData.mcq) ? sqData.mcq : (Array.isArray(sqData.questions) ? sqData.questions : []);
                    for (const q of mcqs) {
                        addCandidate({
                            id: q.id || `sq_l${subtopicIdx}_${candidatePool.length}`,
                            question: q.question,
                            options: q.options || [],
                            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                            correctAnswer: q.correctAnswer || q.options?.[q.correctIndex || 0] || '',
                            explanation: q.explanation || '',
                            difficulty: q.difficulty || difficulty,
                            subtopic: sqData.topic_name || resolvedConceptName,
                            courseOutcome: dspNodeMeta?.co || 'CO1',
                            usageCount: 1
                        });
                    }
                }
            } catch (sqErr) { /* ignore */ }
        } else {
            try {
                const evalPath = resolveEvalPath(cleanCourse);
                if (evalPath && fs.existsSync(evalPath)) {
                    const evalData = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
                    for (const l of (evalData.levels || [])) {
                        for (const q of (l.questions || [])) {
                            addCandidate({
                                id: q.id,
                                question: q.question,
                                options: q.options || [],
                                correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                                correctAnswer: q.correctAnswer || q.options?.[q.correctIndex || 0] || '',
                                explanation: q.explanation || '',
                                subtopic: q.subtopic || l.name,
                                courseOutcome: q.course_outcome_aligned || 'CO1',
                                usageCount: 1
                            });
                        }
                    }
                }
            } catch (e) { /* ignore */ }
        }
    }

    // 3. Filter candidatePool against student's seen history
    let validUnseen = candidatePool.filter(q => {
        const normTxt = normalizeQuestionText(q.question);
        const normAlpha = normalizeQuestionAlphaNum(q.question);
        return !allSeenNorm.has(normTxt) && !allSeenNorm.has(normAlpha);
    });

    // Sort unseen candidates primarily by lowest usageCount + random tie-breaker so concurrent students get different questions!
    validUnseen.sort((a, b) => {
        const ua = a.usageCount || 0;
        const ub = b.usageCount || 0;
        if (ua !== ub) return ua - ub;
        return Math.random() - 0.5;
    });

    const quota = computeStratifiedQuota(requestedCount);
    const countUnseenByDiff = (arr) => ({
        easy: arr.filter(q => q.difficulty === 'easy').length,
        medium: arr.filter(q => q.difficulty === 'medium').length,
        hard: arr.filter(q => q.difficulty === 'hard').length
    });
    const unseenCounts = countUnseenByDiff(validUnseen);
    const zeroUsageUnseen = validUnseen.filter(q => (q.usageCount || 0) === 0);
    const zeroCounts = countUnseenByDiff(zeroUsageUnseen);

    log.info(
        'ACTIVE_VALIDATOR',
        `Candidate Pool: ${candidatePool.length} | Unseen for Student: ${validUnseen.length} (Easy:${unseenCounts.easy}, Med:${unseenCounts.medium}, Hard:${unseenCounts.hard}) | ZeroUsage(E:${zeroCounts.easy}, M:${zeroCounts.medium}, H:${zeroCounts.hard}) / Quota: Easy:${quota.easy}, Med:${quota.medium}, Hard:${quota.hard}`
    );

    // 4. AUTOMATIC QUESTION BANK REPLENISHMENT WHEN EXHAUSTED, ANY DIFFICULTY BUCKET IS LOW, OR ZERO-USAGE COHORT POOL IS LOW
    let newlySynthesized = [];
    const bucketLow =
        validUnseen.length < requestedCount * 2 ||
        unseenCounts.easy < quota.easy * 2 ||
        unseenCounts.medium < quota.medium * 2 ||
        unseenCounts.hard < quota.hard * 2 ||
        zeroCounts.easy < quota.easy ||
        zeroCounts.medium < quota.medium ||
        zeroCounts.hard < quota.hard;

    if (bucketLow) {
        const synthCount = Math.max(requestedCount * 2, 10);
        log.info('ACTIVE_VALIDATOR', `Unseen/ZeroUsage tier pool low (Unseen E:${unseenCounts.easy}/M:${unseenCounts.medium}/H:${unseenCounts.hard}, ZeroUsage E:${zeroCounts.easy}/M:${zeroCounts.medium}/H:${zeroCounts.hard}) -> Replenishing ${synthCount} stratified questions for "${resolvedConceptName}"...`);

        // 4A. For DSP (EE3621), generate mathematically exact parametric questions immediately in 2:2:1 stratified blocks
        if (isDSP) {
            const combinedSeenAndPool = new Set([...allSeenNorm, ...candidateKeys]);
            const dspFresh = generateUnseenQuestionsForSubtopic({
                subtopicIndex: subtopicIdx,
                count: synthCount,
                seenNormalizedSet: combinedSeenAndPool,
                normalizeFn: normalizeQuestionAlphaNum
            });
            if (dspFresh.length > 0) {
                for (const fq of dspFresh) {
                    const { difficulty: normDiff, bloomLevel: normBloom, bloomCode } = normalizeDifficultyAndBloom(fq);
                    const coCode = String(fq.courseOutcome || dspNodeMeta?.co || 'CO1').split(':')[0].trim().toUpperCase();
                    const coMeta = CO_METADATA[coCode] || CO_METADATA.CO1;
                    const fqNorm = normalizeQuestionAlphaNum(fq.question);
                    candidateKeys.add(fqNorm);
                    newlySynthesized.push({
                        ...fq,
                        difficulty: normDiff,
                        bloomLevel: normBloom,
                        bloomsLevel: normBloom,
                        bloomCode,
                        unit: fq.unit || dspNodeMeta?.unit || '',
                        courseOutcome: coMeta.code,
                        coTitle: fq.coTitle || coMeta.title,
                        coDescription: fq.coDescription || coMeta.description,
                        usageCount: 0
                    });
                }
            }
        }

        // 4B. If still more questions needed (or non-DSP course), synthesize via Local LLM
        if (validUnseen.length + newlySynthesized.length < requestedCount) {
            const missingCount = requestedCount - (validUnseen.length + newlySynthesized.length);
            try {
                const llmFresh = await synthesizeFreshQuestionsWithLocalLLM({
                    courseCode: cleanCourse,
                    topic: topic || cleanCourse,
                    levelName: resolvedConceptName,
                    countNeeded: Math.max(missingCount, 5),
                    seenTexts: Array.from(allSeenNorm).slice(-60)
                });
                if (llmFresh.length > 0) {
                    newlySynthesized.push(...llmFresh.map(fq => {
                        const { difficulty: normDiff, bloomLevel: normBloom, bloomCode } = normalizeDifficultyAndBloom(fq);
                        return { ...fq, difficulty: normDiff, bloomLevel: normBloom, bloomsLevel: normBloom, bloomCode, usageCount: 0 };
                    }));
                }
            } catch (llmErr) {
                log.warn('ACTIVE_VALIDATOR', `LLM synthesis fallback warning: ${llmErr.message}`);
            }
        }

        // Persist newly synthesized questions into ConceptQuestionBank so the bank grows permanently!
        if (newlySynthesized.length > 0) {
            try {
                const docsToInsert = newlySynthesized.map(q => {
                    const opts = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
                    const cIdx = (typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4)
                        ? q.correctIndex
                        : Math.max(0, opts.findIndex(o => String(o).trim().toLowerCase() === String(q.correctAnswer || '').trim().toLowerCase()));
                    return {
                        course: isDSP ? 'EE3621' : cleanCourse,
                        moduleName: dspNodeMeta?.unit || '',
                        topic: resolvedConceptName,
                        concept: resolvedConceptName,
                        question: q.question,
                        options: opts,
                        correctIndex: cIdx,
                        explanation: q.explanation || '',
                        difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
                        bloomLevel: ['remember', 'understand', 'apply', 'analyze', 'evaluate'].includes(q.bloomLevel) ? q.bloomLevel : 'apply',
                        conceptTags: ['EE3621', dspNodeMeta?.co || 'CO1', q.bloomCode || 'L3: Apply'],
                        generatedBy: q.generatedBy || 'auto_replenish',
                        usageCount: 0
                    };
                });
                const insertedDocs = await ConceptQuestionBank.insertMany(docsToInsert, { ordered: false }).catch(() => []);
                if (Array.isArray(insertedDocs) && insertedDocs.length > 0) {
                    for (let i = 0; i < Math.min(insertedDocs.length, newlySynthesized.length); i++) {
                        if (insertedDocs[i]?._id) {
                            newlySynthesized[i]._cqbId = insertedDocs[i]._id;
                            newlySynthesized[i].id = insertedDocs[i]._id.toString();
                        }
                    }
                }
                log.info('ACTIVE_VALIDATOR', `Persisted ${docsToInsert.length} newly replenished stratified questions into ConceptQuestionBank for "${resolvedConceptName}".`);
            } catch (persistErr) {
                log.warn('ACTIVE_VALIDATOR', `ConceptQuestionBank replenishment save warning: ${persistErr.message}`);
            }

            validUnseen.unshift(...newlySynthesized);
        }
    }

    // 5. Select requestedCount questions using STRICT 2:2:1 Difficulty & Bloom's Stratification and shuffle options per student/attempt
    const selectedRaw = selectStratifiedBalancedQuestions(validUnseen, requestedCount);

    // Synchronously mark selected questions as used in globalQuestionUsageMap so concurrent/next student requests never collide!
    for (const sq of selectedRaw) {
        const nk = normalizeQuestionAlphaNum(sq.question);
        if (nk) {
            globalQuestionUsageMap.set(nk, (globalQuestionUsageMap.get(nk) || 0) + 1);
        }
    }

    const shuffledQuestions = selectedRaw.map(q => shuffleQuestionOptions(q));

    // 6. Immediately record served questions in student's seenQuestionTexts & increment usageCount in ConceptQuestionBank
    if (userId && shuffledQuestions.length > 0) {
        const newlyServedNorms = [];
        for (const q of shuffledQuestions) {
            newlyServedNorms.push(normalizeQuestionText(q.question));
            newlyServedNorms.push(normalizeQuestionAlphaNum(q.question));
        }
        try {
            await GamificationProfile.updateOne(
                { userId },
                { $addToSet: { seenQuestionTexts: { $each: newlyServedNorms } } },
                { upsert: true }
            );
        } catch (e) { /* ignore */ }
    }

    const servedCqbIds = selectedRaw.map(q => q._cqbId).filter(Boolean);
    if (servedCqbIds.length > 0) {
        await ConceptQuestionBank.updateMany(
            { _id: { $in: servedCqbIds } },
            { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } }
        ).catch(() => {});
    }

    // 7. Vault full questions (with shuffled options & correctIndex) on the server for this student's attempt
    const resolvedAssessmentKey = assessmentKey || skillId || `level_${levelId || subtopicIdx}`;
    if (userId) {
        await storeActiveAssessmentAttempt({
            userId,
            assessmentKey: resolvedAssessmentKey,
            questions: shuffledQuestions
        });
    }

    const durationMs = Date.now() - t0;
    log.info('ACTIVE_VALIDATOR', `Served ${shuffledQuestions.length} unique shuffled questions in ${durationMs}ms (Replenished: ${newlySynthesized.length})`);

    return {
        questions: shuffledQuestions,
        clientQuestions: sanitizeQuestionsForClient(shuffledQuestions),
        totalServed: shuffledQuestions.length,
        deduplicationActive: true,
        llmSynthesizedCount: newlySynthesized.length,
        validationTimeMs: durationMs
    };
}

/**
 * Instructs the Local LLM (SGLang / Ollama / Local Provider) to dynamically synthesize
 * N brand-new, non-overlapping engineering questions.
 */
async function synthesizeFreshQuestionsWithLocalLLM({ courseCode, topic, levelName, countNeeded, seenTexts }) {
    const prompt = `You are the iMentor Local LLM Assessment Engine.
Course: "${courseCode} - ${topic}"
Topic/Subtopic: "${levelName}"

CRITICAL NEGATIVE CONSTRAINTS:
DO NOT REPEAT OR PARAPHRASE ANY OF THESE PREVIOUSLY SEEN QUESTIONS:
${(seenTexts || []).slice(0, 40).map((txt, idx) => `${idx + 1}. ${txt}`).join('\n')}

TASK: Generate exactly ${countNeeded} BRAND NEW, non-overlapping multiple-choice engineering questions for "${levelName}".
REQUIREMENTS:
1. Include realistic numerical calculation problems with specific numbers and units.
2. Align questions with Bloom's Taxonomy and Course Outcomes (CO1-CO5).
3. Each question must have 4 distinct options and exactly one correctIndex (0-3).
4. Return ONLY a valid JSON array like this:
[
  {
    "question": "For a discrete-time system operating under...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Step 1: ... Step 2: ...",
    "difficulty": "easy",
    "bloomLevel": "understand",
    "courseOutcome": "CO1"
  }
]
Ensure the ${countNeeded} questions include a balanced mix of difficulties: 2 "easy" (remember/understand), 2 "medium" (apply), and 1 "hard" (analyze/evaluate).`;

    try {
        const res = await callWithFallback({
            userQuery: prompt,
            systemPrompt: 'You are the iMentor Local LLM Assessment Engine. Output valid JSON array only.',
            preferLocalFirst: true,
            options: { maxOutputTokens: 3500, temperature: 0.6, thinking: false }
        });
        const responseText = (res && typeof res === 'object') ? (res.text || res.content || JSON.stringify(res)) : String(res || '');
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const safeJsonStr = jsonMatch[0].replace(/(?<!\\)\\(?=[a-zA-Z]{2,})/g, "\\\\").replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, "\\\\");
            const parsed = JSON.parse(safeJsonStr);
            if (Array.isArray(parsed)) {
                return parsed
                    .filter(q => q && q.question && Array.isArray(q.options) && q.options.length >= 2)
                    .map((q, idx) => {
                        const cIdx = typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < q.options.length ? q.correctIndex : 0;
                        return {
                            id: `${String(courseCode || 'course').toLowerCase()}_llm_gen_${Date.now()}_${idx}`,
                            question: q.question,
                            options: q.options,
                            correctIndex: cIdx,
                            correctAnswer: q.options[cIdx] || q.options[0] || '',
                            explanation: q.explanation || '',
                            difficulty: ['easy', 'medium', 'hard'].includes(String(q.difficulty || '').toLowerCase()) ? String(q.difficulty).toLowerCase() : (idx < 2 ? 'easy' : idx < 4 ? 'medium' : 'hard'),
                            bloomLevel: ['remember', 'understand', 'apply', 'analyze', 'evaluate'].includes(String(q.bloomLevel || '').toLowerCase()) ? String(q.bloomLevel).toLowerCase() : (idx < 2 ? 'understand' : idx < 4 ? 'apply' : 'analyze'),
                            courseOutcome: q.courseOutcome || 'CO1',
                            course: courseCode,
                            subtopic: levelName,
                            generatedBy: 'llm'
                        };
                    });
            }
        }
    } catch (err) {
        log.warn('ACTIVE_VALIDATOR', `LLM prompt execution error: ${err.message}`);
    }
    return [];
}

module.exports = {
    validateAndGenerateFreshQuestions,
    synthesizeFreshQuestionsWithLocalLLM,
    shuffleQuestionOptions,
    sanitizeQuestionsForClient,
    storeActiveAssessmentAttempt,
    gradeAssessmentSubmission,
    normalizeQuestionText,
    normalizeQuestionAlphaNum
};
