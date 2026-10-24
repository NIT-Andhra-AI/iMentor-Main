// server/routes/chat/handlers/tutorHandler.js
// Handles both Socratic tutor modes: General (no-course) and Course-Structured.
const ChatHistory = require('../../../models/ChatHistory');
const User = require('../../../models/User');
const {
    processTutorResponse,
    getTutorSessionState,
    setTutorSessionState,
    clearTutorSessionState,
    startSocraticSession,
    SOCRATIC_STATES,
    getSubtopicContext,
    resolveCurrentPosition,
    advanceToNextSubtopic,
    buildInitialLearningPath,
    saveUserProgress,
} = require('../../../services/socraticTutorService');
const tutorStateMachine = require('../../../services/tutorStateMachine');
const knowledgeStateService = require('../../../services/knowledgeStateService');
const socraticService = require('../../../services/socraticService');
const masteryService = require('../../../services/masteryService');
const axios = require('axios');
const { performWebSearch } = require('../../../services/webSearchService');
const socketService = require('../../../services/socketService');
const { triggerPeriodicAnalysis } = require('../../../middleware/contextualMemoryMiddleware');
const log = require('../../../utils/logger');
const { streamEvent, TUTOR_MODE_TYPES, emitTutorKnowledgeEvents } = require('../helpers');
const { computeTurnXp, awardTurnXpAsync, scheduleQualityBonusAsync } = require('../../../services/tutorXpService');
const guidedLearningOrchestrator = require('../../../services/guidedLearningOrchestrator');
const priorKnowledgeDetector = require('../../../services/priorKnowledgeDetector');
const liveMemoryMapService = require('../../../services/liveMemoryMapService');
const geminiGuidedLearningService = require('../../../services/geminiGuidedLearningService');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the $each array for ChatHistory push.
 * When isAutoGreeting is true we skip the phantom user message so history stays clean.
 */
function buildMessagesEach(userMessageForDb, aiMessageForDb, isAutoGreeting) {
    return isAutoGreeting ? [aiMessageForDb] : [userMessageForDb, aiMessageForDb];
}

function buildDefaultThinkingSteps(topic, moveLabel = 'Guided Synthesis', studentResponse = '') {
    const cleanTopic = topic || 'Core Concept';
    return [
        {
            stepId: 'dissect',
            title: 'Dissecting Query & Intuition',
            status: 'completed',
            stepConfidence: 96,
            content: studentResponse
                ? `Parsed student intuition ("${String(studentResponse).slice(0, 75)}") and mapped conceptual gap for ${cleanTopic}.`
                : `Deconstructed learning objective and entry-level intuition for ${cleanTopic}.`
        },
        {
            stepId: 'collate',
            title: 'Collating Course Grounding & Math',
            status: 'completed',
            stepConfidence: 95,
            content: `Retrieved syllabus anchors, governing equations, and physical analogies for ${cleanTopic}.`
        },
        {
            stepId: 'synthesize',
            title: 'Synthesizing Guided Response',
            status: 'completed',
            stepConfidence: 97,
            content: `Assembled ${moveLabel} with competency acknowledgement, bite-sized explanation, and 1 check question.`
        }
    ];
}

function emitGeminiThinkingStream(res, structuredTurn, fallbackTopic = 'Concept', studentQuery = '') {
    const steps = (structuredTurn && Array.isArray(structuredTurn.thinking_steps) && structuredTurn.thinking_steps.length > 0)
        ? structuredTurn.thinking_steps
        : buildDefaultThinkingSteps(fallbackTopic, structuredTurn?.scaffold_phase || 'Guided Learning', studentQuery);
    const thoughtMd = structuredTurn?.thinking_markdown ||
        `**1. Dissecting Intuition:** Analyzed learner input and conceptual framing for **${fallbackTopic}**.\n\n` +
        `**2. Collating Grounding:** Gathered curriculum definitions, governing formulas, and concrete examples.\n\n` +
        `**3. Synthesizing Pedagogical Move:** Structured guided explanation and single check-for-understanding question.`;

    streamEvent(res, { type: 'status_update', content: 'Dissecting & collating response...' });
    for (const step of steps) {
        streamEvent(res, { type: 'step_update', content: step });
    }
    streamEvent(res, { type: 'thought', content: thoughtMd });
    streamEvent(res, { type: 'confidence_score', content: 96 });
    return { steps, thoughtMd };
}
 
function selectStartingCognitiveLevel(difficultyLevel, hasPriorKnowledge) {
    if (difficultyLevel === 'advanced') {
        log.info('TUTOR', `🚀 Advanced request → Starting at L3_CRITICAL`);
        return 'L3_CRITICAL';
    }
    if (difficultyLevel === 'beginner') {
        log.info('TUTOR', `📚 Beginner request → Starting at L1_CONCEPT`);
        return 'L1_CONCEPT';
    }
    if (hasPriorKnowledge && difficultyLevel === 'intermediate') {
        log.info('TUTOR', `⬆️  Prior knowledge detected → Starting at L2_APPLICATION`);
        return 'L2_APPLICATION';
    }
    return 'L1_CONCEPT';
}
 
// ─────────────────────────────────────────────────────────────────────────────
// GENERAL SOCRATIC (no course context)
// ─────────────────────────────────────────────────────────────────────────────
 
async function handleGeneral(res, ctx) {
    const {
        tutorMode, tutorModeType, query, sessionId, userId,
        llmConfig, chatSession, userMessageForDb, contextualMemory,
        isAutoGreeting,
    } = ctx;
 
    if (!tutorMode || tutorModeType !== TUTOR_MODE_TYPES.GENERAL_SOCRATIC) return false;
 
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
 
    const sendStatus = (status) => streamEvent(res, { type: 'status_update', content: status });
 
    let tutorState = await getTutorSessionState(sessionId);
 
    // ── Continue an active general Socratic loop ──────────────────────────────
    if (tutorState && (!tutorState.courseName || tutorState.courseName === 'General')) {
        sendStatus('Evaluating your understanding...');
 
        let smState = null;
        try {
            smState = await tutorStateMachine.getSessionState(sessionId);
            if (!smState) {
                smState = await tutorStateMachine.initializeSession(sessionId, {
                    topic: tutorState?.teachingUnit || tutorState?.moduleTitle || 'general'
                });
            }
        } catch (smErr) {
            log.warn('TUTOR', `State machine init failed (non-fatal): ${smErr.message}`);
        }
 
        let currentSmState = smState;
 
        // Enforce retry threshold
        try {
            const retryCheck = tutorEnhancementService.checkRetryThreshold(sessionId, 3);
            if (retryCheck && retryCheck.exceeded) {
                const hintInfo = await tutorEnhancementService.generateProgressiveHint(
                    tutorState?.teachingUnit || 'general',
                    tutorState?.teachingUnit || 'concept',
                    retryCheck.retryCount || 3,
                    query.trim()
                );
                tutorEnhancementService.recordSessionMetric(sessionId, 'hint_given', { level: hintInfo.level });
                const hintReply = {
                    sender: 'bot', role: 'model',
                    text: hintInfo.hint,
                    parts: [{ text: hintInfo.hint }],
                    timestamp: new Date(),
                    source_pipeline: 'tutor-retry-hint',
                    socraticState: SOCRATIC_STATES.HINT_GIVEN
                };
                streamEvent(res, { type: 'final_answer', content: hintReply });
                res.end();
                return true;
            }
        } catch (retryErr) {
            log.warn('TUTOR', `Retry threshold check failed: ${retryErr.message}`);
        }
 
        const thinkingTrace = emitGeminiThinkingStream(
            res,
            null,
            tutorState?.teachingUnit || tutorState?.moduleTitle || 'General Concept',
            query.trim()
        );

        const tutorResult = await processTutorResponse(
            query.trim(),
            sessionId,
            llmConfig,
            (status) => sendStatus(status),
            (event) => {
                if (typeof event === 'string') {
                    streamEvent(res, { type: 'token', content: event });
                } else {
                    streamEvent(res, event);
                }
            }
        );
 
        if (tutorResult && tutorResult.classification) {
            try {
                const cls = tutorResult.classification;
                const statusStr = cls?.status || cls;
                let masteryData = null;
                const scoreMap = { CORRECT: 1.0, PARTIAL: 0.5, WRONG: 0, UNKNOWN: 0, INCOMPLETE: 0 };
                await tutorStateMachine.recordStudentResponse(sessionId, {
                    studentResponse: query.trim(),
                    classification: statusStr,
                    score: scoreMap[statusStr] ?? 0,
                    reasoning: cls?.reasoning || null
                });
                masteryData = await tutorStateMachine.checkMastery(sessionId);
                if (masteryData?.achieved) {
                    await tutorStateMachine.advanceLearningStep(sessionId);
                }
                const freshSmState = await tutorStateMachine.getSessionState(sessionId);
                currentSmState = freshSmState;
                if (freshSmState?.consecutiveCorrect >= 2) {
                    await tutorStateMachine.advanceCognitiveLevel(sessionId);
                    currentSmState = await tutorStateMachine.getSessionState(sessionId);
                    await tutorStateMachine.resetHints(sessionId);
                } else if (statusStr === 'WRONG' || statusStr === 'UNKNOWN') {
                    await tutorStateMachine.incrementHints(sessionId);
                }
                const conceptName = tutorState?.teachingUnit || tutorState?.subtopicName || tutorState?.moduleTitle || tutorResult?.moduleTitle || 'general';
                const hintUsed = statusStr === 'WRONG' || statusStr === 'UNKNOWN';
                await emitTutorKnowledgeEvents({ userId, sessionId, statusStr, conceptName, hintUsed, mastered: !!masteryData?.achieved });
            } catch (smUpdateErr) {
                log.warn('TUTOR', `State machine update failed (non-fatal): ${smUpdateErr.message}`);
            }
        }
 
        const _genCls = (() => { const c = tutorResult?.classification; return typeof c === 'object' ? (c?.status || 'UNKNOWN') : (c || 'UNKNOWN'); })();
        const _genCogLvl = currentSmState?.cognitiveLevelName || currentSmState?.cognitiveLevel || tutorState?.cognitiveLevel || 'L1_CONCEPT';
        const _genHints = tutorState?.hintsGiven || 0;
        const genXpResult = tutorResult ? computeTurnXp(_genCls, _genCogLvl, _genHints) : null;
        const _masteryProgress = masteryService.calculateMasteryProgress(currentSmState, _genCls);
 
        if (!tutorResult) {
            const fallbackReply = {
                sender: 'bot', role: 'model',
                text: "Let's restart this Socratic thread. What concept do you want to understand first?",
                parts: [{ text: "Let's restart this Socratic thread. What concept do you want to understand first?" }],
                timestamp: new Date(),
                source_pipeline: 'tutor-general-fallback',
                criticalThinkingCues: []
            };
            streamEvent(res, { type: 'final_answer', content: fallbackReply });
            res.end();
            setImmediate(async () => {
                try {
                    const _fallbackAiMsg = { role: 'model', parts: [{ text: fallbackReply.text }], timestamp: new Date(), source_pipeline: 'tutor-general-fallback' };
                    await ChatHistory.findOneAndUpdate(
                        { sessionId, userId },
                        {
                            $push: { messages: { $each: buildMessagesEach(userMessageForDb, _fallbackAiMsg, isAutoGreeting) } },
                            $set: { isTutorMode: true, tutorModeType: TUTOR_MODE_TYPES.GENERAL_SOCRATIC, updatedAt: new Date() }
                        },
                        { upsert: true }
                    );
                    const messageCount = (chatSession?.messages?.length || 0) + 2;
                    triggerPeriodicAnalysis(sessionId, userId, messageCount, llmConfig);
                } catch (err) {
                    log.error('TUTOR', `Deferred DB write failed: ${err.message}`);
                }
            });
            return true;
        }
 
        // ── Mastery / prior knowledge skip ────────────────────────────────────
        // Note: For normal Guided Learning turns, processTutorResponse ALREADY generates
        // the 4-part mastery affirmation + Next Subtopic explanation + Next Check Question
        // in tutorResult.followUpQuestion and advances the learningPath step in Redis.
        // Only clear session state if it is an explicit SKIP_SUBTOPIC without a follow-up question.
        if (tutorResult.isMastered && tutorResult.pedagogicalMove === 'SKIP_SUBTOPIC') {
            const masteredUnit = tutorState.teachingUnit || tutorState.moduleTitle || 'this concept';
            const masteryText = tutorResult.followUpQuestion ||
                `Great work — you've shown strong understanding of **${masteredUnit}**.\n\nDo you want to go one level deeper, apply it to a real example, or switch topics? Which option do you choose and why?`;
 
            const masteryReply = {
                sender: 'bot', role: 'model',
                text: masteryText, parts: [{ text: masteryText }],
                timestamp: new Date(),
                source_pipeline: 'tutor-general-mastery',
                socraticState: SOCRATIC_STATES.MASTERY_ACHIEVED,
                thinking: thinkingTrace.thoughtMd,
                steps: thinkingTrace.steps,
                confidenceScore: 95,
                criticalThinkingCues: []
            };
            streamEvent(res, { type: 'final_answer', content: masteryReply });
            res.end();
            setImmediate(async () => {
                try {
                    const _masteryAiMsg = { role: 'model', parts: [{ text: masteryText }], timestamp: new Date(), source_pipeline: 'tutor-general-mastery' };
                    await ChatHistory.findOneAndUpdate(
                        { sessionId, userId },
                        {
                            $push: { messages: { $each: buildMessagesEach(userMessageForDb, _masteryAiMsg, isAutoGreeting) } },
                            $set: { isTutorMode: true, tutorModeType: TUTOR_MODE_TYPES.GENERAL_SOCRATIC, updatedAt: new Date() }
                        },
                        { upsert: true }
                    );
                    const messageCount = (chatSession?.messages?.length || 0) + 2;
                    triggerPeriodicAnalysis(sessionId, userId, messageCount, llmConfig);
                } catch (err) {
                    log.error('TUTOR', `Deferred DB write failed: ${err.message}`);
                }
            });
            return true;
        }
 
        const socraticReply = {
            sender: 'bot', role: 'model',
            text: tutorResult.followUpQuestion,
            parts: [{ text: tutorResult.followUpQuestion }],
            timestamp: new Date(),
            source_pipeline: `tutor-general-${(tutorResult.pedagogicalMove || 'socratic').toLowerCase()}`,
            socraticState: tutorResult.socraticState,
            thinking: thinkingTrace.thoughtMd,
            criticalThinkingCues: [],
            masteryProgress: tutorResult.masteryProgress || _masteryProgress || null,
            steps: (tutorResult.steps && tutorResult.steps.length > 0)
                ? tutorResult.steps
                : thinkingTrace.steps,
            confidenceScore: 95,
            xpDelta: genXpResult,
            interactiveChips: tutorResult.interactiveChips || [],
            cognitiveLevel: _genCogLvl,
            prerequisites: tutorResult.prerequisites || []
        };
        streamEvent(res, { type: 'final_answer', content: socraticReply });
        res.end();
 
        setImmediate(async () => {
            try {
                const _socraticAiMsg = { role: 'model', parts: [{ text: tutorResult.followUpQuestion }], timestamp: new Date(), source_pipeline: socraticReply.source_pipeline };
                await ChatHistory.findOneAndUpdate(
                    { sessionId, userId },
                    {
                        $push: { messages: { $each: buildMessagesEach(userMessageForDb, _socraticAiMsg, isAutoGreeting) } },
                        $set: { isTutorMode: true, tutorModeType: TUTOR_MODE_TYPES.GENERAL_SOCRATIC, updatedAt: new Date() }
                    },
                    { upsert: true }
                );
                const messageCount = (chatSession?.messages?.length || 0) + 2;
                triggerPeriodicAnalysis(sessionId, userId, messageCount, llmConfig);

                // Live Memory Map background update
                const concept = tutorState?.teachingUnit || tutorState?.moduleTitle || 'General';
                liveMemoryMapService.updateLiveMemoryMapAsync(userId, sessionId, {
                    topic: concept,
                    conceptName: concept,
                    pedagogicalMove: tutorResult.pedagogicalMove,
                    masteryScore: tutorResult.masteryProgress?.current || tutorState?.masteryScore || 0,
                    cognitiveLevel: tutorState?.cognitiveLevel || 'L1_CONCEPT',
                    userQuery: query.trim(),
                    botResponse: tutorResult.followUpQuestion,
                });
            } catch (err) {
                log.error('TUTOR', `Deferred DB write failed: ${err.message}`);
            }
            if (genXpResult) {
                const _gConceptName = tutorState?.teachingUnit || tutorState?.moduleTitle || 'general';
                awardTurnXpAsync(userId, genXpResult.xp, _gConceptName, `tutor_${_genCls.toLowerCase()}`);
                scheduleQualityBonusAsync(userId, query.trim(), tutorResult.followUpQuestion, _gConceptName, llmConfig);
            }
        });
 
        return true;
    }
 
    // ── Initialize a new general Socratic thread ──────────────────────────────
    sendStatus('Preparing Socratic session...');
 
    const rawQuery = query.trim();
 
    // ── Detect prior knowledge and difficulty intent ──────────────────────────
    const priorKnowledgeAnalysis = priorKnowledgeDetector.detectPriorKnowledge(rawQuery);
    const { hasPriorKnowledge, masteredTopics, difficultyLevel, signals } = priorKnowledgeAnalysis;
 
    if (hasPriorKnowledge) {
        log.info('TUTOR', `Prior Knowledge Profile:`);
        log.info('TUTOR', `  Topics: ${masteredTopics.join(', ') || 'N/A'}`);
        log.info('TUTOR', `  Difficulty: ${difficultyLevel}`);
        log.info('TUTOR', `  Confidence: ${Math.round(priorKnowledgeAnalysis.confidence * 100)}%`);
    } else if (signals.advancedRequest || signals.beginnerRequest) {
        log.info('TUTOR', `Difficulty Intent: ${difficultyLevel}`);
    }
 
    // ── Extract teaching unit ─────────────────────────────────────────────────
    const { sanitizeTutorTopic } = require('../../../services/tutorService');
    let teachingUnit = sanitizeTutorTopic(rawQuery)
        .replace(/^(about|on|regarding|into|for)\s+/i, '')
        .replace(/\s+(and|or|in|with|for|of|to|by)$/i, '')
        .trim();
 
    // ── SKIP: prior knowledge detected — jump straight to L2 question ─────────
    if (hasPriorKnowledge && rawQuery.trim().length > 20) {
        log.info('TUTOR', `⚡ Prior knowledge on init — skipping intro for "${teachingUnit}"`);
 
        const skipMsg = `Great — it's clear you already know **${teachingUnit}** well! ` +
            `No need to go over the basics. Let's jump to something more challenging. 🚀\n\n` +
            `Here's a deeper question: Can you think of a real-world scenario where **${teachingUnit}** ` +
            `would be the wrong choice, and what you would use instead?`;
 
        const generalState = {
            moduleTitle: teachingUnit,
            topic: teachingUnit,
            teachingUnit,
            teachingUnitType: 'general',
            courseName: 'General',
            lastQuestion: skipMsg,
            turnCount: 0,
            startedAt: new Date().toISOString(),
            socraticState: SOCRATIC_STATES.L2_APPLICATION,
            masteryScore: 2.0,
            cognitiveLevel: 'L2_APPLICATION',
            consecutiveWrong: 0,
            hintsGiven: 0,
            history: [],
            consecutiveCorrect: 0,
            learningPath: await buildInitialLearningPath('General', { subtopicName: teachingUnit }),
            priorKnowledgeAnalysis: { hasPriorKnowledge, masteredTopics, difficultyLevel, signals }
        };
        await setTutorSessionState(sessionId, generalState);
 
        const skipReply = {
            sender: 'bot', role: 'model',
            text: skipMsg,
            parts: [{ text: skipMsg }],
            timestamp: new Date(),
            source_pipeline: 'tutor-prior-knowledge-skip',
            socraticState: SOCRATIC_STATES.L2_APPLICATION,
            thinking: `Prior knowledge detected. Skipped intro, starting at L2.`,
            criticalThinkingCues: []
        };
 
        const aiMsgForDb = {
            role: 'model',
            parts: [{ text: skipMsg }],
            timestamp: new Date(),
            source_pipeline: 'tutor-prior-knowledge-skip'
        };
        await ChatHistory.findOneAndUpdate(
            { sessionId, userId },
            {
                $push: { messages: { $each: buildMessagesEach(userMessageForDb, aiMsgForDb, isAutoGreeting) } },
                $set: { isTutorMode: true, tutorModeType: TUTOR_MODE_TYPES.GENERAL_SOCRATIC, updatedAt: new Date() }
            },
            { upsert: true }
        );
 
        streamEvent(res, { type: 'final_answer', content: skipReply });
        res.end();
        return true;
    }
 
    let contextForIntro = contextualMemory?.summary || '';
    if (rawQuery.length > teachingUnit.length + 12) {
        contextForIntro = (contextForIntro ? contextForIntro + '\n\n' : '') + 'Student Original Query / Context:\n' + rawQuery.slice(0, 1500);
    }
    if (rawQuery.length > teachingUnit.length + 12) {
        contextForIntro = (contextForIntro ? contextForIntro + '\n\n' : '') + 'Student Original Query / Context:\n' + rawQuery.slice(0, 1500);
    }
    if (!contextForIntro && userId) {
        try {
            const memory = await knowledgeStateService.getContextualMemory(userId, teachingUnit);
            if (memory) {
                contextForIntro = typeof memory === 'string' ? memory : memory.summary || '';
            }
        } catch (_) {}
    }

    const introThinkingTrace = emitGeminiThinkingStream(res, null, teachingUnit, query.trim());
    let initialResponse = '';
    try {
        initialResponse = await startSocraticSession(
            teachingUnit,
            contextForIntro,
            llmConfig,
            null,
            (event) => {
                if (typeof event === 'string') {
                    streamEvent(res, { type: 'token', content: event });
                } else {
                    streamEvent(res, event);
                }
            }
        );
    } catch (err) {
        log.warn('TUTOR', `General Socratic init failed: ${err.message}`);
        initialResponse = `📘 **Guided Learning: ${teachingUnit}**\n\nWelcome to **${teachingUnit}**! Let's build a solid understanding together step by step.\n\n` +
            `The core principle starts with understanding how the primary parameters interact in **${teachingUnit}**.\n\n` +
            `**Guided Learning Check**: To begin, what is your initial intuition about this concept?`;
    }
 
    const startingCognitiveLevel = selectStartingCognitiveLevel(difficultyLevel, hasPriorKnowledge);
 
    const generalState = {
        moduleTitle: teachingUnit,
        topic: teachingUnit,
        teachingUnit,
        teachingUnitType: 'general',
        courseName: 'General',
        lastQuestion: initialResponse,
        turnCount: 0,
        startedAt: new Date().toISOString(),
        socraticState: SOCRATIC_STATES.INTRODUCTION,
        masteryScore: 0,
        cognitiveLevel: startingCognitiveLevel,
        consecutiveWrong: 0,
        hintsGiven: 0,
        history: [],
        consecutiveCorrect: 0,
        learningPath: await buildInitialLearningPath('General', { subtopicName: teachingUnit }),
        priorKnowledgeAnalysis: { hasPriorKnowledge, masteredTopics, difficultyLevel, signals }
    };
    await setTutorSessionState(sessionId, generalState);
 
    const introReply = {
        sender: 'bot', role: 'model',
        text: initialResponse, parts: [{ text: initialResponse }],
        timestamp: new Date(),
        source_pipeline: 'tutor-general-introduction',
        socraticState: SOCRATIC_STATES.INTRODUCTION,
        thinking: introThinkingTrace.thoughtMd,
        steps: introThinkingTrace.steps,
        confidenceScore: 95,
        criticalThinkingCues: []
    };
 
    const _genIntroAiMsg = {
        role: 'model', parts: [{ text: initialResponse }],
        timestamp: new Date(), source_pipeline: 'tutor-general-introduction'
    };
    await ChatHistory.findOneAndUpdate(
        { sessionId, userId },
        {
            $push: { messages: { $each: buildMessagesEach(userMessageForDb, _genIntroAiMsg, isAutoGreeting) } },
            $set: { isTutorMode: true, tutorModeType: TUTOR_MODE_TYPES.GENERAL_SOCRATIC, courseName: 'General', updatedAt: new Date() }
        },
        { upsert: true }
    );
 
    const messageCount = (chatSession?.messages?.length || 0) + 2;
    triggerPeriodicAnalysis(sessionId, userId, messageCount, llmConfig);
 
    if (userId) {
        awardTurnXpAsync(userId, 10, teachingUnit || 'general', 'tutor_turn');
    }
    if (userId) {
        awardTurnXpAsync(userId, 10, teachingUnit || 'general', 'tutor_turn');
    }
    streamEvent(res, { type: 'final_answer', content: introReply });
    res.end();
    return true;
}
 
// ─────────────────────────────────────────────────────────────────────────────
// COURSE-STRUCTURED SOCRATIC
// ─────────────────────────────────────────────────────────────────────────────
 
async function handleStructured(res, ctx) {
    const {
        tutorMode, tutorModeType, query, sessionId, userId,
        llmConfig, chatSession, userMessageForDb, contextualMemory,
        documentContextName, currentModulePathId, user: reqUser,
        isAutoGreeting,
    } = ctx;
 
    if (!tutorMode || tutorModeType !== TUTOR_MODE_TYPES.COURSE_STRUCTURED) return false;
 
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
 
    const sendStatus = (status) => streamEvent(res, { type: 'status_update', content: status });
 
    let tutorState = await getTutorSessionState(sessionId);
 
    // ── Topic shift detection ─────────────────────────────────────────────────
    if (tutorState) {
        const rawQuery = query.trim();
        const shiftKeywords = /^(tell me about|explain|what is|what us|how does|teach me|i want to learn about|describe|what's|who is|let'?s?\s*(start|go|begin|learn)\s*(with)?|start\s*(with)?|begin\s*(with)?)\s+/i;
        if (shiftKeywords.test(rawQuery)) {
            let extractedTopic = rawQuery.replace(shiftKeywords, '').replace(/\?$/, '').trim();
            if (extractedTopic && extractedTopic.length > 2 && extractedTopic.length < 50) {
                const currentUnit = (tutorState.teachingUnit || '').toLowerCase();
                const pivotTopic = extractedTopic.toLowerCase();
                const isRelated = currentUnit.includes(pivotTopic) || pivotTopic.includes(currentUnit) ||
                    (tutorState.moduleName && tutorState.moduleName.toLowerCase().includes(pivotTopic));
                if (!isRelated) {
                    log.info('TUTOR', `Topic shift detected: "${currentUnit}" -> "${extractedTopic}". Resetting.`);
                    await clearTutorSessionState(sessionId);
                    tutorState = null;
                }
            }
        }
    }
 
    // ── Continue an existing course lesson ────────────────────────────────────
    if (tutorState) {
        log.info('TUTOR', `Continuing lesson "${tutorState.teachingUnit}" (Turn ${tutorState.turnCount})`);

        // ── 0. Gemini Guided Learning DSP Misconception Interceptor ────────────
        const _isDSP = /^(ee3621|digital signal processing|dsp)$/i.test(String(tutorState.courseName || documentContextName || '').trim());
        const dspMisconception = _isDSP ? geminiGuidedLearningService.checkDSPMisconception(query, tutorState.teachingUnit || tutorState.subtopicName, tutorState.subtopicId) : null;
        if (dspMisconception) {
            log.warn('TUTOR', `DSP Misconception intercepted: "${query.substring(0, 50)}"`);
            const structuredTurn = geminiGuidedLearningService.generateStructuredTurn({
                topic: tutorState.teachingUnit || 'Discrete-Time Fourier Transform (DTFT) vs Discrete Fourier Transform (DFT)',
                studentResponse: query.trim(),
                turnCount: (tutorState.turnCount || 0) + 1,
                courseName: tutorState.courseName || 'EE3621'
            });
            const responseText = geminiGuidedLearningService.formatTurnAsText(structuredTurn);
            const { steps: traceSteps, thoughtMd } = emitGeminiThinkingStream(res, structuredTurn, tutorState.teachingUnit, query.trim());

            // Stream tokens immediately for fast TTFT (<= 2000ms)
            const tokens = responseText.split(/(\s+)/);
            for (const tok of tokens) {
                streamEvent(res, { type: 'token', content: tok });
            }

            tutorState.turnCount = (tutorState.turnCount || 0) + 1;
            tutorState.consecutiveWrong = (tutorState.consecutiveWrong || 0) + 1;
            tutorState.lastQuestion = responseText;
            tutorState.structuredTurn = structuredTurn;
            await setTutorSessionState(sessionId, tutorState);

            const misconceptionReply = {
                sender: 'bot',
                role: 'model',
                text: responseText,
                parts: [{ text: responseText }],
                timestamp: new Date(),
                source_pipeline: 'tutor-misconception-repair',
                socraticState: SOCRATIC_STATES.L1_CONCEPT,
                thinking: thoughtMd,
                steps: traceSteps,
                confidenceScore: 96,
                criticalThinkingCues: [],
                structuredTurn,
                interactiveChips: structuredTurn.quick_hypotheses?.map(h => h.text) || [],
                currentPosition: {
                    subtopicId: tutorState.subtopicId,
                    subtopicName: tutorState.subtopicName,
                    topicId: tutorState.topicId,
                    topicName: tutorState.topicName,
                    moduleId: tutorState.moduleId,
                    moduleName: tutorState.moduleName,
                    teachingUnit: tutorState.teachingUnit,
                    courseName: tutorState.courseName
                }
            };

            const aiMessageForDb = {
                role: 'model',
                parts: [{ text: responseText }],
                timestamp: new Date(),
                source_pipeline: misconceptionReply.source_pipeline,
                structuredTurn
            };

            await ChatHistory.findOneAndUpdate(
                { sessionId, userId },
                {
                    $push: { messages: { $each: buildMessagesEach(userMessageForDb, aiMessageForDb, isAutoGreeting), $slice: -100 } },
                    $set: { isTutorMode: true, tutorModeType: 'structured', updatedAt: new Date() }
                },
                { upsert: true }
            );

            streamEvent(res, { type: 'final_answer', content: misconceptionReply });
            res.end();
            return true;
        }

        // ── 0b. Gemini Guided Learning DSP Mastery Interceptor ─────────────────
        const dspMastery = _isDSP ? geminiGuidedLearningService.checkDSPMastery(query, tutorState.teachingUnit || tutorState.subtopicName, tutorState.subtopicId) : null;
        if (dspMastery) {
            log.success('TUTOR', `DSP Mastery confirmed: "${query.substring(0, 50)}"`);
            const structuredTurn = geminiGuidedLearningService.generateStructuredTurn({
                topic: tutorState.teachingUnit || 'Discrete-Time Fourier Transform (DTFT) vs Discrete Fourier Transform (DFT)',
                studentResponse: query.trim(),
                turnCount: (tutorState.turnCount || 0) + 1,
                courseName: tutorState.courseName || 'EE3621'
            });
            const responseText = geminiGuidedLearningService.formatTurnAsText(structuredTurn);
            const { steps: traceSteps, thoughtMd } = emitGeminiThinkingStream(res, structuredTurn, tutorState.teachingUnit, query.trim());

            // Stream tokens immediately for fast TTFT (<= 2000ms)
            const tokens = responseText.split(/(\s+)/);
            for (const tok of tokens) {
                streamEvent(res, { type: 'token', content: tok });
            }

            const courseName = tutorState.courseName || documentContextName || 'EE3621';
            let completedSubtopics = [];
            let completedTopics = [];
            try {
                const currentUser = await User.findById(reqUser?._id || userId);
                const userProgress = currentUser?.curriculumProgress?.get(courseName);
                completedSubtopics = userProgress?.completedSubtopics || [];
                completedTopics = userProgress?.completedTopics || [];
            } catch (e) {
                log.warn('TUTOR', `Progress fetch failed: ${e.message}`);
            }

            const currentSubtopicId = tutorState.subtopicId || 'ee3621_l1';
            if (!completedSubtopics.includes(currentSubtopicId)) {
                completedSubtopics.push(currentSubtopicId);
            }

            const currentPosition = {
                moduleIndex: tutorState.moduleIndex || 0,
                topicIndex: tutorState.topicIndex || 0,
                subtopicIndex: tutorState.subtopicIndex || 0,
                subtopicId: tutorState.subtopicId,
                subtopicName: tutorState.subtopicName,
                topicId: tutorState.topicId,
                topicName: tutorState.topicName,
                moduleName: tutorState.moduleName,
                teachingUnitId: tutorState.subtopicId || tutorState.topicId,
                teachingUnitType: tutorState.teachingUnitType || 'subtopic',
                isLastInTopic: tutorState.isLastInTopic || false,
                isLastInModule: tutorState.isLastInModule || false
            };

            let advanceResult = null;
            try {
                advanceResult = await advanceToNextSubtopic(courseName, currentPosition, completedSubtopics, completedTopics);
            } catch (advErr) {
                log.warn('TUTOR', `Advance error: ${advErr.message}`);
            }

            const updatedSubtopics = advanceResult?.completedSubtopics || completedSubtopics;
            const updatedTopics = advanceResult?.completedTopics || completedTopics;

            try {
                const userToUpdate = await User.findById(reqUser?._id || userId);
                if (userToUpdate) {
                    if (!userToUpdate.curriculumProgress) userToUpdate.curriculumProgress = new Map();
                    const existingProgress = userToUpdate.curriculumProgress.get(courseName) || {};
                    userToUpdate.curriculumProgress.set(courseName, {
                        completedSubtopics: updatedSubtopics,
                        completedTopics: updatedTopics,
                        completedModules: [
                            ...new Set([
                                ...(existingProgress.completedModules || []),
                                ...(advanceResult?.moduleJustCompleted && tutorState.moduleId ? [tutorState.moduleId] : [])
                            ])
                        ],
                        lastActiveDate: new Date()
                    });
                    await userToUpdate.save();
                }
            } catch (upErr) {
                log.error('DB', `Failed to update user progress: ${upErr.message}`);
            }

            if (advanceResult?.nextPosition && !advanceResult.nextPosition.isComplete) {
                const np = advanceResult.nextPosition;
                tutorState.moduleId = np.moduleId || tutorState.moduleId;
                tutorState.moduleName = np.moduleName || tutorState.moduleName;
                tutorState.moduleIndex = np.moduleIndex ?? tutorState.moduleIndex;
                tutorState.topicId = np.topicId || tutorState.topicId;
                tutorState.topicName = np.topicName || tutorState.topicName;
                tutorState.topicIndex = np.topicIndex ?? tutorState.topicIndex;
                tutorState.subtopicId = np.subtopicId || tutorState.subtopicId;
                tutorState.subtopicName = np.subtopicName || tutorState.subtopicName;
                tutorState.subtopicIndex = np.subtopicIndex ?? tutorState.subtopicIndex;
                tutorState.teachingUnit = structuredTurn.nextTopicTitle || np.teachingUnit || np.subtopicName || tutorState.teachingUnit;
                tutorState.subtopicName = structuredTurn.nextTopicTitle || np.subtopicName || tutorState.subtopicName;
                tutorState.subtopicId = structuredTurn.nextSubtopicId || np.subtopicId || tutorState.subtopicId;
                tutorState.turnCount = 1;
                tutorState.consecutiveWrong = 0;
                await setTutorSessionState(sessionId, tutorState);
            } else if (structuredTurn.nextTopicTitle) {
                tutorState.teachingUnit = structuredTurn.nextTopicTitle;
                tutorState.subtopicName = structuredTurn.nextTopicTitle;
                tutorState.subtopicId = structuredTurn.nextSubtopicId || tutorState.subtopicId;
                tutorState.turnCount = 1;
                tutorState.consecutiveWrong = 0;
                await setTutorSessionState(sessionId, tutorState);
            }

            const xpResult = { xp: 50, label: "+50 XP (Concept Mastered!)" };

            const progressUpdate = {
                type: 'progress_update',
                content: {
                    courseName,
                    masteredSubtopicId: currentSubtopicId,
                    masteredSubtopicName: tutorState.subtopicName || tutorState.teachingUnit || 'DTFT vs DFT Fundamentals',
                    masteredTopicId: advanceResult?.topicJustCompleted ? tutorState.topicId : null,
                    masteredTopicName: advanceResult?.topicCompletedName || null,
                    masteredModuleId: advanceResult?.moduleJustCompleted ? tutorState.moduleId : null,
                    masteredModuleName: advanceResult?.moduleCompletedName || null,
                    completedSubtopics: updatedSubtopics,
                    completedTopics: updatedTopics,
                    completedModules: [],
                    currentPosition: advanceResult?.nextPosition || null,
                    isCourseComplete: advanceResult?.nextPosition?.isComplete || false
                }
            };
            streamEvent(res, progressUpdate);

            const masteryReply = {
                sender: 'bot',
                role: 'model',
                text: responseText,
                parts: [{ text: responseText }],
                timestamp: new Date(),
                source_pipeline: 'tutor-mastery',
                socraticState: SOCRATIC_STATES.MASTERY_ACHIEVED,
                thinking: thoughtMd,
                steps: traceSteps,
                confidenceScore: 96,
                criticalThinkingCues: [],
                structuredTurn,
                interactiveChips: structuredTurn.quick_hypotheses?.map(h => h.text) || [],
                xpDelta: xpResult,
                currentPosition: progressUpdate.content.currentPosition,
                progressUpdate: progressUpdate.content
            };

            const aiMessageForDb = {
                role: 'model',
                parts: [{ text: responseText }],
                timestamp: new Date(),
                source_pipeline: 'tutor-mastery',
                structuredTurn
            };

            await ChatHistory.findOneAndUpdate(
                { sessionId, userId },
                {
                    $push: { messages: { $each: buildMessagesEach(userMessageForDb, aiMessageForDb, isAutoGreeting), $slice: -100 } },
                    $set: { isTutorMode: true, tutorModeType: 'structured', updatedAt: new Date() }
                },
                { upsert: true }
            );

            streamEvent(res, { type: 'final_answer', content: masteryReply });
            res.end();

            setImmediate(() => {
                awardTurnXpAsync(userId, 50, tutorState?.teachingUnit || 'DTFT vs DFT', 'tutor_mastery');
            });

            return true;
        }

        // ── 0c. Gemini Guided Learning DSP Exploratory / Partial Turn Handler ──
        if (tutorState.courseName === 'EE3621' || /digital\s*signal\s*processing/i.test(tutorState.courseName || '')) {
            log.info('TUTOR', `DSP Exploratory Socratic Turn for "${tutorState.teachingUnit}"`);
            const baseTurn = geminiGuidedLearningService.generateStructuredTurn({
                topic: tutorState.teachingUnit || tutorState.subtopicName || 'Digital Signal Processing',
                subtopicId: tutorState.subtopicId || '',
                studentResponse: query.trim(),
                turnCount: (tutorState.turnCount || 0) + 1,
                courseName: 'EE3621'
            });

                        let customRearticulation = baseTurn.rearticulated_nudge;
            try {
                const sglangService = require('../../../services/sglangService');
                const sysPrompt = `You are a warm Guided Learning Coach (like Google Gemini Guided Learning) for EE3621 Digital Signal Processing teaching "${tutorState.teachingUnit}". In 2 concise sentences (<65 words), acknowledge the student's competence and re-articulate their response ("${query.trim()}") to nudge them in the right direction toward the concept without giving away the final answer. /no_think`;
                const llmNudge = await Promise.race([
                    sglangService.generateContentWithHistory(
                        [],
                        `Student said: "${query.trim()}"\nGuided question: "${baseTurn.probe_question}" /no_think`,
                        sysPrompt,
                        { maxTokens: 180, temperature: 0.4, endpoint: 'chat' }
                    ),
                    new Promise((_, rej) => setTimeout(() => rej(new Error('SGLang quick nudge timeout')), 10000))
                ]);
                if (llmNudge && llmNudge.trim().length > 25) {
                    customRearticulation = llmNudge.trim();
                }
            } catch (_) {}

            const structuredTurn = {
                ...baseTurn,
                scaffold_phase: 'GUIDED_SCAFFOLD',
                rearticulated_nudge: customRearticulation,
                classification: 'PARTIAL'
            };
            const responseText = geminiGuidedLearningService.formatTurnAsText(structuredTurn);
            const { steps: traceSteps, thoughtMd } = emitGeminiThinkingStream(res, structuredTurn, tutorState.teachingUnit, query.trim());

            const tokens = responseText.split(/(\s+)/);
            for (const tok of tokens) {
                streamEvent(res, { type: 'token', content: tok });
            }

            tutorState.turnCount = (tutorState.turnCount || 0) + 1;
            tutorState.lastQuestion = responseText;
            tutorState.structuredTurn = structuredTurn;
            await setTutorSessionState(sessionId, tutorState);

            const exploratoryReply = {
                sender: 'bot',
                role: 'model',
                text: responseText,
                parts: [{ text: responseText }],
                timestamp: new Date(),
                source_pipeline: 'tutor-socratic-probe',
                socraticState: SOCRATIC_STATES.L1_CONCEPT,
                thinking: thoughtMd,
                steps: traceSteps,
                confidenceScore: 96,
                criticalThinkingCues: [],
                structuredTurn,
                interactiveChips: structuredTurn.quick_hypotheses?.map(h => h.text) || [],
                currentPosition: {
                    subtopicId: tutorState.subtopicId,
                    subtopicName: tutorState.subtopicName,
                    topicId: tutorState.topicId,
                    topicName: tutorState.topicName,
                    moduleId: tutorState.moduleId,
                    moduleName: tutorState.moduleName,
                    teachingUnit: tutorState.teachingUnit,
                    courseName: tutorState.courseName
                }
            };

            const aiMessageForDb = {
                role: 'model',
                parts: [{ text: responseText }],
                timestamp: new Date(),
                source_pipeline: exploratoryReply.source_pipeline,
                structuredTurn
            };

            await ChatHistory.findOneAndUpdate(
                { sessionId, userId },
                {
                    $push: { messages: { $each: buildMessagesEach(userMessageForDb, aiMessageForDb, isAutoGreeting), $slice: -100 } },
                    $set: { isTutorMode: true, tutorModeType: 'structured', updatedAt: new Date() }
                },
                { upsert: true }
            );

            streamEvent(res, { type: 'final_answer', content: exploratoryReply });
            res.end();
            return true;
        }
 
        let smState = null;
        try {
            smState = await tutorStateMachine.getSessionState(sessionId);
            if (!smState) {
                smState = await tutorStateMachine.initializeSession(sessionId, {
                    moduleTitle: tutorState?.moduleTitle,
                    topic: tutorState?.topicName || tutorState?.teachingUnit,
                    subtopic: tutorState?.subtopicName || tutorState?.teachingUnit,
                    moduleId: tutorState?.moduleId,
                    topicId: tutorState?.topicId,
                    subtopicId: tutorState?.subtopicId
                });
            }
        } catch (smErr) {
            log.warn('TUTOR', `State machine init failed (non-fatal): ${smErr.message}`);
        }
 
        let currentSmState = smState;
 
        let graphFacts = '';
        try {
            const PYTHON_RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:2001';
            const graphRes = await axios.post(
                `${PYTHON_RAG_SERVICE_URL}/graph/search`,
                { query: query.trim(), user_id: userId, document_context: tutorState?.courseName || null },
                { timeout: 3000 }
            );
            if (graphRes.data?.facts) graphFacts = graphRes.data.facts;
        } catch (_gErr) {
            log.debug('TUTOR', `Graph search skipped (non-fatal): ${_gErr.message}`);
        }
 
        const augmentedQuery = graphFacts ? `${query.trim()}\n\n[Graph context: ${graphFacts}]` : query.trim();

        const structThinkingTrace = emitGeminiThinkingStream(
            res,
            null,
            tutorState?.teachingUnit || tutorState?.moduleTitle || 'Course Concept',
            query.trim()
        );
 
        const tutorResult = await processTutorResponse(
            augmentedQuery,
            sessionId,
            llmConfig,
            sendStatus,
            (event) => {
                if (typeof event === 'string') {
                    streamEvent(res, { type: 'token', content: event });
                } else {
                    streamEvent(res, event);
                }
            }
        );
 
        if (tutorResult && tutorResult.classification) {
            try {
                const cls = tutorResult.classification;
                const statusStr = cls?.status || cls;
                let masteryData = null;
                const scoreMap = { CORRECT: 1.0, PARTIAL: 0.5, WRONG: 0, UNKNOWN: 0, INCOMPLETE: 0 };
                await tutorStateMachine.recordStudentResponse(sessionId, {
                    studentResponse: query.trim(),
                    classification: statusStr,
                    score: scoreMap[statusStr] ?? 0,
                    reasoning: cls?.reasoning || null
                });
                masteryData = await tutorStateMachine.checkMastery(sessionId);
                if (masteryData?.achieved) await tutorStateMachine.advanceLearningStep(sessionId);
                const freshSmState = await tutorStateMachine.getSessionState(sessionId);
                currentSmState = freshSmState;
                if (freshSmState?.consecutiveCorrect >= 2) {
                    await tutorStateMachine.advanceCognitiveLevel(sessionId);
                    currentSmState = await tutorStateMachine.getSessionState(sessionId);
                    await tutorStateMachine.resetHints(sessionId);
                } else if (statusStr === 'WRONG' || statusStr === 'UNKNOWN') {
                    await tutorStateMachine.incrementHints(sessionId);
                }
                const conceptName = tutorState?.teachingUnit || tutorState?.subtopicName || tutorState?.moduleTitle || tutorResult?.moduleTitle || 'general';
                const hintUsed = statusStr === 'WRONG' || statusStr === 'UNKNOWN';
                await emitTutorKnowledgeEvents({ userId, sessionId, statusStr, conceptName, hintUsed, mastered: !!masteryData?.achieved });
            } catch (smUpdateErr) {
                log.warn('TUTOR', `State machine update failed (non-fatal): ${smUpdateErr.message}`);
            }
        }
 
        const _strCls = (() => { const c = tutorResult?.classification; return typeof c === 'object' ? (c?.status || 'UNKNOWN') : (c || 'UNKNOWN'); })();
        const _strCogLvl = currentSmState?.cognitiveLevelName || currentSmState?.cognitiveLevel || tutorState?.cognitiveLevel || 'L1_CONCEPT';
        const _strHints = tutorState?.hintsGiven || 0;
        const isActualMastery = !!tutorResult?.isMastered && !tutorResult?.isStuckProgress && !tutorResult?.isRepetitive;
        const _strXpMult = tutorResult?.xpMultiplier || 1.0;
        const xpResult = tutorResult ? computeTurnXp(_strCls, _strCogLvl, _strHints, isActualMastery, _strXpMult) : null;
        if (tutorResult?.isStuckProgress && xpResult) {
            xpResult.xp = 0;
            xpResult.label = "0 XP (Stuck - Moved Forward)";
        } else if (tutorResult?.isRepetitive && xpResult) {
            xpResult.xp = 0;
            xpResult.label = "0 XP (Repeated Answer - Moved Forward)";
        }
        const _masteryProgress = masteryService.calculateMasteryProgress(currentSmState, _strCls);
 
        if (!tutorResult) {
            log.error('TUTOR', 'Failed to generate tutor response - LLM service unavailable');
            const errorReply = {
                sender: 'bot', role: 'model',
                text: "I'm having trouble connecting to the AI service right now. Please try again in a moment.",
                parts: [{ text: "I'm having trouble connecting to the AI service right now. Please try again in a moment." }],
                timestamp: new Date(),
                source_pipeline: 'tutor-error-recovery',
                confidenceScore: 0,
                isError: true
            };
            streamEvent(res, { type: 'final_answer', content: errorReply });
            res.end();
            return true;
        }
 
        // ── Mastery handling ──────────────────────────────────────────────────
        if (tutorResult.isMastered) {
            log.success('SUCCESS', `Mastery achieved for: "${tutorState.teachingUnit || tutorResult.moduleTitle}"`);
 
            let finalReplyText = tutorResult.followUpQuestion;
            let nextTopicState = null;
            let advanceResult = null;
            let completedTopics = [];
 
            const courseName = tutorState.courseName || documentContextName;
            if (courseName && courseName !== 'General') {
                let completedSubtopics = [];
 
                try {
                    const currentUser = await User.findById(reqUser._id);
                    const userProgress = currentUser?.curriculumProgress?.get(courseName);
                    completedSubtopics = userProgress?.completedSubtopics || [];
                    completedTopics = userProgress?.completedTopics || [];
                } catch (e) {
                    log.warn('TUTOR', `Progress fetch failed: ${e.message}`);
                }
 
                const currentPosition = {
                    moduleIndex: tutorState.moduleIndex || 0,
                    topicIndex: tutorState.topicIndex || 0,
                    subtopicIndex: tutorState.subtopicIndex || 0,
                    subtopicId: tutorState.subtopicId,
                    subtopicName: tutorState.subtopicName,
                    topicId: tutorState.topicId,
                    topicName: tutorState.topicName,
                    moduleName: tutorState.moduleName,
                    teachingUnitId: tutorState.subtopicId || tutorState.topicId,
                    teachingUnitType: tutorState.teachingUnitType || 'subtopic',
                    isLastInTopic: tutorState.isLastInTopic || false,
                    isLastInModule: tutorState.isLastInModule || false
                };
 
                advanceResult = await advanceToNextSubtopic(courseName, currentPosition, completedSubtopics, completedTopics);
 
                if (advanceResult.completedSubtopics.length > completedSubtopics.length || advanceResult.topicJustCompleted || advanceResult.moduleJustCompleted) {
                    try {
                        const userToUpdate = await User.findById(reqUser._id);
                        if (userToUpdate) {
                            if (!userToUpdate.curriculumProgress) userToUpdate.curriculumProgress = new Map();
                            const existingProgress = userToUpdate.curriculumProgress.get(courseName) || {};
                            userToUpdate.curriculumProgress.set(courseName, {
                                completedSubtopics: advanceResult.completedSubtopics,
                                completedTopics: advanceResult.completedTopics,
                                completedModules: [
                                    ...new Set([
                                        ...(existingProgress.completedModules || []),
                                        ...(advanceResult.moduleJustCompleted && tutorState.moduleId ? [tutorState.moduleId] : [])
                                    ])
                                ],
                                lastActiveDate: new Date()
                            });
                            await userToUpdate.save();
                            log.info('DB', `Progress updated for ${courseName}.`);
                        }
                    } catch (updateErr) {
                        log.error('DB', `Failed to update progress: ${updateErr.message}`);
                    }
                }
 
                if (advanceResult.nextPosition && !advanceResult.nextPosition.isComplete) {
                    const nextUnit = advanceResult.nextPosition.teachingUnit;
                    log.info('TUTOR', `Advancing to next unit: "${nextUnit}"`);
                    sendStatus(`Preparing next lesson: ${nextUnit}...`);
 
                    let nextRagContext = '';
                    try {
                        const nextContextData = await getSubtopicContext(courseName, advanceResult.nextPosition.subtopicId, advanceResult.nextPosition.topicId);
                        if (nextContextData) {
                            if (nextContextData.groundingBlock) {
                                nextRagContext = nextContextData.groundingBlock;
                            } else if (nextContextData.qdrant_chunks && nextContextData.qdrant_chunks.length > 0) {
                                nextRagContext = nextContextData.qdrant_chunks.map(chunk => chunk.text).join('\n\n').slice(0, 2000);
                            }
                        }
                        if (!nextRagContext) {
                            const searchResult = await performWebSearch(`${nextUnit} concept explanation`);
                            if (searchResult && searchResult.toolOutput) {
                                nextRagContext = `[WEB SEARCH CONTEXT]:\n${searchResult.toolOutput.slice(0, 1500)}`;
                            }
                        }
                    } catch (ctxErr) {
                        log.warn('TUTOR', `Next unit context failed: ${ctxErr.message}`);
                    }
 
                    let nextEnhancedContext = nextRagContext;
                    const nextMemoryContext = socraticService.buildPersonalizationContext(contextualMemory, query);
                    if (nextMemoryContext) nextEnhancedContext += `\n\n[STUDENT PROFILE]:\n${nextMemoryContext}`;
 
                    const nextIntro = await startSocraticSession(nextUnit, nextEnhancedContext, llmConfig, advanceResult.nextPosition);

                    // Strip any trailing checkpoint question from tutorResult.followUpQuestion so we never ask two questions in one turn
                    const affirmationOnly = String(tutorResult.followUpQuestion || '')
                        .replace(/\*\*Guided Learning Check\*\*:?[\s\S]*$/i, '')
                        .replace(/\n*[^\n]*\?\s*$/, '')
                        .trim();

                    let transitionParts = [];
                    transitionParts.push(`✅ **What You Mastered (${tutorState.teachingUnit || tutorResult.moduleTitle})**: ${affirmationOnly || `You demonstrated clear mastery of **${tutorState.teachingUnit || tutorResult.moduleTitle}**.`}`);
                    if (advanceResult.topicJustCompleted) {
                        transitionParts.push(`\n\n🎉 **Milestone Reached**: Completed topic **${advanceResult.topicCompletedName}**!`);
                    }
                    transitionParts.push(`\n\n📘 **Next Subtopic — ${nextUnit}**:\n\n${nextIntro}`);
                    finalReplyText = transitionParts.join('');
 
                    await clearTutorSessionState(sessionId);
                    nextTopicState = {
                        moduleId: advanceResult.nextPosition.moduleId,
                        moduleName: advanceResult.nextPosition.moduleName,
                        moduleIndex: advanceResult.nextPosition.moduleIndex,
                        topicId: advanceResult.nextPosition.topicId,
                        topicName: advanceResult.nextPosition.topicName,
                        topicIndex: advanceResult.nextPosition.topicIndex,
                        subtopicId: advanceResult.nextPosition.subtopicId,
                        subtopicName: advanceResult.nextPosition.subtopicName,
                        subtopicIndex: advanceResult.nextPosition.subtopicIndex,
                        teachingUnit: nextUnit,
                        teachingUnitType: advanceResult.nextPosition.teachingUnitType,
                        isLastInTopic: advanceResult.nextPosition.isLastInTopic,
                        isLastInModule: advanceResult.nextPosition.isLastInModule,
                        courseName,
                        moduleTitle: nextUnit,
                        lastQuestion: nextIntro,
                        turnCount: 0,
                        startedAt: new Date().toISOString(),
                        socraticState: SOCRATIC_STATES.INTRODUCTION,
                        masteryScore: 0,
                        cognitiveLevel: currentSmState?.cognitiveLevelName || currentSmState?.cognitiveLevel || 'L1_CONCEPT',
                        history: [],
                        consecutiveUnderstands: 0
                    };
                    await setTutorSessionState(sessionId, nextTopicState);
                } else if (advanceResult.nextPosition?.isComplete) {
                    await clearTutorSessionState(sessionId);
                    finalReplyText = `🎉 **Congratulations!**\n\nYou've mastered **${tutorState.teachingUnit || tutorResult.moduleTitle}** and completed the entire **${courseName}** curriculum!\n\nWould you like to:\n\n- **Review** any specific topic\n- Start a **new course**\n- Take a **final assessment**`;
                } else {
                    await clearTutorSessionState(sessionId);
                    finalReplyText = `🎉 **Mastery Achieved!** You've completed **${tutorState.teachingUnit || tutorResult.moduleTitle}**.\n\nWhat would you like to learn next?`;
                }
            } else {
                await clearTutorSessionState(sessionId);
            }
 
            const masteryReply = {
                sender: 'bot', role: 'model',
                text: finalReplyText, parts: [{ text: finalReplyText }],
                timestamp: new Date(),
                source_pipeline: 'tutor-mastery',
                socraticState: nextTopicState ? SOCRATIC_STATES.INTRODUCTION : tutorResult.socraticState,
                thinking: structThinkingTrace.thoughtMd,
                steps: structThinkingTrace.steps,
                confidenceScore: 96,
                criticalThinkingCues: [],
                xpDelta: xpResult
            };
 
            const aiMessageForDb = {
                role: 'model', parts: [{ text: finalReplyText }],
                timestamp: new Date(), source_pipeline: 'tutor-mastery'
            };
            await ChatHistory.findOneAndUpdate(
                { sessionId, userId },
                {
                    $push: { messages: { $each: buildMessagesEach(userMessageForDb, aiMessageForDb, isAutoGreeting), $slice: -100 } },
                    $set: { isTutorMode: true, tutorModeType: 'structured', updatedAt: new Date() }
                },
                { upsert: true }
            );
 
            const messageCount = (chatSession?.messages?.length || 0) + 2;
            triggerPeriodicAnalysis(sessionId, userId, messageCount, llmConfig);
 
            let dbCompletedModules = [];
            try {
                const freshUser = await User.findById(reqUser._id).select('curriculumProgress');
                dbCompletedModules = freshUser?.curriculumProgress?.get(courseName)?.completedModules || [];
            } catch (_) {}
 
            const progressUpdate = {
                type: 'progress_update',
                content: {
                    courseName,
                    masteredSubtopicId: tutorState.subtopicId,
                    masteredSubtopicName: tutorState.subtopicName || tutorState.teachingUnit,
                    masteredTopicId: advanceResult?.topicJustCompleted ? tutorState.topicId : null,
                    masteredTopicName: advanceResult?.topicCompletedName || null,
                    masteredModuleId: advanceResult?.moduleJustCompleted ? tutorState.moduleId : null,
                    masteredModuleName: advanceResult?.moduleCompletedName || null,
                    completedSubtopics: advanceResult?.completedSubtopics || [],
                    completedTopics: advanceResult?.completedTopics || [],
                    completedModules: dbCompletedModules,
                    currentPosition: nextTopicState ? {
                        subtopicId: nextTopicState.subtopicId,
                        subtopicName: nextTopicState.subtopicName,
                        topicId: nextTopicState.topicId,
                        topicName: nextTopicState.topicName,
                        moduleId: nextTopicState.moduleId,
                        moduleName: nextTopicState.moduleName,
                        teachingUnit: nextTopicState.teachingUnit
                    } : null,
                    isCourseComplete: advanceResult?.nextPosition?.isComplete || false
                }
            };
            streamEvent(res, progressUpdate);
 
            masteryReply.currentPosition = progressUpdate.content.currentPosition;
            masteryReply.progressUpdate = progressUpdate.content;
 
            streamEvent(res, { type: 'final_answer', content: masteryReply });
            res.end();
 
            setImmediate(() => {
                if (xpResult) {
                    const _mConceptName = tutorState?.teachingUnit || tutorState?.subtopicName || 'general';
                    awardTurnXpAsync(userId, xpResult.xp, _mConceptName, 'tutor_mastery');
                    scheduleQualityBonusAsync(userId, query.trim(), finalReplyText, _mConceptName, llmConfig);
                }
            });
 
            return true;
        }
        // ── End mastery handling ──────────────────────────────────────────────
 
        log.success('TUTOR', `Follow-up generated (Move: ${tutorResult.pedagogicalMove})`);
 
        const socraticReply = {
            sender: 'bot', role: 'model',
            text: tutorResult.followUpQuestion,
            parts: [{ text: tutorResult.followUpQuestion }],
            timestamp: new Date(),
            source_pipeline: `tutor-${tutorResult.pedagogicalMove?.toLowerCase() || 'socratic'}`,
            socraticState: tutorResult.socraticState,
            thinking: structThinkingTrace.thoughtMd,
            criticalThinkingCues: [],
            masteryProgress: tutorResult.masteryProgress || _masteryProgress || null,
            steps: (tutorResult.steps && tutorResult.steps.length > 0)
                ? tutorResult.steps
                : structThinkingTrace.steps,
            confidenceScore: 95,
            xpDelta: xpResult,
            interactiveChips: tutorResult.interactiveChips || [],
            cognitiveLevel: _strCogLvl,
            prerequisites: tutorResult.prerequisites || [],
            currentPosition: {
                subtopicId: tutorState.subtopicId,
                subtopicName: tutorState.subtopicName,
                topicId: tutorState.topicId,
                topicName: tutorState.topicName,
                moduleId: tutorState.moduleId,
                moduleName: tutorState.moduleName,
                teachingUnit: tutorState.teachingUnit,
                courseName: tutorState.courseName
            }
        };
 
        const aiMessageForDb = {
            role: 'model', parts: [{ text: tutorResult.followUpQuestion }],
            timestamp: new Date(), source_pipeline: socraticReply.source_pipeline
        };
        await ChatHistory.findOneAndUpdate(
            { sessionId, userId },
            {
                $push: { messages: { $each: buildMessagesEach(userMessageForDb, aiMessageForDb, isAutoGreeting), $slice: -100 } },
                $set: { isTutorMode: true, tutorModeType: 'structured', updatedAt: new Date() }
            },
            { upsert: true }
        );
 
        const messageCount = (chatSession?.messages?.length || 0) + 2;
        triggerPeriodicAnalysis(sessionId, userId, messageCount, llmConfig);
 
        streamEvent(res, { type: 'final_answer', content: socraticReply });
        res.end();
 
        setImmediate(() => {
            if (xpResult) {
                const _sConceptName = tutorState?.teachingUnit || tutorState?.subtopicName || 'general';
                awardTurnXpAsync(userId, xpResult.xp, _sConceptName, `tutor_${_strCls.toLowerCase()}`, { queryText: query, cognitiveLevel: _strCogLvl, course: documentContextName || 'General' });
                scheduleQualityBonusAsync(userId, query.trim(), tutorResult.followUpQuestion, _sConceptName, llmConfig);
            }
        });
 
        return true;
    }
 
    // ── Auto-initialize new tutor session (curriculum-driven) ─────────────────
    const rawCourseName = documentContextName || 'General';
    const courseName = (/^ee3621$/i.test(rawCourseName) || /digital\s*signal\s*processing/i.test(rawCourseName)) ? 'EE3621' : rawCourseName;
    log.info('TUTOR', `Initializing new tutor session for ${courseName}`);
    sendStatus('Resolving curriculum position…');
 
    let completedSubtopics = [];
    let completedTopics = [];
    let completedModules = [];
 
    if (courseName !== 'General' && reqUser) {
        try {
            const currentUser = await User.findById(reqUser._id);
            const userProgress = currentUser?.curriculumProgress?.get(courseName);
            completedSubtopics = userProgress?.completedSubtopics || [];
            completedTopics = userProgress?.completedTopics || [];
            completedModules = userProgress?.completedModules || [];
        } catch (e) {
            log.warn('TUTOR', `Pre-init progress fetch failed: ${e.message}`);
        }
    }
 
    let position = null;
    let teachingUnit = '';
 
    if (courseName !== 'General') {
        try {
            position = await resolveCurrentPosition(courseName, completedSubtopics, completedTopics, currentModulePathId);
            if (position && position.teachingUnit) {
                teachingUnit = position.teachingUnit;
                log.info('TUTOR', `Lesson Plan: "${teachingUnit}"`);
            } else if (position?.isComplete) {
                const completionReply = {
                    sender: 'bot', role: 'model',
                    text: `🎉 **Congratulations!** You have completed the entire **${courseName}** ${currentModulePathId ? 'module' : 'curriculum'}!\n\nWould you like to:\n- **Review** any topic\n- Start a **different course**\n- Do some **practice questions**`,
                    parts: [{ text: `🎉 **Congratulations!** You have completed the entire **${courseName}** ${currentModulePathId ? 'module' : 'curriculum'}!` }],
                    timestamp: new Date(),
                    source_pipeline: 'tutor-completion',
                    socraticState: SOCRATIC_STATES.MASTERY_ACHIEVED,
                    thinking: 'All curriculum items mastered.',
                    criticalThinkingCues: []
                };
                const aiMessageForDb = { role: 'model', parts: [{ text: completionReply.text }], timestamp: new Date(), source_pipeline: 'tutor-completion' };
                await ChatHistory.findOneAndUpdate(
                    { sessionId, userId },
                    { $push: { messages: { $each: buildMessagesEach(userMessageForDb, aiMessageForDb, isAutoGreeting), $slice: -100 } } },
                    { upsert: true }
                );
                streamEvent(res, { type: 'final_answer', content: completionReply });
                res.end();
                return true;
            }
        } catch (err) {
            if (err.code === 'CURRICULUM_EMPTY') {
                log.error('TUTOR', `Curriculum empty for '${courseName}': ${err.message}`);
                streamEvent(res, { type: 'error', content: err.message });
                res.end();
                return true;
            }
            log.warn('TUTOR', `Position resolution failed: ${err.message}`);
        }
    }
 
    if (!teachingUnit) {
        const rawQuery = query.trim();
        let extracted = rawQuery
            .replace(/^(tell me about|explain|what is|what us|how does|teach me|i want to learn about|describe|what's|who is|let'?s?\s*(start|go|begin|learn)\s*(with)?|start\s*(with)?|begin\s*(with)?)\s*/i, '')
            .replace(/\?$/, '')
            .trim();
        extracted = extracted.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        teachingUnit = (extracted && extracted.length > 2) ? extracted : (courseName !== 'General' ? courseName : 'General Concepts');
    }
 
    sendStatus(`Preparing lesson on ${teachingUnit}…`);
 
    let ragContext = '';
    let contextualMemoryText = '';
    let strugglingTopics = [];
 
    try {
        sendStatus('Loading student profile...');
        const [memoryContext, struggles] = await Promise.all([
            knowledgeStateService.getContextualMemory(userId, teachingUnit),
            knowledgeStateService.getStrugglingTopics(userId)
        ]);
        contextualMemoryText = memoryContext || '';
        strugglingTopics = struggles || [];
    } catch (memErr) {
        log.error('SYSTEM', 'Contextual memory fetch failed', memErr);
    }
 
    try {
        sendStatus('Gathering knowledge from course curriculum...');
        const subtopicId = position?.subtopicId;
        const topicId = position?.topicId;
        const contextData = await getSubtopicContext(courseName, subtopicId, topicId);
        if (contextData) {
            if (contextData.groundingBlock) {
                ragContext = contextData.groundingBlock;
            } else if (contextData.qdrant_chunks && contextData.qdrant_chunks.length > 0) {
                ragContext = contextData.qdrant_chunks.map(chunk => chunk.text).join('\n\n').slice(0, 2000);
            }
        }
    } catch (e) {
        log.warn('SYSTEM', `Context fetch failed: ${e.message}`);
    }
 
    ragContext = ragContext || '';

    // ── Gemini Guided Learning Fast Initialization for EE3621 / DSP ─────────
    if (/^(ee3621|digital signal processing|dsp)$/i.test(String(courseName || '').trim())) {
        log.info('TUTOR', `Initializing Gemini Guided Learning structured session for ${courseName} - "${teachingUnit}"`);
        const structuredTurn = geminiGuidedLearningService.generateStructuredTurn({
            topic: teachingUnit,
            studentResponse: query.trim(),
            turnCount: 0,
            isInitialTurn: true,
            courseName
        });
        const initialResponse = geminiGuidedLearningService.formatTurnAsText(structuredTurn);
        const { steps: traceSteps, thoughtMd } = emitGeminiThinkingStream(res, structuredTurn, teachingUnit, query.trim());

        // Stream initial tokens immediately for TTFT <= 2000ms
        const tokens = initialResponse.split(/(\s+)/);
        for (const tok of tokens) {
            streamEvent(res, { type: 'token', content: tok });
        }

        const newTutorState = {
            moduleId: position?.moduleId || 'mod_1',
            moduleName: position?.moduleName || 'Unit I: Basic Elements of Digital Signal Processing',
            moduleIndex: position?.moduleIndex ?? 0,
            moduleTitle: teachingUnit,
            topicId: position?.topicId || 'top_1',
            topicName: position?.topicName || 'Course Introduction & Discrete-Time Signals',
            topicIndex: position?.topicIndex ?? 0,
            subtopicId: position?.subtopicId || 'ee3621_l1',
            subtopicName: position?.subtopicName || 'DSP vs Analog Signal Processing, ADC block diagram, Quantization SQNR, Sample and Hold circuits, Classification of DT signals, Elementary sequences',
            subtopicIndex: position?.subtopicIndex ?? 0,
            teachingUnit,
            teachingUnitType: position?.teachingUnitType || 'subtopic',
            courseName,
            isLastInTopic: position?.isLastInTopic || false,
            isLastInModule: position?.isLastInModule || false,
            lastQuestion: initialResponse,
            turnCount: 0,
            startedAt: new Date().toISOString(),
            socraticState: SOCRATIC_STATES.INTRODUCTION,
            masteryScore: 0,
            cognitiveLevel: 'L1_CONCEPT',
            topic: position?.subtopicName || position?.topicName || teachingUnit,
            consecutiveWrong: 0,
            hintsGiven: 0,
            history: [],
            structuredTurn
        };

        await setTutorSessionState(sessionId, newTutorState);

        await saveUserProgress(userId.toString(), courseName, {
            completedSubtopics,
            completedTopics,
            completedModules,
            currentPosition: position,
            lastActiveDate: new Date().toISOString()
        });

        const introReply = {
            sender: 'bot',
            role: 'model',
            text: initialResponse,
            parts: [{ text: initialResponse }],
            timestamp: new Date(),
            source_pipeline: 'tutor-introduction',
            socraticState: SOCRATIC_STATES.INTRODUCTION,
            thinking: thoughtMd,
            steps: traceSteps,
            confidenceScore: 96,
            currentPosition: position,
            structuredTurn,
            interactiveChips: structuredTurn.quick_hypotheses?.map(h => h.text) || [],
            criticalThinkingCues: []
        };

        const aiMessageForDb = {
            role: 'model',
            parts: [{ text: initialResponse }],
            timestamp: new Date(),
            source_pipeline: 'tutor-introduction',
            structuredTurn
        };

        await ChatHistory.findOneAndUpdate(
            { sessionId, userId },
            {
                $push: { messages: { $each: buildMessagesEach(userMessageForDb, aiMessageForDb, isAutoGreeting), $slice: -100 } },
                $set: { isTutorMode: true, tutorModeType: 'structured', courseName, updatedAt: new Date() }
            },
            { upsert: true }
        );

        streamEvent(res, { type: 'final_answer', content: introReply });
        res.end();
        return true;
    }

    let initialResponse = '';
    try {
        sendStatus(`Generating Socratic introduction for ${teachingUnit}...`);
        let enhancedContext = ragContext;
        const topicContext = position?.topicName ? `(part of ${position.topicName})` : '';
        const moduleContext = position?.moduleName ? `in ${position.moduleName}` : '';
        if (topicContext) enhancedContext += `\n\nThis subtopic ${topicContext} ${moduleContext}.`;
        if (contextualMemoryText) enhancedContext += `\n\n[STUDENT PROFILE FOR PERSONALIZATION]:\n${contextualMemoryText}`;
        if (strugglingTopics.length > 0) {
            const strugglingNames = strugglingTopics.map(t => t.conceptName || t.name).join(', ');
            enhancedContext += `\n\n[STUDENT STRUGGLES]: The student has previously struggled with: ${strugglingNames}.`;
        }
 
        if (position?.topicId && courseName !== 'General') {
            try {
                const PYTHON_RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:2001';
                const prereqRes = await axios.post(
                    `${PYTHON_RAG_SERVICE_URL}/course/${encodeURIComponent(courseName)}/topic/${encodeURIComponent(position.topicId)}/missing-prerequisites`,
                    { completed_subtopic_ids: completedSubtopics },
                    { timeout: 5000 }
                );
                const missing = prereqRes.data?.missing_prerequisites || [];
                if (missing.length > 0) {
                    const names = missing.map(p => p.name || p.id).join(', ');
                    enhancedContext += `\n\n[PREREQUISITE ALERT]: Student may benefit from reviewing: ${names}.`;
                }
            } catch (prereqErr) {
                log.warn('TUTOR', `Prereq check skipped (non-fatal): ${prereqErr.message}`);
            }
        }
 
        const structIntroThinking = emitGeminiThinkingStream(res, null, teachingUnit, query.trim());
        initialResponse = await startSocraticSession(
            teachingUnit,
            enhancedContext,
            llmConfig,
            position,
            (event) => {
                if (typeof event === 'string') {
                    streamEvent(res, { type: 'token', content: event });
                } else {
                    streamEvent(res, event);
                }
            }
        );
        log.success('TUTOR', `LLM generation complete for ${teachingUnit}`);
    } catch (err) {
        log.error('TUTOR', `Error in startSocraticSession: ${err.message}`, err);
        initialResponse = `📘 **Guided Learning: ${teachingUnit}**\n\nLet's dive into **${teachingUnit}**!\n\n**Guided Learning Check**: To get started, can you tell me what you already know about this topic?`;
    }
 
    // ── Detect prior knowledge and difficulty intent ──────────────────────────
    const rawQuery = query.trim();
    const priorKnowledgeAnalysis = priorKnowledgeDetector.detectPriorKnowledge(rawQuery);
    const { hasPriorKnowledge: structHasPriorKnowledge, masteredTopics: structMasteredTopics, difficultyLevel: structDifficultyLevel, signals: structSignals } = priorKnowledgeAnalysis;
 
    if (priorKnowledgeAnalysis.hasPriorKnowledge) {
        log.info('TUTOR', `Prior Knowledge Profile (Structured):`);
        log.info('TUTOR', `  Topics: ${structMasteredTopics.join(', ') || 'N/A'}`);
        log.info('TUTOR', `  Difficulty: ${structDifficultyLevel}`);
        log.info('TUTOR', `  Confidence: ${Math.round(priorKnowledgeAnalysis.confidence * 100)}%`);
    }
 
    const startingCognitiveLevel = selectStartingCognitiveLevel(structDifficultyLevel, structHasPriorKnowledge);
 
    const newTutorState = {
        moduleId: position?.moduleId || null,
        moduleName: position?.moduleName || null,
        moduleIndex: position?.moduleIndex ?? 0,
        moduleTitle: teachingUnit,
        topicId: position?.topicId || null,
        topicName: position?.topicName || null,
        topicIndex: position?.topicIndex ?? 0,
        subtopicId: position?.subtopicId || null,
        subtopicName: position?.subtopicName || null,
        subtopicIndex: position?.subtopicIndex ?? 0,
        teachingUnit,
        teachingUnitType: position?.teachingUnitType || 'topic',
        courseName,
        isLastInTopic: position?.isLastInTopic || false,
        isLastInModule: position?.isLastInModule || false,
        lastQuestion: initialResponse,
        turnCount: 0,
        startedAt: new Date().toISOString(),
        socraticState: SOCRATIC_STATES.INTRODUCTION,
        masteryScore: 0,
        cognitiveLevel: startingCognitiveLevel,
        topic: position?.subtopicName || position?.topicName || teachingUnit,
        consecutiveWrong: 0,
        hintsGiven: 0,
        history: [],
        learningPath: await buildInitialLearningPath(courseName, position),
        priorKnowledgeAnalysis: {
            hasPriorKnowledge: structHasPriorKnowledge,
            masteredTopics: structMasteredTopics,
            difficultyLevel: structDifficultyLevel,
            signals: structSignals
        }
    };
 
    await setTutorSessionState(sessionId, newTutorState);
 
    await saveUserProgress(userId.toString(), courseName, {
        completedSubtopics,
        completedTopics,
        completedModules,
        currentPosition: position,
        lastActiveDate: new Date().toISOString()
    });
 
    const fallbackStructThinking = buildDefaultThinkingSteps(teachingUnit, 'Guided Learning', query.trim());
    const introReply = {
        sender: 'bot', role: 'model',
        text: initialResponse, parts: [{ text: initialResponse }],
        timestamp: new Date(),
        source_pipeline: 'tutor-introduction',
        socraticState: SOCRATIC_STATES.INTRODUCTION,
        thinking: `**1. Dissecting Intuition:** Analyzed learner input and conceptual framing for **${teachingUnit}**.\n\n**2. Collating Grounding:** Gathered curriculum definitions, governing formulas, and concrete examples.\n\n**3. Synthesizing Pedagogical Move:** Structured guided explanation and single check-for-understanding question.`,
        steps: fallbackStructThinking,
        confidenceScore: 95,
        currentPosition: position,
        criticalThinkingCues: []
    };
 
    const aiMessageForDb = {
        role: 'model', parts: [{ text: initialResponse }],
        timestamp: new Date(), source_pipeline: 'tutor-introduction'
    };
    await ChatHistory.findOneAndUpdate(
        { sessionId, userId },
        {
            $push: { messages: { $each: buildMessagesEach(userMessageForDb, aiMessageForDb, isAutoGreeting), $slice: -100 } },
            $set: { isTutorMode: true, tutorModeType: 'structured', courseName, updatedAt: new Date() }
        },
        { upsert: true }
    );
 
    streamEvent(res, { type: 'final_answer', content: introReply });
    res.end();
    return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// GUIDED LEARNING / STUDY MODE (Document-Driven & Step-by-Step Socratic)
// ─────────────────────────────────────────────────────────────────────────────

async function handleGuidedLearning(res, ctx) {
    const {
        tutorMode, tutorModeType, query, sessionId, userId,
        llmConfig, chatSession, userMessageForDb, historyForLlm,
        documentContextName, isAutoGreeting
    } = ctx;

    if (!tutorMode || (tutorModeType !== TUTOR_MODE_TYPES.GUIDED_LEARNING && tutorModeType !== TUTOR_MODE_TYPES.STUDY_MODE)) return false;

    log.info('TUTOR', `Processing Guided Learning / Study Mode for session ${sessionId} (Document: ${documentContextName || 'None'})`);

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendStatus = (status) => streamEvent(res, { type: 'status_update', content: status });

    const sessionContext = {
        userId: userId.toString(),
        sessionId,
        documentContext: documentContextName || null,
        courseName: documentContextName || 'Guided Study'
    };

    let documentRagContext = '';
    if (documentContextName) {
        try {
            const PYTHON_RAG_SERVICE_URL = process.env.PYTHON_RAG_SERVICE_URL || 'http://localhost:2001';
            const graphRes = await axios.post(
                `${PYTHON_RAG_SERVICE_URL}/graph/search`,
                { query: query.trim(), user_id: userId.toString(), document_context: documentContextName },
                { timeout: 3000 }
            );
            if (graphRes.data?.facts) documentRagContext = graphRes.data.facts;
        } catch (_gErr) {
            log.debug('TUTOR', `Guided learning RAG search skipped: ${_gErr.message}`);
        }
    }

    const effectiveQuery = documentRagContext
        ? `${query.trim()}\n\n[DOCUMENT CONTEXT (${documentContextName})]:\n${documentRagContext}`
        : query.trim();

    try {
        const guidedThinkingTrace = emitGeminiThinkingStream(res, null, documentContextName || 'Guided Study', query.trim());
        const guidedResult = await guidedLearningOrchestrator.processGuidedLearning(
            effectiveQuery,
            null, // correctAnswer
            historyForLlm || [],
            llmConfig,
            sessionContext,
            (eventData) => {
                if (eventData.type === 'status') {
                    sendStatus(eventData.content);
                } else if (eventData.type === 'answer') {
                    streamEvent(res, { type: 'token', content: eventData.content });
                } else if (eventData.type === 'thought') {
                    streamEvent(res, { type: 'thinking', content: eventData.content });
                }
            }
        );

        const text = guidedResult.finalAnswer || guidedResult.text || '';
        const guidedReply = {
            sender: 'bot',
            role: 'model',
            text,
            parts: [{ text }],
            timestamp: new Date(),
            source_pipeline: 'guided-learning-study-mode',
            socraticState: 'GUIDED_LEARNING',
            thinking: guidedResult.thinking || guidedThinkingTrace.thoughtMd,
            steps: guidedThinkingTrace.steps,
            confidenceScore: 95,
            action: guidedResult.action || null,
            tutorSession: guidedResult.tutorSession || null,
            criticalThinkingCues: []
        };

        streamEvent(res, { type: 'final_answer', content: guidedReply });
        res.end();

        setImmediate(async () => {
            try {
                const aiMsgForDb = {
                    role: 'model',
                    parts: [{ text }],
                    timestamp: new Date(),
                    source_pipeline: 'guided-learning-study-mode'
                };
                await ChatHistory.findOneAndUpdate(
                    { sessionId, userId },
                    {
                        $push: { messages: { $each: buildMessagesEach(userMessageForDb, aiMsgForDb, isAutoGreeting), $slice: -100 } },
                        $set: { isTutorMode: true, tutorModeType: 'guided_learning', updatedAt: new Date() }
                    },
                    { upsert: true }
                );
                if (!isAutoGreeting && query && query.trim().length >= 4) {
                    const gamificationService = require('../../../services/gamificationService');
                    await gamificationService.awardXP(
                        userId,
                        10,
                        'tutor_turn',
                        documentContextName || 'Guided Learning',
                        { queryText: query.trim(), course: documentContextName || 'General' }
                    ).catch(() => {});
                }
            } catch (err) {
                log.error('TUTOR', `Guided learning DB write error: ${err.message}`);
            }
        });

        return true;
    } catch (error) {
        log.error('TUTOR', `Guided learning handler failed: ${error.message}`);
        const fallbackText = `I'm in **Guided Learning Study Mode**. Let's break down "${query.trim()}" step by step.\n\nWhat do you already understand about this concept?`;
        const fallbackReply = {
            sender: 'bot',
            role: 'model',
            text: fallbackText,
            parts: [{ text: fallbackText }],
            timestamp: new Date(),
            source_pipeline: 'guided-learning-fallback'
        };
        streamEvent(res, { type: 'final_answer', content: fallbackReply });
        res.end();
        return true;
    }
}

module.exports = { handleGeneral, handleStructured, handleGuidedLearning };
 
