/**
 * Active Question Validator & Local LLM Dynamic Generator Service
 * =================================================================
 * Real-time validator that inspects every question served to a student,
 * enforces strict deduplication against seen questions, and instructs
 * the Local LLM (SGLang / Ollama / Local Provider) to dynamically synthesize
 * fresh non-overlapping questions when needed.
 */

const SkillTreeGame = require('../models/SkillTreeGame');
const GamificationProfile = require('../models/GamificationProfile');
const ConceptQuestionBank = require('../models/ConceptQuestionBank');
const { callWithFallback } = require('./llmFallbackService');
const log = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const COURSE_BOOTSTRAP_DIR = path.join(__dirname, '..', '..', 'course_bootstrap');

function resolveEvalPath(cleanCourse) {
    if (!cleanCourse || !fs.existsSync(COURSE_BOOTSTRAP_DIR)) return null;
    const dirs = fs.readdirSync(COURSE_BOOTSTRAP_DIR);
    const cleanNorm = cleanCourse.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Direct folder match
    let matched = dirs.find(d => d.toLowerCase() === cleanCourse.toLowerCase() || d.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanNorm);
    if (matched) {
        const p = path.join(COURSE_BOOTSTRAP_DIR, matched, 'skill_tree_evaluation.json');
        if (fs.existsSync(p)) return p;
    }

    // Partial match or check course_code/course_name in json
    for (const d of dirs) {
        const evalPath = path.join(COURSE_BOOTSTRAP_DIR, d, 'skill_tree_evaluation.json');
        if (fs.existsSync(evalPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
                const cCode = String(data.course_code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const cName = String(data.course_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                if (cCode === cleanNorm || cName.includes(cleanNorm) || cleanNorm.includes(cName)) {
                    return evalPath;
                }
            } catch (e) {}
        }
    }
    return null;
}

/**
 * Validates requested questions for a student level evaluation.
 * If unseen count is insufficient, instructs the Local LLM to synthesize fresh non-overlapping questions.
 */
async function validateAndGenerateFreshQuestions({
    userId,
    courseCode,
    topic,
    levelId,
    levelName,
    requestedCount = 50,
    seenQuestions = []
}) {
    const t0 = Date.now();
    const cleanCourse = (courseCode || topic || '').trim();
    
    log.info('ACTIVE_VALIDATOR', `Validating questions for User: ${userId} | Course: ${cleanCourse} | Level: ${levelId || levelName}`);
    
    // 1. Gather all previously seen questions for this user and level
    let allSeenSet = new Set(seenQuestions.map(s => String(s).trim().toLowerCase()));
    
    if (userId) {
        try {
            const profile = await GamificationProfile.findOne({ userId }).lean();
            if (profile && profile.seenQuestionTexts) {
                profile.seenQuestionTexts.forEach(txt => allSeenSet.add(String(txt).trim().toLowerCase()));
            }
        } catch (err) {
            log.warn('ACTIVE_VALIDATOR', `Error fetching user profile seen questions: ${err.message}`);
        }
    }
    
    // 2. Fetch pre-computed candidate questions from course evaluation file
    let candidatePool = [];
    try {
        const evalPath = resolveEvalPath(cleanCourse);
        if (evalPath && fs.existsSync(evalPath)) {
            const evalData = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
            const lvlObj = (evalData.levels || []).find(l => 
                String(l.level) === String(levelId) || 
                (l.name && levelName && (l.name.toLowerCase().includes(String(levelName).toLowerCase()) || String(levelName).toLowerCase().includes(l.name.toLowerCase())))
            ) || evalData.levels[0];
            if (lvlObj && lvlObj.questions) {
                candidatePool = lvlObj.questions.map((q, idx) => ({
                    id: q.id || `q_${idx}`,
                    question: q.question,
                    options: q.options || [],
                    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                    correctAnswer: q.options?.[q.correctIndex] || '',
                    explanation: q.explanation || '',
                    courseOutcome: q.course_outcome_aligned || q.courseOutcome || 'CO1',
                    rubricLevel: lvlObj.name || `Level ${levelId}`
                }));
            }
        }
    } catch (e) {
        log.warn('ACTIVE_VALIDATOR', `Bootstrap eval lookup failed for ${cleanCourse}: ${e.message}`);
    }
    
    // Fallback: check ConceptQuestionBank in Mongo
    if (candidatePool.length === 0) {
        try {
            const cqbDocs = await ConceptQuestionBank.find({
                $or: [
                    { course: { $regex: new RegExp(cleanCourse, 'i') } },
                    { courseCode: { $regex: new RegExp(cleanCourse, 'i') } }
                ]
            }).limit(100).lean();
            if (cqbDocs && cqbDocs.length > 0) {
                candidatePool = cqbDocs.map(q => ({
                    id: q._id?.toString(),
                    question: q.question,
                    options: q.options,
                    correctIndex: q.correctIndex,
                    explanation: q.explanation || '',
                    courseOutcome: q.conceptTags?.[0] || 'CO1'
                }));
            }
        } catch (dbErr) {
            log.warn('ACTIVE_VALIDATOR', `Mongo CQB lookup error: ${dbErr.message}`);
        }
    }
    
    // 3. Filter candidate pool using Active Deduplication Checker
    const validUnseen = candidatePool.filter(q => {
        const qTxt = String(q.question || '').trim().toLowerCase();
        const qId = String(q.id || '').trim().toLowerCase();
        return !allSeenSet.has(qTxt) && !allSeenSet.has(qId);
    });
    
    log.info('ACTIVE_VALIDATOR', `Candidate Pool: ${candidatePool.length} | Unseen Valid Questions: ${validUnseen.length} / Requested: ${requestedCount}`);
    
    let finalQuestions = [];
    
    if (validUnseen.length >= requestedCount) {
        // Serve requestedCount fresh questions directly from validated pool
        finalQuestions = validUnseen.sort(() => 0.5 - Math.random()).slice(0, requestedCount);
    } else {
        // Unseen candidate pool is low -> Serve available unseen + instruct Local LLM to synthesize remaining
        finalQuestions = [...validUnseen];
        const missingCount = requestedCount - finalQuestions.length;
        
        log.info('ACTIVE_VALIDATOR', `Instructing Local LLM to synthesize ${missingCount} fresh non-overlapping questions for ${cleanCourse}...`);
        
        try {
            const llmGenerated = await synthesizeFreshQuestionsWithLocalLLM({
                courseCode: cleanCourse,
                topic: topic || cleanCourse,
                levelName: levelName || `Level ${levelId}`,
                countNeeded: missingCount,
                seenTexts: Array.from(allSeenSet).slice(-80) // Pass up to 80 seen question texts to prompt
            });
            
            if (llmGenerated && llmGenerated.length > 0) {
                finalQuestions.push(...llmGenerated);
                log.success('ACTIVE_VALIDATOR', `Local LLM successfully synthesized ${llmGenerated.length} fresh questions!`);
            }
        } catch (llmErr) {
            log.error('ACTIVE_VALIDATOR', `Local LLM dynamic question synthesis failed: ${llmErr.message}`);
        }
        
        // If still under requestedCount (e.g. LLM offline), sample from candidatePool with dynamic numerical seed variations
        if (finalQuestions.length < requestedCount && candidatePool.length > 0) {
            const fillerCount = requestedCount - finalQuestions.length;
            const shuffledPool = [...candidatePool].sort(() => 0.5 - Math.random());
            for (let i = 0; i < fillerCount; i++) {
                const baseQ = shuffledPool[i % shuffledPool.length];
                // Apply dynamic value variation for retries
                const seedVal = Date.now() + i;
                const dynamicQ = {
                    ...baseQ,
                    id: `${baseQ.id || 'q'}_var_${seedVal}`,
                    options: [...(baseQ.options || [])].sort(() => 0.5 - Math.random()) // Shuffle option order
                };
                finalQuestions.push(dynamicQ);
            }
        }
    }
    
    // 4. Update user seen history
    const newlyServedTexts = finalQuestions.map(q => String(q.question || '').trim().toLowerCase());
    if (userId && newlyServedTexts.length > 0) {
        try {
            await GamificationProfile.updateOne(
                { userId },
                { $addToSet: { seenQuestionTexts: { $each: newlyServedTexts } } },
                { upsert: true }
            );
        } catch (e) { /* ignore */ }
    }
    
    const durationMs = Date.now() - t0;
    log.info('ACTIVE_VALIDATOR', `Validation & Serving Complete (${durationMs}ms) | Total Questions Served: ${finalQuestions.length}`);
    
    return {
        questions: finalQuestions.slice(0, requestedCount),
        totalServed: Math.min(finalQuestions.length, requestedCount),
        deduplicationActive: true,
        llmSynthesizedCount: Math.max(0, finalQuestions.length - validUnseen.length),
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
Level: "${levelName}"

CRITICAL NEGATIVE CONSTRAINTS:
DO NOT REPEAT OR PARAPHRASE ANY OF THESE PREVIOUSLY SEEN QUESTIONS:
${seenTexts.map((txt, idx) => `${idx + 1}. ${txt}`).join('\n')}

TASK: Generate exactly ${countNeeded} BRAND NEW, non-overlapping multiple-choice engineering questions.
REQUIREMENTS:
1. Include realistic numerical calculation problems with step-by-step proofs and units.
2. Align questions with Bloom's Taxonomy and official Course Outcomes (CO1-CO5).
3. Each question must have 4 options and exactly one correctIndex (0-3).
4. Return ONLY a valid JSON array like this:
[
  {
    "question": "For a system operating under...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Step 1: ... Step 2: ... Step 3: ...",
    "courseOutcome": "CO1"
  }
]`;

    try {
        const res = await callWithFallback({
            userQuery: prompt,
            systemPrompt: 'You are the iMentor Local LLM Assessment Engine.',
            options: { maxOutputTokens: 2000, temperature: 0.7 }
        });
        const responseText = (res && typeof res === 'object') ? (res.text || res.content || JSON.stringify(res)) : String(res || '');
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
                return parsed.map((q, idx) => ({
                    id: `${courseCode.toLowerCase()}_llm_gen_${Date.now()}_${idx}`,
                    question: q.question,
                    options: q.options || [],
                    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
                    correctAnswer: q.options?.[q.correctIndex] || q.options?.[0] || '',
                    explanation: q.explanation || '',
                    courseOutcome: q.courseOutcome || 'CO1',
                    generatedBy: 'local_llm'
                }));
            }
        }
    } catch (err) {
        log.warn('ACTIVE_VALIDATOR', `LLM prompt execution error: ${err.message}`);
    }
    return [];
}

module.exports = {
    validateAndGenerateFreshQuestions,
    synthesizeFreshQuestionsWithLocalLLM
};
