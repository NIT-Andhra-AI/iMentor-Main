// server/services/learning/curriculumOrchestrator.js
const LearningPath = require('../../models/LearningPath');
const User = require('../../models/User');
const geminiService = require('../geminiService');
const sglangService = require('../sglangService');
const groqService = require('../groqService');
const { decrypt } = require('../../utils/crypto');
const { queryPythonRagService } = require('../toolExecutionService');
const { resolveProviderByPreference } = require('../providerPriorityService');
const log = require('../../utils/logger');

const GOAL_ANALYSIS_PROMPT = `You are an expert curriculum designer. Your first task is to analyze a user's learning goal to determine if it's specific enough to build a detailed plan, or if it's too broad and requires clarification.

**User's Goal:** "{goal}"

**Instructions:**
Analyze the goal and return a single JSON object with one key, "isSpecific".
- If the goal is specific and actionable (e.g., "learn python decorators", "prepare for my networking exam on the OSI model"), set "isSpecific" to true.
- If the goal is broad and requires more user input to create a meaningful plan (e.g., "learn programming", "get better at math", "learn full stack development"), set "isSpecific" to false.

Your output MUST be ONLY the JSON object.
Example for a specific goal: { "isSpecific": true }
Example for a broad goal: { "isSpecific": false }
`;

const CLARIFICATION_QUESTIONS_PROMPT = `You are an expert curriculum designer. A user has stated a broad learning goal: "{goal}". To create a personalized and effective study plan, you need to ask them a few clarifying questions.

**Instructions:**
1. Generate 2-3 essential multiple-choice or short-answer questions to narrow down the user's goal.
2. The questions should help you understand their preferred technologies, current skill level, and specific interests within the broad topic.
3. Your entire output MUST be a single, valid JSON object with one key, "questions".
4. The "questions" key must hold an array of question objects. Each object must have:
   - "questionText": The question to ask the user.
   - "type": Either "multiple_choice" or "text_input".
   - "options" (for multiple_choice only): An array of strings representing the choices.

**Example JSON Output for "Learn Full Stack Development":**
{
  "questions": [
    {
      "questionText": "Great goal! To start, which technology stack interests you most?",
      "type": "multiple_choice",
      "options": ["MERN Stack (React, Node.js)", "MEAN Stack (Angular, Node.js)", "Something else"]
    },
    {
      "questionText": "What is your current comfort level with frontend development?",
      "type": "multiple_choice",
      "options": ["Complete beginner", "I know some HTML/CSS", "I have experience with a framework"]
    }
  ]
}
`;

const PLAN_GENERATION_PROMPT = `You are a world-class AI academic advisor and curriculum designer for a prestigious university. Your task is to create a detailed, comprehensive, and actionable learning path for a student.

**CONTEXT:**
- **User Profile:**
  - **Level:** {degreeType}, {year}
  - **Field:** {branch}
  - **Preferred Learning Style:** {learningStyle}
  - **Identified Weaknesses:** {knowledgeGaps}
- **User's Ultimate Goal:** "{goal}"

**CRITICAL INSTRUCTIONS:**
1.  **ADAPT PLAN SCALE:** Analyze the user's goal.
    -   If the goal is **broad and long-term** (e.g., "learn full stack development", "master machine learning"), you MUST generate a comprehensive curriculum with **6-10 modules**, broken into logical phases (e.g., "Phase 1: Fundamentals").
    -   If the goal is **specific and short-term** (e.g., "understand python decorators", "learn how TCP works"), you MUST generate a concise, focused plan of **3-5 modules** that directly addresses the concept.
2.  **MODULE DESIGN:** Each module must be a clear, actionable step. For each module, provide:
    -   A "title" that is specific and descriptive.
    -   A brief "objective" explaining the learning outcome for that module.
    -   An "activity" object containing:
        -   "type": The best tool for the task. Your default choice should be 'direct_answer' (approx. 80% of the time). Use 'web_search' for very modern topics, libraries, or practical tutorials. Use 'academic_search' only for deep, theoretical concepts. Use 'code_executor' for hands-on programming tasks. **DO NOT generate a 'document_review' type.**
        -   "suggestedPrompt": A clear, effective prompt the user can send to the AI to begin the activity. This prompt should be a complete instruction.
3.  **LOGICAL STRUCTURE:** The sequence of modules MUST be pedagogically sound. Start with fundamentals and build complexity. Prioritize modules that address the user's "Identified Weaknesses".

**OUTPUT FORMAT (ABSOLUTELY STRICT):**
-   Your entire output must be a single, valid JSON object.
-   The root object must have one key: "modules".
-   "modules" must be an array of module objects as described above.
-   Do NOT include any extra text, markdown, or explanations outside of the JSON structure.

**EXAMPLE FOR A BROAD GOAL ("Learn MERN Stack"):**
{
  "modules": [
    {
      "title": "Phase 1: Frontend Fundamentals - Module 1: JavaScript ES6+ Core Concepts",
      "objective": "Master the modern JavaScript features essential for React development.",
      "activity": { "type": "direct_answer", "suggestedPrompt": "Explain the following ES6+ JavaScript concepts with code examples: let/const, arrow functions, destructuring, and modules." }
    },
    {
      "title": "Phase 1: Frontend Fundamentals - Module 2: Introduction to React & JSX",
      "objective": "Understand the core concepts of React, components, and JSX syntax.",
      "activity": { "type": "direct_answer", "suggestedPrompt": "What is React and JSX? Provide a simple 'Hello World' example of a React component." }
    },
    {
      "title": "Phase 2: Backend Development - Module 1: Building a Basic Express Server",
      "objective": "Learn to create a simple web server using Node.js and Express.",
      "activity": { "type": "code_executor", "suggestedPrompt": "Guide me step-by-step in building a basic 'Hello World' server with Node.js and Express that listens on port 3000." }
    }
  ]
}`;

/**
 * Safely extracts and parses JSON from LLM output with auto-repair for truncated/missing braces
 */
function safeParseJson(rawText) {
    if (!rawText || typeof rawText !== 'string') return null;
    let clean = rawText.trim();
    // Remove markdown code fences
    clean = clean.replace(/```(?:json)?/gi, '').replace(/```/gi, '').trim();
    
    // 1. Try standard parse
    try {
        const res = JSON.parse(clean);
        return Array.isArray(res) ? { modules: res } : res;
    } catch (e) {}

    // 2. Check if closing brace or bracket missing
    const fixAttempts = [
        clean + '}',
        clean + ']}',
        clean + '"}]}',
        clean + '"}}'
    ];
    for (const attempt of fixAttempts) {
        try {
            const res = JSON.parse(attempt);
            return Array.isArray(res) ? { modules: res } : res;
        } catch (e) {}
    }

    // 3. Substring extraction & repair
    const jsonMatch = clean.match(/\{[\s\S]*/);
    if (jsonMatch) {
        let candidate = jsonMatch[0].trim();
        const candidateAttempts = [
            candidate,
            candidate + '}',
            candidate + ']}',
            candidate + '"}]}',
            candidate + '"}}'
        ];
        for (const attempt of candidateAttempts) {
            try {
                const res = JSON.parse(attempt);
                return Array.isArray(res) ? { modules: res } : res;
            } catch (e) {}
        }
    }
    return null;
}

/**
 * Resolves LLM client and proper options based on active provider
 */
async function resolveLlmClient(user, temperature = 0.3) {
    const { preferredLlmProvider, ollamaUrl, encryptedApiKey } = user || {};
    const userApiKey = encryptedApiKey ? decrypt(encryptedApiKey) : null;
    const providerResolution = await resolveProviderByPreference({
        preferredProvider: preferredLlmProvider || 'sglang',
        userApiKey,
        userLocalLlmUrl: ollamaUrl,
    });

    const activeProvider = providerResolution.chosenProvider;
    let llmService = sglangService;
    let llmOptions = { temperature };

    if (activeProvider === 'sglang' || activeProvider === 'local_llm' || activeProvider === 'ollama') {
        llmService = sglangService;
        llmOptions = {
            model: process.env.SGLANG_MODEL || 'Qwen/Qwen2.5-7B-Instruct-AWQ',
            localLlmUrl: providerResolution.workingLocalLlmUrl,
            temperature
        };
    } else if (activeProvider === 'groq') {
        llmService = groqService;
        llmOptions = {
            model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
            apiKey: providerResolution.apiKey,
            temperature
        };
    } else {
        llmService = geminiService;
        llmOptions = {
            model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
            apiKey: providerResolution.apiKey,
            temperature
        };
    }

    return { llmService, llmOptions, activeProvider };
}

/**
 * Generates structured learning modules for a goal
 */
async function generateModulesForGoal(goal, user, context) {
    log.info('AI', `[CurriculumOrchestrator] Generating modules for goal: "${goal}"`);

    const profile = user.profile || {};
    const knowledgeGaps = profile.performanceMetrics && profile.performanceMetrics.size > 0 
        ? Array.from(profile.performanceMetrics.keys()).join(', ') 
        : "None identified yet.";

    const prompt = PLAN_GENERATION_PROMPT
        .replace('{degreeType}', profile.degreeType || 'B.Tech')
        .replace('{year}', profile.year || '3rd Year')
        .replace('{branch}', profile.branch || 'Computer Science')
        .replace('{learningStyle}', profile.learningStyle || 'Visual & Practical')
        .replace('{knowledgeGaps}', knowledgeGaps)
        .replace('{goal}', goal);

    const { llmService, llmOptions, activeProvider } = await resolveLlmClient(user, 0.4);
    log.info('AI', `[CurriculumOrchestrator] Using provider: ${activeProvider}`);

    const responseText = await llmService.generateContentWithHistory([], prompt, null, llmOptions);
    const result = safeParseJson(responseText);

    if (!result || !result.modules || !Array.isArray(result.modules) || result.modules.length === 0) {
        log.error('AI', `LLM did not return a valid module list. Response: ${responseText}`);
        throw new Error("The AI failed to generate a structured learning plan. Please try rephrasing your goal.");
    }

    // Set initial status for the modules
    result.modules[0].status = 'not_started';
    for (let i = 1; i < result.modules.length; i++) {
        result.modules[i].status = 'locked';
    }

    // Assign module IDs and default activities if missing
    return result.modules.map((m, idx) => ({
        moduleId: m.moduleId || `mod_${idx + 1}`,
        title: m.title || `Module ${idx + 1}`,
        objective: m.objective || '',
        status: m.status || (idx === 0 ? 'not_started' : 'locked'),
        activity: {
            type: m.activity?.type || 'direct_answer',
            suggestedPrompt: m.activity?.suggestedPrompt || `Explain key concepts of ${m.title}`
        }
    }));
}

/**
 * Main orchestrator function. Creates and saves a new learning path OR returns clarification questions.
 */
async function createLearningPath(userId, goal, context = {}) {
    if (!userId || !goal) {
        throw new Error("User ID and a learning goal are required.");
    }

    const user = await User.findById(userId).select(
        'profile preferredLlmProvider ollamaUrl ollamaModel +encryptedApiKey apiKeyRequestStatus'
    );

    if (!user) {
        throw new Error("User not found.");
    }

    const { llmService, llmOptions } = await resolveLlmClient(user, 0.2);

    // SCENARIO 1: The user provided clarification answers
    if (context && context.clarificationAnswers) {
        log.info('AI', `[CurriculumOrchestrator] Received clarification answers. Generating final plan.`);
        const refinedGoal = `${goal} - Specifics: ${JSON.stringify(context.clarificationAnswers)}`;
        const modules = await generateModulesForGoal(refinedGoal, user, context);

        const newLearningPath = new LearningPath({ userId, title: goal, modules });
        await newLearningPath.save();
        
        await User.updateOne({ _id: userId }, { $push: { learningPaths: newLearningPath._id } });
        log.success('AI', `Saved new learning path "${goal}" for user ${userId}`);
        return newLearningPath;
    }

    // SCENARIO 2: Analyze goal specificity
    log.info('AI', `[CurriculumOrchestrator] Analyzing goal for specificity: "${goal}"`);
    const analysisPrompt = GOAL_ANALYSIS_PROMPT.replace('{goal}', goal);
    const analysisResponseText = await llmService.generateContentWithHistory([], analysisPrompt, null, llmOptions);
    const analysisResult = safeParseJson(analysisResponseText) || { isSpecific: true };

    if (analysisResult.isSpecific === false) {
        // Goal is broad -> generate questionnaire
        log.info('AI', `[CurriculumOrchestrator] Goal is broad. Generating clarification questions.`);
        const questionsPrompt = CLARIFICATION_QUESTIONS_PROMPT.replace('{goal}', goal);
        const questionsResponseText = await llmService.generateContentWithHistory([], questionsPrompt, null, llmOptions);
        const questionsResult = safeParseJson(questionsResponseText);
        if (questionsResult && questionsResult.questions && questionsResult.questions.length > 0) {
            return { isQuestionnaire: true, ...questionsResult };
        }
    }

    // Goal is specific or fallback directly to module generation
    log.info('AI', `[CurriculumOrchestrator] Goal is specific. Generating modules directly.`);
    const modules = await generateModulesForGoal(goal, user, context);
    
    const newLearningPath = new LearningPath({ userId, title: goal, modules });
    await newLearningPath.save();
    
    await User.updateOne({ _id: userId }, { $push: { learningPaths: newLearningPath._id } });
    log.success('AI', `Saved new learning path "${goal}" for user ${userId}`);
    return newLearningPath;
}

module.exports = {
    createLearningPath,
};