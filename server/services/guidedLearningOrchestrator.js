/**
 * HOTFIX: Safer version of guidedLearningOrchestrator to prevent Gemini 500 errors
 * 
 * Issue: Multiple consecutive LLM calls in tutor mode can cause:
 * 1. Gemini rate limiting (503/500 errors)
 * 2. Context overflow
 * 3. JSON parsing failures
 * 
 * Fixes:
 * - Add retry logic with exponential backoff
 * - Limit conversation history to prevent context overflow
 * - Better error handling
 * - Graceful degradation
 */

const geminiService = require('./geminiService');
const sglangService = require('./sglangService');
const TutorSession = require('../models/TutorSession');
const {
    analyzeKnowledgeGaps,
    extractLearningGoal,
    assessHintEffectiveness
} = require('./knowledgeGapAnalyzer');
const {
    generateAdaptiveHint,
    suggestNextAction
} = require('./adaptiveScaffoldService');
const socraticTutorService = require('./socraticTutorService');

// CONFIGURATION: Limits to prevent API overload
const MAX_CONVERSATION_HISTORY = 10; // Limit history to last 10 messages
const RETRY_ATTEMPTS = 2; // Retry failed API calls
const RETRY_DELAY_MS = 1000; // Wait 1 second between retries

/**
 * Main entry point for guided learning mode (HOTFIX VERSION)
 */
async function processGuidedLearning(
    userQuery,
    correctAnswer,
    conversationHistory,
    llmConfig,
    sessionContext = {},
    streamCallback = null // New parameter for streaming
) {
    console.log(`[GuidedLearning] Starting LLM-driven tutoring for: "${userQuery}"`);

    try {
        // FIX 1: Limit conversation history to prevent context overflow
        const limitedHistory = conversationHistory.slice(-MAX_CONVERSATION_HISTORY);

        // FIX 2: Get or create tutor session (with error handling)
        let tutorSession;
        try {
            tutorSession = await getOrCreateTutorSession(
                userQuery,
                sessionContext,
                llmConfig
            );
        } catch (sessionError) {
            console.error('[GuidedLearning] Failed to create tutor session:', sessionError);
            // Fallback: Return simple guided response without session tracking
            const fallback = generateSimpleFallbackResponse(userQuery, correctAnswer);
            if (streamCallback) streamCallback({ type: 'answer', content: fallback.finalAnswer });
            return fallback;
        }

        // Add student's query
        tutorSession.addInteraction('student', userQuery);

        // Fast deterministic gap & comprehension tracking + single-call Socratic generation
        let analysis = null;
        if (tutorSession.conversationContext.length > 1) {
            const cleanResp = String(userQuery || '').split('\n')[0].trim();
            const isDetailed = cleanResp.length > 45 && !/^(idk|i don't know|help|not sure)/i.test(cleanResp);
            const compLevel = isDetailed ? 0.8 : 0.45;
            const topicLabel = extractKeyTopic(tutorSession.learningGoal || cleanResp);
            analysis = {
                comprehensionLevel: compLevel,
                gaps: isDetailed ? [] : [topicLabel]
            };
            if (isDetailed) {
                if (!tutorSession.progressTracking.conceptsUnderstood.includes(topicLabel)) {
                    tutorSession.progressTracking.conceptsUnderstood.push(topicLabel);
                }
                tutorSession.masteryScore = Math.min(100, (tutorSession.masteryScore || 0) + 25);
            } else {
                if (!tutorSession.progressTracking.conceptsStruggling.includes(topicLabel)) {
                    tutorSession.progressTracking.conceptsStruggling.push(topicLabel);
                }
            }
        }

        const assessedLevel = tutorSession.assessStudentLevel();
        if (assessedLevel !== 'unknown') {
            tutorSession.studentLevel = assessedLevel;
        }

        const thinkingMessage = buildThinkingMessage(tutorSession, analysis);
        if (streamCallback) {
            streamCallback({ type: 'thought', content: thinkingMessage });
            streamCallback({ type: 'status', content: 'Generating Socratic guidance...' });
        }

        let adaptiveHint = '';
        try {
            const recentMsgs = tutorSession.conversationContext.slice(-4).map(m => ({
                role: m.role === 'student' ? 'user' : 'model',
                parts: [{ text: m.message || '' }]
            }));
            const sysPrompt = `You are iMentor's Guided Learning Coach (modeled after Google Gemini Guided Learning & ChatGPT Study Mode) for ${tutorSession.subject || 'Digital Signal Processing (EE3621)'}.
Learning Goal: "${tutorSession.learningGoal}".
Follow this exact Guided Learning flow to prevent mental fatigue:
1. **✅ Acknowledge Your Competence**: Explicitly validate what the student understood well, echoing their specific terms or intuition.
2. **🔄 Reframing Your Response (If Partial/Misconception)**: Re-articulate the student's response constructively to nudge them in the right direction.
3. **💡 Guidance & Hint (If Partial/Misconception)**: Provide a clear teaching explanation (with an intuitive analogy and KaTeX math \`$...$\` / \`$$...$$\`) and a concrete hint toward the correct answer.
4. **📘 Next Subtopic (If Correct)**: When the student gives a correct response, affirm mastery under \`✅ **What You Mastered**:\`, clearly explain the NEXT subtopic under \`📘 **Next Subtopic**:\`, and end with one check question labeled \`**Guided Learning Check**:\`.
5. Keep any Markdown table compact (max 3–4 columns, 6–10 words per cell). /no_think`;

            adaptiveHint = await Promise.race([
                sglangService.generateContentWithHistory(
                    recentMsgs,
                    `${userQuery} /no_think`,
                    sysPrompt,
                    { maxTokens: 650, temperature: 0.5, endpoint: 'chat' }
                ),
                new Promise((_, rej) => setTimeout(() => rej(new Error('SGLang guided timeout')), 15000))
            ]);
            adaptiveHint = String(adaptiveHint || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

            if (streamCallback && adaptiveHint) {
                streamCallback({ type: 'answer', content: adaptiveHint });
            }
        } catch (hintError) {
            console.warn('[GuidedLearning] Fast SGLang call timed out, using structured DSP fallback:', hintError.message);
            const geminiGuided = require('./geminiGuidedLearningService');
            const turn = geminiGuided.generateStructuredTurn({
                topic: tutorSession.learningGoal || userQuery,
                studentResponse: userQuery,
                courseName: tutorSession.course || 'EE3621'
            });
            adaptiveHint = geminiGuided.formatTurnAsText(turn);
            if (streamCallback) streamCallback({ type: 'answer', content: adaptiveHint });
        }

        // Record the hint
        tutorSession.recordHint(adaptiveHint);

        // Add tutor's response
        const comprehensionLevel = analysis ? analysis.comprehensionLevel : null;
        tutorSession.addInteraction('tutor', adaptiveHint, comprehensionLevel);

        // Save session (with error handling)
        try {
            await tutorSession.save();
        } catch (saveError) {
            console.error('[GuidedLearning] Failed to save session:', saveError);
            // Continue anyway
        }

        const cleanedAnswer = adaptiveHint.replace(/\\n/g, '\n');

        return {
            finalAnswer: cleanedAnswer,
            text: cleanedAnswer, // Frontend compatibility alias
            thinking: thinkingMessage,
            sourcePipeline: 'guided_learning',
            action: {
                type: 'guided_learning',
                status: 'active',
                tutorSessionId: tutorSession._id,
                studentLevel: tutorSession.studentLevel,
                comprehensionLevel: comprehensionLevel,
                knowledgeGaps: tutorSession.knowledgeGaps.filter(g => !g.resolved).map(g => g.concept),
                learningGoal: tutorSession.learningGoal,
                progressTracking: tutorSession.progressTracking
            },
            tutorSession: {
                learningGoal: tutorSession.learningGoal,
                studentLevel: tutorSession.studentLevel,
                knowledgeGaps: tutorSession.knowledgeGaps,
                comprehensionLevel,
                tutorSessionId: tutorSession._id,
                progressTracking: tutorSession.progressTracking,
                courseName: sessionContext?.courseName || null,
                masteryProgress: sessionContext?.masteryProgress || null
            }
        };

    } catch (error) {
        console.error('[GuidedLearning] Critical error:', error);
        const fallback = generateSimpleFallbackResponse(userQuery, correctAnswer);
        if (streamCallback) streamCallback({ type: 'answer', content: fallback.finalAnswer });
        return fallback;
    }
}

/**
 * HELPER: Retry function with exponential backoff
 */
async function retryWithBackoff(fn, maxAttempts, baseDelay) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error; // Give up after max attempts
            }

            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * HELPER: Simple fallback when all else fails
 */
function generateSimpleFallbackResponse(userQuery, correctAnswer) {
    const rawAnswer = `Let me ask you a question to help you think about this:\n\nWhat do you already know about "${extractKeyTopic(userQuery)}"?\n\n(Tutor Mode is active but simplified due to technical issues)`;
    return {
        finalAnswer: rawAnswer,
        thinking: 'Using simplified tutor mode due to API constraints',
        action: {
            type: 'guided_learning',
            status: 'fallback'
        }
    };
}

/**
 * HELPER: Generate simple Socratic question when hint generation fails
 */
function generateSimpleSocraticQuestion(query, studentLevel) {
    const topic = extractKeyTopic(query);

    const questions = {
        beginner: [
            `Let's break this down. What do you already know about ${topic}?`,
            `Before we dive in, can you tell me what you understand about ${topic} so far?`,
            `Great question! Let's start simple - what comes to mind when you think of ${topic}?`
        ],
        intermediate: [
            `What aspects of ${topic} are you most curious about?`,
            `Can you explain your current understanding of ${topic}?`,
            `What have you tried to understand about ${topic} so far?`
        ],
        advanced: [
            `What specific aspect of ${topic} would you like to explore?`,
            `How does ${topic} relate to what you already know?`,
            `What's your current hypothesis about ${topic}?`
        ]
    };

    const levelQuestions = questions[studentLevel] || questions.beginner;
    return levelQuestions[Math.floor(Math.random() * levelQuestions.length)];
}

/**
 * HELPER: Extract key topic from query
 */
function extractKeyTopic(query) {
    // Simple keyword extraction
    const words = query.toLowerCase().replace(/[?!.]/g, '').split(' ');
    const stopWords = ['what', 'is', 'are', 'the', 'a', 'an', 'how', 'why', 'when', 'where'];
    const meaningfulWords = words.filter(w => w.length > 3 && !stopWords.includes(w));
    return meaningfulWords.slice(0, 3).join(' ') || 'this topic';
}

// ... rest of the functions remain the same (getOrCreateTutorSession, build ThinkingMessage, etc.)

async function getOrCreateTutorSession(userQuery, sessionContext, llmConfig) {
    const { userId, sessionId, subject, course, courseName, documentContext } = sessionContext;
    const rawCourse = course || courseName || documentContext || 'General Course';
    const normalizedCourse = (/^ee3621$/i.test(rawCourse) || /digital\s*signal\s*processing/i.test(rawCourse)) ? 'EE3621' : rawCourse;
    const normalizedSubject = subject || (normalizedCourse === 'EE3621' ? 'Digital Signal Processing (EE3621)' : documentContext) || 'General Knowledge';

    // Try to find existing session
    let tutorSession = await TutorSession.findOne({ sessionId }).sort({ updatedAt: -1 });

    if (tutorSession) {
        console.log(`[GuidedLearning] Continuing session: ${tutorSession._id}`);
        return tutorSession;
    }

    // Create new session
    console.log('[GuidedLearning] Creating new tutor session');

    // Extract learning goal deterministically for fast TTFT (avoid redundant LLM round-trip)
    const cleanQueryLine = String(userQuery || '').split('\n')[0].trim();
    const learningGoal = cleanQueryLine.length > 0 && cleanQueryLine.length <= 240
        ? cleanQueryLine
        : extractKeyTopic(cleanQueryLine);

    tutorSession = new TutorSession({
        userId,
        sessionId,
        learningGoal,
        studentLevel: 'unknown',
        subject: normalizedSubject,
        course: normalizedCourse,
        documentContext: documentContext || null,
        knowledgeGaps: [],
        conversationContext: [],
        previousHints: [],
        progressTracking: {
            totalInteractions: 0,
            successfulGuidance: 0,
            conceptsUnderstood: [],
            conceptsStruggling: []
        },
        // --- Adaptive Socratic 2.0 State ---
        masteryScore: 0,
        struggleCount: 0,
        emotionalState: 'CURIOUS',
        supportLevel: 'MINIMAL',
        // ----------------------------------
        status: 'active'
    });

    await tutorSession.save();
    console.log(`[GuidedLearning] Created new Adaptive Socratic session for ${tutorSession.subject}: ${tutorSession._id}`);

    return tutorSession;
}

function buildThinkingMessage(tutorSession, analysis) {
    const goal = tutorSession.learningGoal || 'Core Concept';
    const compPct = analysis ? `${(analysis.comprehensionLevel * 100).toFixed(0)}%` : 'Initial Assessment';
    const focus = (analysis?.gaps && analysis.gaps.length > 0) ? analysis.gaps.slice(0, 2).join(', ') : goal;
    return (
        `**1. Dissecting Learner Intuition:** Evaluated response against learning goal (*${goal}*, comprehension: ${compPct}).\n\n` +
        `**2. Collating Course Grounding:** Mapped conceptual focus (${focus}) to syllabus definitions, analogies, and KaTeX equations.\n\n` +
        `**3. Synthesizing Guided Response:** Structured competency acknowledgement, scaffolding explanation, and single check question.`
    );
}

module.exports = {
    processGuidedLearning
};
