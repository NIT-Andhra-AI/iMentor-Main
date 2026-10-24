const GamificationProfile = require('../models/GamificationProfile');
const StudentKnowledgeState = require('../models/StudentKnowledgeState');
const User = require('../models/User');
const { selectLLM } = require('./llmRouterService');
const geminiService = require('./geminiService');
const sglangService = require('./sglangService');
const groqService = require('./groqService');
const rewardService = require('./rewardService');
const log = require('../utils/logger');
const socketService = require('./socketService');


/**
 * Evaluate answer quality using AI analysis
 * @param {string} userMessage - The user's question/message
 * @param {string} aiResponse - The AI's response
 * @param {object} context - Additional context (sessionId, topic, etc.)
 * @returns {Promise<{score: number, reasoning: string}>}
 */
async function evaluateAnswerQuality(userMessage, aiResponse, context = {}) {
    try {
        const { user, topic = 'general' } = context;

        const prompt = `You are analyzing a student's learning interaction to determine the quality of their engagement.

Student Question/Message: "${userMessage}"

AI Tutor's Response: "${aiResponse}"

Analyze the student's question/message and rate their learning quality on this scale:
- Score 1 (Rote): Simple fact recall, memorization questions, yes/no queries
- Score 3 (Understanding): Shows reasoning, asks "why/how" questions, seeks clarification, explains concepts
- Score 10 (Application): Applies concepts to new problems, synthesizes ideas, transfers learning to novel scenarios

Return ONLY a JSON object in this exact format:
{
  "score": <1 or 3 or 10>,
  "reasoning": "brief explanation (max 50 words)"
}`;

        // Use LLM router to select best model
        const { chosenModel } = await selectLLM(prompt, { user, subject: topic });

        let evaluationText;
        let generationSuccess = false;

        // Try SGLang first (fast constrained JSON without <think> overhead so background XP never hogs classroom GPU)
        if (chosenModel.provider === 'sglang') {
            try {
                evaluationText = await sglangService.generateContentWithHistory([], prompt, null, {
                    model: chosenModel.modelId,
                    temperature: 0.1,
                    maxTokens: 120,
                    enableThinking: false,
                    jsonMode: true
                });
                generationSuccess = true;
            } catch (sglangError) {
                log.warn('SYSTEM', `SGLang evaluation failed: ${sglangError.message}`);
            }
            if (process.env.LOCAL_GPU_ONLY !== 'false' && !generationSuccess) {
                return { score: 1, reasoning: 'local_gpu_busy_fallback' };
            }
        }

        else if (chosenModel.provider === 'groq') {
            try {
                // log.info('SYSTEM', "Attempting evaluation with Groq...");
                const apiKey = process.env.GROQ_API_KEY;
                if (!apiKey) {
                    throw new Error('Groq API key not configured');
                }
                evaluationText = await groqService.generateContentWithHistory([], prompt, null, {
                    model: chosenModel.modelId || 'llama-3.1-8b-instant',
                    apiKey: apiKey,
                    temperature: 0.3
                });
                generationSuccess = true;
                // log.success('SYSTEM', "Groq evaluation successful");
            } catch (groqError) {
                log.info('SYSTEM', "Falling back from Groq...");
            }
        }

        // Fallback to Gemini if Ollama failed or if Gemini was selected
        if (!generationSuccess) {
            try {
                // log.info('SYSTEM', "Attempting evaluation with Gemini...");
                const apiKey = process.env.GEMINI_API_KEY;
                if (!apiKey) {
                    log.error('SYSTEM', 'GEMINI_API_KEY not found');
                    return { score: 1, reasoning: 'rote' };
                }
                evaluationText = await geminiService.generateContentWithHistory(
                    [],      // empty chat history
                    prompt,  // the evaluation prompt
                    null,    // no system prompt
                    { temperature: 0.3, apiKey, maxOutputTokens: 200 }  // options with API key
                );
                generationSuccess = true;
                // log.success('SYSTEM', "Gemini evaluation successful");
            } catch (geminiError) {
            log.error('SYSTEM', 'Evaluation failed across providers');
            }
        }

        // Parse JSON response
        const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            log.warn('SYSTEM', 'Failed to parse AI evaluation response');
            return { score: 1, reasoning: 'rote' };
        }

        const evaluation = JSON.parse(jsonMatch[0]);

        // Validate score
        if (![1, 3, 10].includes(evaluation.score)) {
            evaluation.score = 1;
        }

        // log.info('SYSTEM', `Quality: ${evaluation.score} credits`);
        return evaluation;

    } catch (error) {
        log.error('SYSTEM', 'Quality evaluation error', error);
        // Fallback to basic evaluation
        return { score: 1, reasoning: 'rote' };
    }
}

/**
 * Award Learning Credits to a user and update their profile
 * @param {string} userId - User ID
 * @param {number} creditsAmount - Amount of Learning Credits to award
 * @param {string} reason - Reason for Learning Credits award
 * @param {string} topic - Related topic
 * @returns {Promise<{newCredits: number, newLevel: number, leveledUp: boolean}>}
 */

const BLOOM_LABELS = {
    1: 'L1: Remember',
    2: 'L2: Understand',
    3: 'L3: Apply',
    4: 'L4: Analyze',
    5: 'L5: Evaluate',
    6: 'L6: Create'
};

const NON_CONCEPT_REASONS = new Set([
    'streak_bonus',
    'bug_bounty',
    'bounty_verified',
    'bounty_submission',
    'daily_login',
    'referral'
]);

// Track recent XP awards in-memory for 3 seconds to prevent double-counting when legacy callers invoke both awardXP and awardLearningCredits
const recentXPAwardGuard = new Map();

function normalizeQueryFingerprint(text = '') {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !/^(what|how|why|can|you|please|explain|tell|about|the|for|and|with|from)$/.test(w))
        .slice(0, 14)
        .join('_');
}

/**
 * Extracts a clean academic concept name and Bloom's Taxonomy level (1..6)
 * from a student query, topic, and optional cognitiveLevel.
 */
function extractConceptAndBloom(queryText = '', fallbackTopic = 'general', courseHint = '', cognitiveLevel = '') {
    const rawTopic = String(fallbackTopic || '').trim();
    const rawCourse = String(courseHint || '').trim();
    const q = String(queryText || '').trim();

    // 1. Determine Bloom level (1..6)
    let bloomLevel = 1;
    const cogStr = String(cognitiveLevel || '').toUpperCase();
    if (cogStr.includes('L4') || cogStr.includes('EVALUAT') || cogStr.includes('CREAT')) bloomLevel = 5;
    else if (cogStr.includes('L3') || cogStr.includes('CRITICAL') || cogStr.includes('ANALYZ')) bloomLevel = 4;
    else if (cogStr.includes('L2') || cogStr.includes('APPLIC') || cogStr.includes('APPLY')) bloomLevel = 3;
    else if (cogStr.includes('L1') || cogStr.includes('UNDERSTAND')) bloomLevel = 2;

    if (q) {
        const lq = q.toLowerCase();
        if (/\b(design|synthesize|propose a new|architect|invent|formulate a new)\b/i.test(lq)) {
            bloomLevel = Math.max(bloomLevel, 6);
        } else if (/\b(evaluate|critique|justify|assess trade-offs|pros and cons|optimal choice)\b/i.test(lq)) {
            bloomLevel = Math.max(bloomLevel, 5);
        } else if (/\b(derive|prove|analyze|compare|contrast|differentiate|stability|why does|time complexity|convergence)\b/i.test(lq)) {
            bloomLevel = Math.max(bloomLevel, 4);
        } else if (/\b(calculate|compute|solve|find the|implement|write code|simulate|apply|transfer function|matrix)\b/i.test(lq) || /[=+*/^]|\d+\s*(hz|khz|ms|db|rad|ohm|sec|%)/i.test(lq)) {
            bloomLevel = Math.max(bloomLevel, 3);
        } else if (/\b(explain|summarize|describe|how does|working of|overview|intuition)\b/i.test(lq)) {
            bloomLevel = Math.max(bloomLevel, 2);
        }
    }

    // 2. Determine clean Academic Concept Name
    const isGenericTopic = !rawTopic || /^(general|direct_answer|chat|understanding|application|tutor_turn|ee\d+|cs\d+|ec\d+|operating systems|machine learning|control systems|digital signal processing|probability.*|data structures.*)$/i.test(rawTopic);

    let conceptName = rawTopic;
    if (isGenericTopic && q) {
        let cleaned = q
            .replace(/^(hi+|hello+|hey+|good\s+\w+|please|can you|could you|i want to know|i need help with|tell me about|let'?s learn|help me understand)[,!\s]*/i, '')
            .replace(/^(what\s+is\s+(the\s+|a\s+|an\s+)?|what\s+are\s+(the\s+)?|explain\s+(the\s+)?|define\s+(the\s+)?|derive\s+(the\s+)?|calculate\s+(the\s+)?|how\s+does\s+|how\s+to\s+|why\s+does\s+|why\s+is\s+|compare\s+and\s+contrast\s+|compare\s+|difference\s+between\s+)/i, '')
            .replace(/[?.!]+$/g, '')
            .replace(/\s+(step-by-step|in detail|with example.*|briefly|clearly|in simple terms)$/i, '')
            .trim();

        const words = cleaned.split(/\s+/).filter(Boolean);
        if (words.length > 7) {
            cleaned = words.slice(0, 6).join(' ');
        }
        if (cleaned.length >= 3) {
            conceptName = cleaned.replace(/\b[a-z]/g, c => c.toUpperCase());
        }
    }

    if (!conceptName || conceptName.length < 2 || /^(general|direct_answer|understanding|application)$/i.test(conceptName)) {
        conceptName = rawCourse || 'General Engineering Concept';
    }

    // Normalize dot/snake case concept identifiers (e.g., "control_systems.state_space_controllability")
    if (conceptName.includes('.') || conceptName.includes('_')) {
        const parts = conceptName.split('.');
        const leaf = parts[parts.length - 1].replace(/_/g, ' ');
        conceptName = leaf.replace(/\b[a-z]/g, c => c.toUpperCase());
    }

    const resolvedCourse = rawCourse || (rawTopic && !isGenericTopic ? 'Course Curriculum' : (rawTopic || 'General'));

    return {
        conceptName: conceptName.slice(0, 75).trim(),
        course: resolvedCourse,
        bloomLevel,
        bloomLabel: BLOOM_LABELS[bloomLevel] || 'L1: Remember',
        queryHash: normalizeQueryFingerprint(q)
    };
}

/**
 * Evaluates and updates the Student's Concept Mind Map (StudentKnowledgeState)
 * before awarding XP. Prevents XP farming on already-mastered concepts at the same/lower
 * Bloom level while rewarding cognitive progression (L1 -> L3/L4) and spaced repetition.
 */
async function evaluateAndRecordMindMapXP(userId, rawXpAmount, reason = 'understanding', topic = 'general', options = {}) {
    const rawXP = Math.max(0, Math.round(Number(rawXpAmount) || 0));
    if (!userId || rawXP <= 0 || options.skipMindMap === true || NON_CONCEPT_REASONS.has(reason)) {
        return {
            effectiveXP: rawXP,
            rawXP,
            xpMultiplier: 1.0,
            gateStatus: 'bypass_non_concept',
            gateMessage: null,
            conceptName: topic || 'general',
            bloomLevel: 1,
            masteryScore: null
        };
    }

    try {
        const { queryText = '', course = '', cognitiveLevel = '' } = options;
        const { conceptName, course: resolvedCourse, bloomLevel, bloomLabel, queryHash } = extractConceptAndBloom(
            queryText,
            topic,
            course,
            cognitiveLevel
        );

        let knowledgeState = await StudentKnowledgeState.findOne({ userId });
        if (!knowledgeState) {
            knowledgeState = new StudentKnowledgeState({ userId, concepts: [] });
        }

        const existingConcept = knowledgeState.getConcept(conceptName);
        const now = new Date();
        const isHighStakesCompletion = ['skill_tree_completion', 'milestone_boss_completion', 'boss_battle', 'bounty_completed', 'bounty_question'].includes(reason);
        const effectiveBloom = isHighStakesCompletion ? Math.max(bloomLevel, 3) : bloomLevel;

        let effectiveXP = rawXP;
        let xpMultiplier = 1.0;
        let gateStatus = 'new_concept_full_xp';
        let gateMessage = null;
        let masteryDelta = isHighStakesCompletion ? 30 : 22;

        if (existingConcept) {
            const prevMastery = Number(existingConcept.masteryScore || 0);
            const prevBloom = Number(existingConcept.highestBloomLevel || 1);
            const recentHashes = Array.isArray(existingConcept.recentQueryHashes) ? existingConcept.recentQueryHashes : [];
            const lastDate = existingConcept.lastInteractionDate ? new Date(existingConcept.lastInteractionDate) : null;
            const daysSinceLast = lastDate ? (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24) : 0;

            // Rule 1: Block exact/near-duplicate query spam on the same concept
            if (queryHash && queryHash.length >= 5 && recentHashes.includes(queryHash) && reason !== 'quality_bonus') {
                effectiveXP = 0;
                xpMultiplier = 0;
                masteryDelta = 0;
                gateStatus = 'duplicate_prompt_blocked';
                gateMessage = `Duplicate query on "${conceptName}" — 0 XP awarded.`;
            }
            // Rule 2: Already Mastered Concept (>= 85% mastery or 'mastered')
            else if (prevMastery >= 85 || existingConcept.understandingLevel === 'mastered') {
                if (effectiveBloom > prevBloom) {
                    // Cognitive Climb! Student moved to a higher Bloom level (e.g. L1 Remember -> L3 Apply)
                    xpMultiplier = 1.25;
                    effectiveXP = Math.max(1, Math.round(rawXP * xpMultiplier));
                    masteryDelta = 10;
                    gateStatus = 'mastered_bloom_upgrade';
                    gateMessage = `Cognitive climb on "${conceptName}" (L${prevBloom} -> L${effectiveBloom})! +25% Depth Bonus XP.`;
                } else if (daysSinceLast >= 7) {
                    // Spaced Repetition Review after >= 7 days
                    effectiveXP = Math.min(rawXP, 5);
                    xpMultiplier = Number((effectiveXP / rawXP).toFixed(2));
                    masteryDelta = 5;
                    existingConcept.spacedReviewCount = (existingConcept.spacedReviewCount || 0) + 1;
                    gateStatus = 'spaced_repetition_review';
                    gateMessage = `Spaced repetition review on "${conceptName}" (+5 XP retention bonus).`;
                } else {
                    // Repeated same/lower Bloom level on an already-mastered concept -> 0 XP!
                    effectiveXP = 0;
                    xpMultiplier = 0;
                    masteryDelta = 0;
                    gateStatus = 'mastered_concept_xp_capped';
                    const nextBloom = Math.min(6, prevBloom + 1);
                    gateMessage = `"${conceptName}" is already Mastered (L${prevBloom}). Ask a higher-order ${BLOOM_LABELS[nextBloom]} question or explore a new concept to earn XP!`;
                }
            }
            // Rule 3: Consolidating / Comfortable Concept (60% - 84% mastery)
            else if (prevMastery >= 60) {
                if (effectiveBloom > prevBloom) {
                    xpMultiplier = 1.25;
                    effectiveXP = Math.max(1, Math.round(rawXP * xpMultiplier));
                    masteryDelta = 22;
                    gateStatus = 'bloom_level_upgrade';
                    gateMessage = `Advanced to ${BLOOM_LABELS[effectiveBloom]} on "${conceptName}" (+25% XP)!`;
                } else {
                    // Diminishing returns (50% XP) for repeating same Bloom tier while consolidating
                    xpMultiplier = 0.5;
                    effectiveXP = Math.max(1, Math.round(rawXP * xpMultiplier));
                    masteryDelta = 12;
                    gateStatus = 'consolidation_diminished_xp';
                    gateMessage = `Consolidating "${conceptName}" at L${effectiveBloom} (50% XP — reach Mastery at 85%).`;
                }
            }
            // Rule 4: Developing Concept (< 60% mastery)
            else {
                if (effectiveBloom >= 3) {
                    xpMultiplier = 1.2;
                    effectiveXP = Math.max(1, Math.round(rawXP * xpMultiplier));
                }
                masteryDelta = 25;
                gateStatus = 'developing_concept_full_xp';
            }

            const newMastery = Math.min(100, prevMastery + masteryDelta);
            const newUnderstanding = newMastery >= 85 ? 'mastered' : newMastery >= 65 ? 'comfortable' : 'learning';
            const updatedHashes = queryHash && queryHash.length >= 5
                ? Array.from(new Set([...recentHashes, queryHash])).slice(-12)
                : recentHashes;

            knowledgeState.updateConcept({
                conceptName: existingConcept.conceptName,
                course: existingConcept.course && existingConcept.course !== 'General' ? existingConcept.course : resolvedCourse,
                masteryScore: newMastery,
                masteryScoreNormalized: Number((newMastery / 100).toFixed(2)),
                understandingLevel: newUnderstanding,
                highestBloomLevel: Math.max(prevBloom, effectiveBloom),
                totalInteractions: (existingConcept.totalInteractions || 0) + 1,
                successfulInteractions: (existingConcept.successfulInteractions || 0) + (effectiveXP > 0 ? 1 : 0),
                totalXPEarnedOnConcept: (existingConcept.totalXPEarnedOnConcept || 0) + effectiveXP,
                recentQueryHashes: updatedHashes,
                lastInteractionDate: now
            });

            if (newUnderstanding === 'mastered') {
                const alreadyInMastered = (knowledgeState.masteredTopics || []).some(
                    m => String(m.topic || '').toLowerCase() === existingConcept.conceptName.toLowerCase()
                );
                if (!alreadyInMastered) {
                    knowledgeState.masteredTopics.push({
                        topic: existingConcept.conceptName,
                        masteredAt: now,
                        shouldReview: false,
                        nextReviewDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                    });
                }
            }

            await knowledgeState.save();

            return {
                effectiveXP,
                rawXP,
                xpMultiplier,
                gateStatus,
                gateMessage,
                conceptName: existingConcept.conceptName,
                bloomLevel: Math.max(prevBloom, effectiveBloom),
                bloomLabel: BLOOM_LABELS[Math.max(prevBloom, effectiveBloom)] || bloomLabel,
                masteryScore: newMastery,
                understandingLevel: newUnderstanding
            };
        } else {
            // Brand-new concept exposure for this student!
            if (effectiveBloom >= 3) {
                xpMultiplier = 1.2;
                effectiveXP = Math.max(1, Math.round(rawXP * xpMultiplier));
            }
            const initialMastery = Math.min(100, Math.max(25, masteryDelta + (effectiveBloom >= 3 ? 10 : 0)));
            const initialUnderstanding = initialMastery >= 85 ? 'mastered' : initialMastery >= 65 ? 'comfortable' : 'learning';

            knowledgeState.updateConcept({
                conceptName,
                course: resolvedCourse,
                category: effectiveBloom >= 4 ? 'advanced' : effectiveBloom === 3 ? 'intermediate' : 'fundamental',
                understandingLevel: initialUnderstanding,
                masteryScore: initialMastery,
                masteryScoreNormalized: Number((initialMastery / 100).toFixed(2)),
                difficulty: effectiveBloom >= 4 ? 'high' : 'medium',
                highestBloomLevel: effectiveBloom,
                totalInteractions: 1,
                successfulInteractions: 1,
                totalXPEarnedOnConcept: effectiveXP,
                recentQueryHashes: queryHash && queryHash.length >= 5 ? [queryHash] : [],
                firstExposureDate: now,
                lastInteractionDate: now
            });

            knowledgeState.engagementMetrics = knowledgeState.engagementMetrics || {};
            knowledgeState.engagementMetrics.totalConceptsExplored = (knowledgeState.concepts || []).length;
            knowledgeState.engagementMetrics.lastActiveDate = now;

            await knowledgeState.save();

            return {
                effectiveXP,
                rawXP,
                xpMultiplier,
                gateStatus: 'new_concept_full_xp',
                gateMessage: `New concept added to your Mind Map: "${conceptName}" (${BLOOM_LABELS[effectiveBloom]})`,
                conceptName,
                bloomLevel: effectiveBloom,
                bloomLabel: BLOOM_LABELS[effectiveBloom] || bloomLabel,
                masteryScore: initialMastery,
                understandingLevel: initialUnderstanding
            };
        }
    } catch (err) {
        log.warn('SYSTEM', `Mind-Map XP gate fallback: ${err.message}`);
        return {
            effectiveXP: rawXP,
            rawXP,
            xpMultiplier: 1.0,
            gateStatus: 'fallback_ungated',
            gateMessage: null,
            conceptName: topic || 'general',
            bloomLevel: 1,
            masteryScore: null
        };
    }
}

/**
 * Returns the student's formatted Concept Mind Map & Anti-Farm XP status.
 */
async function getStudentMindMap(userId) {
    try {
        const ks = await StudentKnowledgeState.findOne({ userId }).lean();
        const rawConcepts = Array.isArray(ks?.concepts) ? ks.concepts : [];

        const formatted = rawConcepts
            .filter(c => c && c.conceptName && !/^(general|direct_answer|chat|i would like|hi\b|hello\b|can you|please|help me|so\s+phase\s+margin)/i.test(c.conceptName.trim()))
            .map(c => {
                const mastery = Math.round(Number(c.masteryScore || 0));
                const bloom = Math.max(1, Math.min(6, Number(c.highestBloomLevel || 1)));
                const level = mastery >= 85 ? 'mastered' : mastery >= 60 ? 'comfortable' : 'learning';
                const nextBloom = Math.min(6, bloom + 1);
                let xpStatus = '100% XP (Active Learning)';
                if (level === 'mastered') {
                    xpStatus = bloom < 6
                        ? `0 XP at L1–L${bloom} (Mastered) · Ask ${BLOOM_LABELS[nextBloom]}+ for 125% XP`
                        : 'Mastered at L6 (Spaced Review +5 XP after 7d)';
                } else if (level === 'comfortable') {
                    xpStatus = `50% XP at L1–L${bloom} · 125% XP at ${BLOOM_LABELS[nextBloom]}+`;
                }

                return {
                    conceptName: c.conceptName.includes('.') || c.conceptName.includes('_') ? c.conceptName.split('.').map(p => p.replace(/_/g, ' ').trim().replace(/\b[a-z]/g, l => l.toUpperCase())).join(' › ') : c.conceptName,
                    course: c.course || 'General',
                    masteryScore: mastery,
                    understandingLevel: level,
                    highestBloomLevel: bloom,
                    bloomLabel: BLOOM_LABELS[bloom] || 'L1: Remember',
                    totalInteractions: c.totalInteractions || 1,
                    totalXPEarned: c.totalXPEarnedOnConcept || 0,
                    xpStatus,
                    lastInteractionDate: c.lastInteractionDate || c.updatedAt || null
                };
            })
            .sort((a, b) => {
                const da = a.lastInteractionDate ? new Date(a.lastInteractionDate).getTime() : 0;
                const db = b.lastInteractionDate ? new Date(b.lastInteractionDate).getTime() : 0;
                if (db !== da) return db - da;
                return b.masteryScore - a.masteryScore;
            });

        const masteredCount = formatted.filter(c => c.understandingLevel === 'mastered').length;
        const comfortableCount = formatted.filter(c => c.understandingLevel === 'comfortable').length;
        const learningCount = formatted.filter(c => c.understandingLevel === 'learning').length;
        const avgMastery = formatted.length > 0
            ? Math.round(formatted.reduce((s, c) => s + c.masteryScore, 0) / formatted.length)
            : 0;
        const highestBloomReached = formatted.length > 0
            ? Math.max(...formatted.map(c => c.highestBloomLevel))
            : 1;

        return {
            summary: {
                totalConcepts: formatted.length,
                masteredCount,
                comfortableCount,
                learningCount,
                averageMastery: avgMastery,
                highestBloomReached,
                highestBloomLabel: BLOOM_LABELS[highestBloomReached] || 'L1: Remember'
            },
            concepts: formatted
        };
    } catch (err) {
        log.warn('SYSTEM', `getStudentMindMap error: ${err.message}`);
        return {
            summary: { totalConcepts: 0, masteredCount: 0, comfortableCount: 0, learningCount: 0, averageMastery: 0, highestBloomReached: 1, highestBloomLabel: 'L1: Remember' },
            concepts: []
        };
    }
}

async function awardLearningCredits(userId, creditsAmount, reason, topic = '', options = {}) {
    try {
        const guard = recentXPAwardGuard.get(String(userId));
        if (guard && (Date.now() - guard.timestamp) < 3500) {
            // Already awarded & synced via awardXP() in the same turn
            const profile = await getOrCreateProfile(userId);
            return {
                newCredits: profile.totalLearningCredits,
                newLevel: profile.level,
                leveledUp: false,
                creditsForNextLevel: profile.getCreditsForNextLevel()
            };
        }
        const xpRes = await awardXP(userId, creditsAmount, reason, topic, options);
        const profile = await getOrCreateProfile(userId);
        return {
            newCredits: profile.totalLearningCredits,
            newLevel: xpRes.newLevel,
            leveledUp: xpRes.leveledUp,
            creditsForNextLevel: profile.getCreditsForNextLevel()
        };
    } catch (error) {
        log.error('SYSTEM', 'Error awarding credits', error);
        throw error;
    }
}

/**
 * Award XP points to a user and update XP-related fields
 * @param {string} userId
 * @param {number} xpAmount
 * @param {string} reason
 * @param {string} topic
 */
async function awardXP(userId, xpAmount, reason = 'application', topic = '', options = {}) {
    try {
        const mindMapGate = await evaluateAndRecordMindMapXP(userId, xpAmount, reason, topic, options);
        const effectiveAmount = Math.round(mindMapGate.effectiveXP);
        const resolvedTopic = mindMapGate.conceptName || topic || 'general';

        // Record guard so a paired awardLearningCredits() call within 3s doesn't double-award
        recentXPAwardGuard.set(String(userId), { timestamp: Date.now(), effectiveAmount, reason, topic: resolvedTopic });

        let profile = await GamificationProfile.findOne({ userId });
        if (!profile) {
            profile = new GamificationProfile({ userId });
        }

        const oldXP = profile.totalXP || 0;
        const oldXPLevel = profile.xpLevel || 1;

        if (effectiveAmount <= 0) {
            // Concept is already mastered at this Bloom level or duplicate prompt — do not inflate XP!
            socketService.emitToUser(userId, 'xp_capped', {
                rawAmount: xpAmount,
                effectiveAmount: 0,
                reason,
                topic: resolvedTopic,
                gateStatus: mindMapGate.gateStatus,
                message: mindMapGate.gateMessage || 'Concept already mastered at this cognitive level.'
            });
            return {
                newXP: oldXP,
                newXPLevel: oldXPLevel,
                newLevel: oldXPLevel,
                leveledUp: false,
                effectiveXP: 0,
                mindMapGate
            };
        }

        profile.totalXP = oldXP + effectiveAmount;
        profile.totalLearningCredits = profile.totalXP;

        profile.xpHistory = profile.xpHistory || [];
        profile.xpHistory.push({ amount: effectiveAmount, reason, topic: resolvedTopic, timestamp: new Date() });
        if (profile.xpHistory.length > 100) profile.xpHistory = profile.xpHistory.slice(-100);

        profile.learningCreditsHistory = profile.learningCreditsHistory || [];
        profile.learningCreditsHistory.push({ amount: effectiveAmount, reason, topic: resolvedTopic, timestamp: new Date() });
        if (profile.learningCreditsHistory.length > 100) profile.learningCreditsHistory = profile.learningCreditsHistory.slice(-100);

        const newXPLevel = profile.calculateXPLevel();
        profile.xpLevel = newXPLevel;
        profile.level = newXPLevel;
        profile.lastActiveDate = new Date();

        await profile.save();
        try {
            await User.findByIdAndUpdate(userId, { level: newXPLevel });
        } catch (_) {}

        socketService.emitToUser(userId, 'xp_awarded', {
            amount: effectiveAmount,
            rawAmount: xpAmount,
            newTotal: profile.totalXP,
            newLevel: newXPLevel,
            reason,
            topic: resolvedTopic,
            mindMapGate
        });

        try {
            await rewardService.recordCreditAward(userId, effectiveAmount, reason, resolvedTopic, 'xp', {
                xpLevel: newXPLevel,
                gateStatus: mindMapGate.gateStatus,
                bloomLevel: mindMapGate.bloomLevel,
                masteryScore: mindMapGate.masteryScore
            });
        } catch (auditErr) {
            log.warn('SYSTEM', 'XP audit record failed', auditErr);
        }

        return {
            newXP: profile.totalXP,
            newXPLevel,
            newLevel: newXPLevel,
            leveledUp: newXPLevel > oldXPLevel,
            effectiveXP: effectiveAmount,
            mindMapGate
        };
    } catch (error) {
        log.error('SYSTEM', 'XP award failure', error);
        throw error;
    }
}

/**
 * Get or create user's gamification profile
 * @param {string} userId - User ID
 * @returns {Promise<GamificationProfile>}
 */
async function getOrCreateProfile(userId) {
    try {
        let profile = await GamificationProfile.findOne({ userId });

        if (!profile) {
            profile = new GamificationProfile({ userId });
            await profile.save();

            // Also ensure User.level is set
            const User = require('../models/User');
            await User.findByIdAndUpdate(userId, { level: 1 });

            // log.info('SYSTEM', `Created profile for ${userId}`);
        } else {
            // Migrate old XP data to Learning Credits if needed
            let needsSave = false;

            if ((profile.totalXP > 0 || profile.totalXP === 0) && !profile.totalLearningCredits) {
                profile.totalLearningCredits = profile.totalXP || 0;
                needsSave = true;
                // log.info('SYSTEM', `Migrated XP for ${userId}`);
            }

            const calcXpLvl = profile.calculateXPLevel();
            if (profile.xpLevel !== calcXpLvl) {
                profile.xpLevel = calcXpLvl;
                needsSave = true;
            }

            if (needsSave) {
                await profile.save();
            }
        }

        return profile;
    } catch (error) {
        log.error('SYSTEM', 'Profile get/create failure', error);
        throw error;
    }
}

/**
 * Get leaderboard for a specific topic
 * @param {string} topic - Topic name
 * @param {number} limit - Number of top users to return
 * @returns {Promise<Array>}
 */
async function getTopicLeaderboard(topic, limit = 10) {
    try {
        // Find all profiles that have score for this topic
        const profiles = await GamificationProfile.find({
            [`topicScores.${topic}`]: { $exists: true }
        })
            .populate('userId', 'profile.name email')
            .sort({ [`topicScores.${topic}`]: -1 })
            .limit(limit)
            .lean();

        return profiles.map((p, index) => ({
            rank: index + 1,
            userId: p.userId._id,
            name: p.userId.profile?.name || 'Anonymous',
            score: p.topicScores.get(topic) || 0,
            level: p.level,
            totalLearningCredits: p.totalLearningCredits
        }));

    } catch (error) {
        log.error('SYSTEM', 'Leaderboard fetch failure', error);
        return [];
    }
}

/**
 * Update topic score for leaderboard
 * @param {string} userId - User ID
 * @param {string} topic - Topic name
 * @param {number} score - Score to set
 */
async function updateTopicScore(userId, topic, score) {
    try {
        const profile = await getOrCreateProfile(userId);

        const currentScore = profile.topicScores.get(topic) || 0;

        // Only update if new score is higher
        if (score > currentScore) {
            profile.topicScores.set(topic, score);
            await profile.save();
            log.info('SYSTEM', `Updated topic score for ${userId} in ${topic}`);
        }

    } catch (error) {
        log.error('SYSTEM', 'Topic score update failure', error);
    }
}

/**
 * Award a badge to a user
 * @param {string} userId - User ID
 * @param {string} badgeId - Badge identifier
 * @param {string} badgeName - Badge display name
 */
async function awardBadge(userId, badgeId, badgeName) {
    try {
        const profile = await getOrCreateProfile(userId);

        // Check if badge already earned
        const alreadyHas = profile.badges.some(b => b.badgeId === badgeId);
        if (alreadyHas) {
            // log.info('SYSTEM', `User ${userId} already has badge ${badgeId}`);
            return false;
        }

        profile.badges.push({
            badgeId,
            name: badgeName,
            earnedAt: new Date()
        });

        await profile.save();
        log.info('SYSTEM', `Awarded badge ${badgeId} to ${userId}`);

        // Emit badge earned event via socket
        const badgeDef = require('./badgeService').BADGE_DEFINITIONS[badgeId];
        socketService.emitToUser(userId, 'badge_earned', {
            badgeId,
            name: badgeName,
            earnedAt: new Date(),
            ...badgeDef
        });

        return true;

    } catch (error) {
        log.error('SYSTEM', 'Badge award failure', error);
        return false;
    }
}

/**
 * Get user's full gamification stats
 * @param {string} userId - User ID
 * @returns {Promise<object>}
 */
async function getUserStats(userId) {
    try {
        const profile = await getOrCreateProfile(userId);
        const recentRewardHistory = await rewardService.getRecentCreditHistory(userId, 20);
        const mindMap = await getStudentMindMap(userId);

        return {
            totalLearningCredits: profile.totalLearningCredits,
            level: profile.level,
            creditsForNextLevel: profile.getCreditsForNextLevel(),
            totalXP: profile.totalXP || 0,
            xpLevel: profile.xpLevel || profile.calculateXPLevel(),
            xpForNextLevel: profile.getXPForNextLevel(),
            currentStreak: profile.currentStreak,
            longestStreak: profile.longestStreak,
            currentEnergy: profile.currentEnergy,
            fatigueScore: profile.fatigueScore,
            unlockedSkills: profile.unlockedSkills,
            badges: profile.badges,
            recentCreditsHistory: profile.learningCreditsHistory.slice(-10).reverse(), // Last 10 Learning Credits awards
            learningCreditsHistory: profile.learningCreditsHistory || [], // Complete history for filtering
            recentXPHistory: (profile.xpHistory || []).slice(-10).reverse(),
            recentRewardHistory,
            mindMap,
            topicScores: Object.fromEntries(profile.topicScores),
            learningCredits: profile.learningCredits || 0,  // Legacy field
            creditsHistory: profile.creditsHistory || []     // Legacy field
        };

    } catch (error) {
        log.error('SYSTEM', 'Stats fetch failure', error);
        throw error;
    }
}

/**
 * Record skill tree level completion progress
 * @param {string} userId - User ID
 * @param {string} topic - Topic name
 * @param {number} levelId - Level ID
 * @param {number} stars - Stars earned (0-3)
 * @param {number} score - Questions answered correctly
 * @param {number} totalQuestions - Total questions in level
 */
async function recordSkillTreeProgress(userId, topic, levelId, stars, score, totalQuestions, creditsAwarded = false) {
    try {
        const profile = await getOrCreateProfile(userId);


        // Initialize skillTreeProgress as a plain object if not exists
        if (!profile.skillTreeProgress || typeof profile.skillTreeProgress !== 'object') {
            profile.skillTreeProgress = {};
        }

        const topicKey = topic.toLowerCase();
        if (!profile.skillTreeProgress[topicKey]) {
            profile.skillTreeProgress[topicKey] = { levels: {} };
        }
        let topicProgress = profile.skillTreeProgress[topicKey];

        // Always use string for levelId key
        const levelKey = String(levelId);
        const existingLevel = topicProgress.levels[levelKey] || { stars: 0, score: 0, creditsAwarded: false };
        topicProgress.levels[levelKey] = {
            stars: Math.max(existingLevel.stars, stars),
            score: Math.max(existingLevel.score, score),
            totalQuestions,
            completedAt: new Date(),
            attempts: (existingLevel.attempts || 0) + 1,
            creditsAwarded: existingLevel.creditsAwarded || Boolean(creditsAwarded)
        };

        profile.skillTreeProgress[topicKey] = topicProgress;
        await profile.save();

        log.info('SYSTEM', `Recorded skill tree progress: ${userId} - ${topic} - ${levelId}`);

    } catch (error) {
        log.error('SYSTEM', 'Skill tree progress record failed', error);
        // Don't throw - this is not critical
    }
}

/**
 * Check if this is the first time a user completes a level
 * @param {string} userId - User ID
 * @param {string} topic - Topic name
 * @param {number} levelId - Level ID
 * @returns {boolean} True if first completion
 */
async function isFirstLevelCompletion(userId, topic, levelId) {
    try {
        const profile = await getOrCreateProfile(userId);


        if (!profile.skillTreeProgress || typeof profile.skillTreeProgress !== 'object') {
            return true; // No progress at all, definitely first time
        }

        const topicKey = topic.toLowerCase();
        const topicProgress = profile.skillTreeProgress[topicKey];

        if (!topicProgress || !topicProgress.levels) {
            return true; // No progress for this topic
        }

        // Always use string for levelId key
        const levelKey = String(levelId);
        const levelProgress = topicProgress.levels[levelKey];

        // First time eligible for credit if there's no record or credits haven't been awarded yet
        if (!levelProgress) return true;
        return !(levelProgress.creditsAwarded === true);

    } catch (error) {
        log.error('SYSTEM', 'First completion check failed', error);
        return true; // Default to true to award Learning Credits in case of error
    }
}

/**
 * Atomically mark that credits have been awarded for a specific skill-tree level.
 * Returns true if the mark was applied (i.e., credits have NOT been awarded before),
 * false if someone already marked it.
 */
async function markLevelCreditsAwardedIfNot(userId, topic, levelId) {
    try {
        const topicKey = String(topic).toLowerCase();
        const levelKey = String(levelId);

        // Filter ensures we only match profiles where creditsAwarded is not true for this level
        const filter = {
            userId,
            $or: [
                { [`skillTreeProgress.${topicKey}`]: { $exists: false } },
                { [`skillTreeProgress.${topicKey}.levels.${levelKey}.creditsAwarded`]: { $ne: true } }
            ]
        };

        const update = {
            $set: {
                // mark credits awarded
                [`skillTreeProgress.${topicKey}.levels.${levelKey}.creditsAwarded`]: true,
                // ensure we have a completedAt timestamp if not present
                [`skillTreeProgress.${topicKey}.levels.${levelKey}.completedAt`]: new Date()
            }
        };

        const updated = await GamificationProfile.findOneAndUpdate(filter, update, { new: true });
        return updated ? true : false;
    } catch (error) {
        log.error('SYSTEM', 'Marking level credits failed', error);
        return false;
    }
}


/**
 * Deterministic, spam-resistant XP calculator for student chat queries.
 */
function computeChatMessageXP(queryText = '') {
    const q = String(queryText || '').trim();
    if (!q) return 0;
    // Filter automated CORS/origin test strings
    if (/different origin.*for testing|test message/i.test(q)) return 0;
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length <= 2 && /^(hi+|hello+|hey+|ok|okay|thanks|yes|no|ml|dsp)$/i.test(q)) {
        return 2;
    }
    const uniqueVocab = new Set(q.toLowerCase().split(/\W+/).filter(w => w.length > 2)).size;
    const isAnalytical = /\?|\b(how|why|explain|derive|prove|compare|difference|calculate|design|solve|formula|circuit|algorithm|implement|debug|notes)\b/i.test(q);
    const wordScore = Math.min(8, Math.ceil(words.length / 3));
    const vocabScore = Math.min(7, uniqueVocab);
    const intentBonus = isAnalytical ? 5 : 2;
    return Math.min(20, Math.max(4, wordScore + vocabScore + intentBonus));
}

/**
 * Determines whether a user account is a Test User, Developer, Faculty, or Admin
 * and should be hidden from the public Student Leaderboard.
 */
function isHiddenFromLeaderboard(user) {
    if (!user) return true;
    if (user.isAdmin || user.isFaculty || user.hideFromLeaderboard) return true;
    if (user.developerApiKey || user.apiKeyRequestStatus === 'approved') return true;

    const email = String(user.email || '').toLowerCase().trim();
    const username = String(user.username || '').toLowerCase().trim();
    const name = String(user.profile?.name || '').toLowerCase().trim();

    // Hide seeded @imentor.edu test accounts, disposable test domains, and developer/staff accounts
    if (/@(imentor\.edu|test\.com|example\.com|bocably\.com)$/i.test(email)) return true;
    if (/^(ultra\.boy7|sriphani@|temp\.mail|wabepa|admin|faculty|test\d*)/i.test(email)) return true;
    if (/^(student\d+|student_?agent|test\d*|admin|faculty|alex_ece|priya_eee|ultra\.boy|sriphani)/i.test(username)) return true;
    if (/^(student \d+|nothing|temp)$/i.test(name)) return true;

    return false;
}

/**
 * Format a clean, student-friendly display name for the leaderboard.
 */
function formatStudentDisplayName(user) {
    const rawName = String(user?.profile?.name || '').trim();
    if (rawName && rawName.length >= 2 && !/^(nothing|temp|user)$/i.test(rawName)) {
        // Title-case ALL CAPS names for cleaner presentation
        if (rawName === rawName.toUpperCase() && rawName.length > 4) {
            return rawName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        }
        return rawName;
    }
    return String(user?.username || 'Student').replace(/[0-9a-f]{4}$/i, '');
}

/**
 * Get the global XP Leaderboard across all real students (excluding test users, developers, and admins).
 */
async function getGlobalLeaderboard(limit = 50, currentUserId = null) {
    try {
        const allUsers = await User.find({}, {
            email: 1,
            username: 1,
            isAdmin: 1,
            isFaculty: 1,
            hideFromLeaderboard: 1,
            developerApiKey: 1,
            apiKeyRequestStatus: 1,
            bountyCredits: 1,
            level: 1,
            'profile.name': 1,
            'profile.branch': 1,
            'profile.college': 1
        }).lean();

        const profiles = await GamificationProfile.find({}).lean();
        const profileByUser = new Map(profiles.map(p => [String(p.userId), p]));

        const visibleEntries = [];
        let currentUserStatus = null;

        for (const u of allUsers) {
            const p = profileByUser.get(String(u._id));
            const totalXP = Math.max(0, Math.round(p?.totalXP || 0));
            const totalLearningCredits = Math.max(0, Math.round(p?.totalLearningCredits || 0));
            const xpLevel = Math.floor(Math.sqrt(totalXP / 50)) + 1;
            const testingCredits = Math.round((u.bountyCredits || 0) + (p?.bountyCredits || 0) + (p?.learningCredits || 0));
            const currentStreak = p?.currentStreak || 0;
            const badgesCount = Array.isArray(p?.badges) ? p.badges.length : 0;
            const isHidden = isHiddenFromLeaderboard(u);
            const isCurrentUser = currentUserId && String(u._id) === String(currentUserId);

            const entry = {
                userId: u._id,
                username: formatStudentDisplayName(u),
                handle: u.username,
                branch: u.profile?.branch || '',
                college: u.profile?.college || '',
                level: xpLevel,
                xpLevel,
                totalXP,
                totalLearningCredits,
                testingCredits,
                currentStreak,
                badgesCount,
                isCurrentUser: Boolean(isCurrentUser)
            };

            if (isCurrentUser) {
                currentUserStatus = {
                    ...entry,
                    isHiddenAccount: isHidden,
                    hiddenReason: isHidden
                        ? (u.isAdmin ? 'Admin Account' : u.isFaculty ? 'Faculty Account' : (u.developerApiKey || userHasDevEmail(u.email)) ? 'Developer Account' : 'Test Account')
                        : null
                };
            }

            if (!isHidden && (totalXP > 0 || totalLearningCredits > 0 || testingCredits > 0)) {
                visibleEntries.push(entry);
            }
        }

        visibleEntries.sort((a, b) => {
            if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
            if (b.testingCredits !== a.testingCredits) return b.testingCredits - a.testingCredits;
            return b.totalLearningCredits - a.totalLearningCredits;
        });

        const ranked = visibleEntries.slice(0, limit).map((item, idx) => ({
            ...item,
            rank: idx + 1
        }));

        if (currentUserStatus) {
            const foundInRanked = ranked.find(r => String(r.userId) === String(currentUserStatus.userId));
            currentUserStatus.rank = foundInRanked ? foundInRanked.rank : null;
        }

        return {
            leaderboard: ranked,
            currentUserStatus,
            totalStudentsRanked: visibleEntries.length
        };
    } catch (error) {
        log.error('SYSTEM', 'Global leaderboard fetch failure', error);
        return { leaderboard: [], currentUserStatus: null, totalStudentsRanked: 0 };
    }
}

function userHasDevEmail(email = '') {
    return /^(ultra\.boy7|sriphani@)/i.test(String(email).trim());
}

module.exports = {
    computeChatMessageXP,
    extractConceptAndBloom,
    evaluateAndRecordMindMapXP,
    getStudentMindMap,
    isHiddenFromLeaderboard,
    getGlobalLeaderboard,
    evaluateAnswerQuality,
    awardLearningCredits,
    awardXP,
    getOrCreateProfile,
    getTopicLeaderboard,
    updateTopicScore,
    awardBadge,
    getUserStats,
    recordSkillTreeProgress,
    isFirstLevelCompletion,
    markLevelCreditsAwardedIfNot
};
