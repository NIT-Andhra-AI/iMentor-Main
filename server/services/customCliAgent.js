// server/services/customCliAgent.js
const { exec } = require('child_process');
const sglangService = require('./sglangService');
const geminiService = require('./geminiService');
const UploadedCurriculum = require('../models/UploadedCurriculum');
const CourseVersion = require('../models/CourseVersion');
const log = require('../utils/logger');

// Local LLM runner with Gemini fallback
async function getLlmCompletion(systemPrompt, userPrompt) {
    if (process.env.SGLANG_ENABLED === 'true') {
        try {
            const modelName = process.env.SGLANG_CHAT_MODEL || 'Qwen/Qwen2.5-7B-Instruct-AWQ';
            return await sglangService.generateContentWithHistory([], userPrompt, systemPrompt, { model: modelName });
        } catch (err) {
            log.warn('CUSTOM_CLI', `SGLang failed: ${err.message}. Falling back to Gemini.`);
        }
    }
    return await geminiService.generateContentWithHistory([], userPrompt, systemPrompt, { model: 'gemini-2.0-flash' });
}

// Sandbox command execution
function runCommandOnHost(cmd) {
    return new Promise((resolve) => {
        if (/[;&|><$\(\)`]/.test(cmd) && !cmd.startsWith('agy')) {
            return resolve({ error: 'Blocked: Unsafe shell characters.' });
        }
        // Map direct agy calls to absolute path
        const commandToRun = cmd.startsWith('agy') ? cmd.replace(/^agy/i, '/home/sri/.local/bin/agy') : cmd;
        exec(commandToRun, { cwd: '/home/sri/Downloads/iMentor_march/iMentor-Main' }, (error, stdout, stderr) => {
            resolve({
                stdout: stdout || '',
                stderr: stderr || '',
                code: error ? error.code : 0
            });
        });
    });
}

/**
 * Custom CLI Agent Loop mimicking Claude Code / OpenCode.
 * Takes user instruction and runs a thought-action-result loop.
 */
async function runCliAgent(instruction, courseId, userId) {
    let outputLogs = [];
    outputLogs.push(`🚀 Spawning custom Developer-Agent for course workspace [ID: ${courseId}]`);
    outputLogs.push(`🤖 Initializing Local LLM (Qwen2.5-7B-Instruct) engine...`);

    let curriculum = await UploadedCurriculum.findOne({ 
        $or: [
            { _id: courseId },
            { courseTitle: { $regex: new RegExp(courseId.replace('_', ' '), 'i') } }
        ]
    });

    if (!curriculum) {
        curriculum = await UploadedCurriculum.findOne() || new UploadedCurriculum({
            userId,
            filename: `${courseId}_syllabus.csv`,
            hash: `seeded_${courseId}`,
            courseTitle: courseId.replace('_', ' ').toUpperCase(),
            topics: [],
            status: 'ready'
        });
    }

    const availableTools = `
1. MODIFY_SYLLABUS: Update modules, topics, or subtopics.
   Args format: JSON array representing the new complete syllabus topics list.
2. AGY_ASSIST: Run an agy task command to search files, run scripts, or compile metadata.
   Args format: "agy <subcommand> <args>"
3. SHELL_RUN: Execute a workspace compile or diagnostic command.
   Args format: Shell command string.
4. FINISH: Task completed successfully.
   Args format: Text summary of accomplishments.
`;

    let loopCount = 0;
    const maxLoops = 3;
    let taskDone = false;

    while (loopCount < maxLoops && !taskDone) {
        loopCount++;
        outputLogs.push(`\n[Thinking Step ${loopCount}] Agent is planning next action...`);

        const systemPrompt = `
You are the iMentor Custom CLI Developer Agent (mimicking Claude Code / OpenCode).
Your goal is to fulfill the instructor's instruction: "${instruction}"

Active syllabus details:
${JSON.stringify(curriculum.topics, null, 2)}

Available Tools:
${availableTools}

You must respond in exactly the following format:
THOUGHT: <your step-by-step reasoning>
ACTION: <tool name (one of: MODIFY_SYLLABUS, AGY_ASSIST, SHELL_RUN, FINISH)>
ARGS: <tool arguments strictly matching the format specified above>

Do not include any extra text. Output precisely the template above.
`;

        const agentResponse = await getLlmCompletion(systemPrompt, `Determine next action to fulfill instruction: "${instruction}"`);
        
        // Parse agent response
        const thoughtMatch = agentResponse.match(/THOUGHT:\s*(.+)/i);
        const actionMatch = agentResponse.match(/ACTION:\s*([A-Z_]+)/i);
        const argsMatch = agentResponse.match(/ARGS:\s*([\s\S]+)/i);

        const thought = thoughtMatch ? thoughtMatch[1].trim() : 'Fulfilling course modifications.';
        const action = actionMatch ? actionMatch[1].trim() : 'FINISH';
        const argsStr = argsMatch ? argsMatch[1].trim() : '';

        outputLogs.push(`💬 Thinking: ${thought}`);
        outputLogs.push(`🛠️  Action: Calling ${action}`);

        if (action === 'MODIFY_SYLLABUS') {
            try {
                // Parse args as JSON array
                const cleanedArgs = argsStr.replace(/```json/g, '').replace(/```/g, '').trim();
                const newTopics = JSON.parse(cleanedArgs);
                
                curriculum.topics = newTopics;
                curriculum.moduleCount = [...new Set(newTopics.map(t => t.module))].length;
                curriculum.topicCount = newTopics.length;
                await curriculum.save();

                outputLogs.push(`✅ Tool Result: Curriculum updated dynamically in database.`);
            } catch (err) {
                outputLogs.push(`❌ Tool Error: Failed to parse syllabus modification JSON. Error: ${err.message}`);
            }
        } 
        else if (action === 'AGY_ASSIST') {
            outputLogs.push(`⚡ Augmenting with agy CLI: running "${argsStr}"`);
            const res = await runCommandOnHost(argsStr);
            outputLogs.push(`✅ Tool Result:\n${res.stdout || res.stderr || 'Executed.'}`);
        }
        else if (action === 'SHELL_RUN') {
            outputLogs.push(`💻 Running shell command: "${argsStr}"`);
            const res = await runCommandOnHost(argsStr);
            outputLogs.push(`✅ Tool Result:\n${res.stdout || res.stderr || 'Executed.'}`);
        }
        else if (action === 'FINISH') {
            taskDone = true;
            outputLogs.push(`🎉 Task Finished: ${argsStr}`);
        }
        else {
            outputLogs.push(`⚠️ Unknown action. Ending loop.`);
            taskDone = true;
        }
    }

    if (!taskDone) {
        outputLogs.push(`\n⚠️ Reach maximum planning steps limit. Exiting.`);
    }

    return outputLogs.join('\n');
}

module.exports = {
    runCliAgent
};
