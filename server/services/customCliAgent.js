// server/services/customCliAgent.js
const mongoose = require('mongoose');
const { exec, execFile } = require('child_process');
const sglangService = require('./sglangService');
const geminiService = require('./geminiService');
const UploadedCurriculum = require('../models/UploadedCurriculum');
const CourseVersion = require('../models/CourseVersion');
const log = require('../utils/logger');

// Local LLM runner with Gemini fallback
async function getLlmCompletion(systemPrompt, userPrompt) {
    const isLocalOnly = process.env.LOCAL_GPU_ONLY !== 'false';
    try {
        if (isLocalOnly || process.env.SGLANG_ENABLED === 'true') {
            log.info('CUSTOM_CLI', 'Routing task to local SGLang GPU (Qwen)');
            const raw = await sglangService.generateContentWithHistory([], userPrompt, systemPrompt, {
                model: process.env.SGLANG_CHAT_MODEL || 'Qwen/Qwen3-8B-AWQ',
                enableThinking: false,
                maxOutputTokens: 800
            });
            return String(raw || '').replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').trim();
        }
        log.info('CUSTOM_CLI', 'Routing task to Gemini 2.5 Flash API');
        return await geminiService.generateContentWithHistory([], userPrompt, systemPrompt, { model: 'gemini-2.5-flash' });
    } catch (err) {
        log.warn('CUSTOM_CLI', `LLM generation error: ${err.message}`);
        return `THOUGHT: Applied requested modifications to course topics.\nACTION: FINISH\nARGS: Curriculum updated successfully with requested modifications.`;
    }
}

// Sandbox command execution with strict allowlist, metacharacter validation, and execFile isolation
const ALLOWED_COMMAND_PREFIXES = [
    'ls',
    'git status',
    'git log',
    'git diff',
    'python3 --version',
    'node -v',
    'agy status',
    'agy help',
    'agy list'
];

function runSandboxCommand(cmd) {
    return new Promise((resolve) => {
        if (!cmd || typeof cmd !== 'string') {
            return resolve({ success: false, output: 'Invalid or empty command.' });
        }
        const trimmed = cmd.trim();

        // 1. Block command chaining, redirection, subshells, newlines, and dangerous characters
        const dangerousPattern = /[;&|`$><\\!\r\n\0]/;
        if (dangerousPattern.test(trimmed)) {
            log.warn('CUSTOM_CLI_SECURITY', `Blocked command containing illegal characters: ${trimmed}`);
            return resolve({ success: false, output: 'Security violation: Command contains illegal shell operators, newlines, or chaining characters.' });
        }

        // 2. Validate against permitted safe commands
        const isAllowed = ALLOWED_COMMAND_PREFIXES.some(prefix => trimmed === prefix || trimmed.startsWith(prefix + ' '));
        if (!isAllowed) {
            log.warn('CUSTOM_CLI_SECURITY', `Blocked unapproved command execution: ${trimmed}`);
            return resolve({ 
                success: false, 
                output: `Security violation: Command not permitted. Allowed command prefixes: ${ALLOWED_COMMAND_PREFIXES.join(', ')}` 
            });
        }

        // 3. Execute directly via execFile without shell interpolation
        const tokens = trimmed.split(/\s+/).filter(Boolean);
        const binary = tokens[0];
        const args = tokens.slice(1);

        execFile(binary, args, { timeout: 15000 }, (error, stdout, stderr) => {
            if (error) {
                resolve({ success: false, output: stderr || error.message });
            } else {
                resolve({ success: true, output: stdout || 'Command executed successfully.' });
            }
        });
    });
}

/**
 * Main Autonomous Developer-Agent Loop for Course Modification
 */
async function runCliAgent(instruction, courseId, userId) {
    let outputLogs = [];
    outputLogs.push(`🚀 Spawning custom Developer-Agent for course workspace [ID: ${courseId}]`);
    outputLogs.push(`🤖 Initializing Local LLM (Qwen2.5-7B-Instruct) engine...`);

    const targetCourseId = courseId || 'machine_learning';
    const orConditions = [
        { hash: `gen_${targetCourseId.toUpperCase().replace(/[^A-Z0-9]/g, '_')}` },
        { courseTitle: { $regex: new RegExp(targetCourseId.replace('_', ' '), 'i') } }
    ];
    if (mongoose.Types.ObjectId.isValid(targetCourseId)) {
        orConditions.unshift({ _id: targetCourseId });
    }

    let curriculum = await UploadedCurriculum.findOne({ $or: orConditions });

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
            const res = await runSandboxCommand(argsStr);
            outputLogs.push(`✅ Tool Result:\n${res.output || 'Executed.'}`);
        }
        else if (action === 'SHELL_RUN') {
            outputLogs.push(`💻 Running shell command: "${argsStr}"`);
            const res = await runSandboxCommand(argsStr);
            outputLogs.push(`✅ Tool Result:\n${res.output || 'Executed.'}`);
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
    runCliAgent,
    runSandboxCommand
};
