// server/routes/faculty.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ChatHistory = require('../models/ChatHistory');
const KnowledgeSource = require('../models/KnowledgeSource');
const Job = require('../models/Job');
const { authMiddleware } = require('../middleware/authMiddleware');
const log = require('../utils/logger');
const axios = require('axios');

// Middleware to verify user is a Faculty or Admin
const facultyMiddleware = (req, res, next) => {
    if (!req.user.isFaculty && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Access Denied: Faculty privileges required.' });
    }
    next();
};

// ─── 1. Get Students Pertaining to Faculty Department ────────────────────
// GET /api/faculty/students
router.get('/students', authMiddleware, facultyMiddleware, async (req, res) => {
    try {
        const dept = req.user.department;
        let query = { isFaculty: false, isAdmin: false };
        
        // Scope to department if set
        if (dept && dept.trim() !== '') {
            query['profile.branch'] = { $regex: new RegExp(dept.trim(), 'i') };
        }

        const students = await User.find(query)
            .select('username email profile createdAt hasCompletedOnboarding')
            .sort({ createdAt: -1 })
            .lean();

        res.json(students);
    } catch (error) {
        log.error('FACULTY', `Get students error: ${error.message}`);
        res.status(500).json({ message: 'Failed to retrieve students list.' });
    }
});

// ─── 2. Get Single Student Mindmap & Mastery Progress ────────────────────
// GET /api/faculty/students/:studentId/progress
router.get('/students/:studentId/progress', authMiddleware, facultyMiddleware, async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await User.findById(studentId)
            .select('username email profile curriculumProgress')
            .lean();

        if (!student) {
            return res.status(404).json({ message: 'Student not found.' });
        }

        // Return student details, quiz progress, and conceptual mastery
        res.json({
            studentId: student._id,
            username: student.username,
            email: student.email,
            profile: student.profile,
            conceptMastery: student.profile?.conceptMastery || {},
            quizScores: student.profile?.quizScores || [],
            curriculumProgress: student.curriculumProgress || {}
        });
    } catch (error) {
        log.error('FACULTY', `Get student progress error: ${error.message}`);
        res.status(500).json({ message: 'Failed to retrieve student progress details.' });
    }
});

// ─── 3. Get Student Chat History sessions ────────────────────────────────
// GET /api/faculty/students/:studentId/chats
router.get('/students/:studentId/chats', authMiddleware, facultyMiddleware, async (req, res) => {
    try {
        const { studentId } = req.params;
        const chats = await ChatHistory.find({ userId: studentId })
            .select('sessionId summary isTutorMode tutorModeType courseName createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .lean();

        res.json(chats);
    } catch (error) {
        log.error('FACULTY', `Get student chats error: ${error.message}`);
        res.status(500).json({ message: 'Failed to retrieve student chat history sessions.' });
    }
});

// ─── 4. Get Student Chat Detail Messages ─────────────────────────────────
// GET /api/faculty/students/:studentId/chats/:sessionId
router.get('/students/:studentId/chats/:sessionId', authMiddleware, facultyMiddleware, async (req, res) => {
    try {
        const { studentId, sessionId } = req.params;
        const chat = await ChatHistory.findOne({ userId: studentId, sessionId }).lean();

        if (!chat) {
            return res.status(404).json({ message: 'Chat session not found.' });
        }

        res.json(chat);
    } catch (error) {
        log.error('FACULTY', `Get student chat details error: ${error.message}`);
        res.status(500).json({ message: 'Failed to retrieve chat session messages.' });
    }
});

// ─── 5. Fetch Reference Material from Web (via Python Scraping Engine) ────
// POST /api/faculty/materials/fetch-web
router.post('/materials/fetch-web', authMiddleware, facultyMiddleware, async (req, res) => {
    const { url, title } = req.body;
    const userId = req.user._id;

    if (!url) {
        return res.status(400).json({ message: 'Web reference URL is required.' });
    }

    try {
        // Prevent duplicate URLs for this faculty/course
        const existingSource = await KnowledgeSource.findOne({ userId, sourceUrl: url });
        if (existingSource) {
            return res.status(409).json({ 
                message: `This reference has already been added: "${existingSource.title}"`,
                source: existingSource
            });
        }

        // Initialize KnowledgeSource record
        const newSource = new KnowledgeSource({
            userId,
            sourceType: 'webpage',
            title: title || url,
            sourceUrl: url,
            status: 'processing_extraction',
        });
        await newSource.save();

        const newJob = new Job({
            userId,
            jobType: 'knowledge_source',
            status: 'queued',
            sourceId: newSource._id
        });
        await newJob.save();

        res.status(202).json({
            message: "Agent scraping reference material in background...",
            jobId: newJob._id.toString()
        });

        // Trigger background processing asynchronously
        newJob.status = 'processing';
        await newJob.save();

        setImmediate(async () => {
            try {
                const pythonServiceUrl = process.env.PYTHON_RAG_SERVICE_URL;
                if (!pythonServiceUrl) throw new Error("Python service URL not configured.");

                // 1. Process URL content
                const extractionResponse = await axios.post(`${pythonServiceUrl}/process_url`, {
                    url: url,
                    user_id: userId.toString(),
                }, { timeout: 300000 });

                const { text_content, title: extractedTitle, source_type } = extractionResponse.data;
                if (!text_content) throw new Error("No readable content could be extracted.");

                // 2. Add embeddings to Qdrant
                const addDocResponse = await axios.post(`${pythonServiceUrl}/add_document`, {
                    user_id: userId.toString(),
                    file_path: '',
                    original_name: extractedTitle || title || url,
                    text_content_override: text_content
                }, { timeout: 300000 });

                const numChunks = addDocResponse.data?.num_chunks_added_to_qdrant ?? 0;

                // 3. Mark completed
                await KnowledgeSource.updateOne({ _id: newSource._id }, {
                    $set: {
                        textContent: text_content,
                        title: extractedTitle || title || url,
                        sourceType: source_type,
                        status: 'completed',
                        kgStatus: 'skipped_no_chunks'
                    }
                });

                await Job.updateOne({ _id: newJob._id }, { $set: { status: 'completed' } });
                log.success('FACULTY', `[Fetch Reference] Web reference indexed successfully: ${extractedTitle}`);

            } catch (bgErr) {
                log.error('FACULTY', `[Fetch Reference] Failed in background: ${bgErr.message}`);
                await KnowledgeSource.updateOne({ _id: newSource._id }, { $set: { status: 'failed', failureReason: bgErr.message } });
                await Job.updateOne({ _id: newJob._id }, { $set: { status: 'failed', error: bgErr.message } });
            }
        });

// Import CourseVersion model
const CourseVersion = require('../models/CourseVersion');
const UploadedCurriculum = require('../models/UploadedCurriculum');
const { generateContentWithHistory } = require('../services/geminiService');

// ─── 6. Interactive CLI Terminal for Course Management ─────────────────
// POST /api/faculty/course/cli
router.post('/course/cli', authMiddleware, facultyMiddleware, async (req, res) => {
    const { command, courseId } = req.body;
    const userId = req.user._id;

    if (!command || command.trim() === '') {
        return res.status(400).json({ output: 'Error: Empty command received.' });
    }

    const trimmedCmd = command.trim();
    const targetCourseId = courseId || 'machine_learning'; // Fallback course slug

    try {
        // Fetch or initialize active curriculum record in UploadedCurriculum
        let curriculum = await UploadedCurriculum.findOne({ 
            $or: [
                { _id: targetCourseId },
                { courseTitle: { $regex: new RegExp(targetCourseId.replace('_', ' '), 'i') } }
            ]
        });

        // Fallback: search for any available curriculum if not found
        if (!curriculum) {
            curriculum = await UploadedCurriculum.findOne();
        }

        if (!curriculum) {
            // Seed a default curriculum if database is completely empty
            curriculum = new UploadedCurriculum({
                userId,
                filename: `${targetCourseId}_syllabus.csv`,
                hash: `seeded_${targetCourseId}`,
                courseTitle: targetCourseId.replace('_', ' ').toUpperCase(),
                topics: [
                    { module: 'Module 1: Introduction', topic: 'ML Basics', subtopic: 'Supervised vs Unsupervised', difficulty: 'easy', credits: '1' },
                    { module: 'Module 1: Introduction', topic: 'Performance Metrics', subtopic: 'Precision and Recall', difficulty: 'medium', credits: '1' }
                ],
                moduleCount: 1,
                topicCount: 2,
                status: 'ready'
            });
            await curriculum.save();
        }

        // --- COMMAND PARSING ---
        // A. HELP COMMAND
        if (/^(help|\?|\/help)$/i.test(trimmedCmd)) {
            const helpText = `
=== iMentor Faculty CLI (Interactive Swarm Host) ===
Available commands:
  help / ?               - Display this help message.
  list                   - List current modules, topics, and subtopics.
  history                - Show git-style commit version history.
  commit <message>       - Save changes as a new stable version.
  revert <version>       - Rollback to a specific version number.
  
  [AI Swarm Prompts]
  Simply type any instruction to modify the syllabus:
  e.g., "Add Module 2: Deep Learning basics"
  e.g., "Modify topic ML Basics to include SVG animations"
`;
            return res.json({ output: helpText });
        }

        // B. LIST CURRICULUM
        if (/^(list|\/list)$/i.test(trimmedCmd)) {
            let outputText = `=== Course: ${curriculum.courseTitle} ===\n`;
            if (!curriculum.topics || curriculum.topics.length === 0) {
                outputText += `Syllabus is empty.\n`;
            } else {
                let currentModule = '';
                curriculum.topics.forEach((t) => {
                    if (t.module !== currentModule) {
                        currentModule = t.module;
                        outputText += `\n📦 ${currentModule}\n`;
                    }
                    outputText += `  ├─ Topic: ${t.topic}\n  │  └─ Subtopic: ${t.subtopic} (${t.difficulty || 'standard'})\n`;
                });
            }
            return res.json({ output: outputText });
        }

        // C. HISTORY (COMMITS)
        if (/^(history|\/history)$/i.test(trimmedCmd)) {
            const versions = await CourseVersion.find({ courseId: targetCourseId })
                .sort({ versionNumber: -1 })
                .lean();

            if (versions.length === 0) {
                return res.json({ output: 'No commit history found for this course.' });
            }

            let outputText = `=== Version Commit History: ${curriculum.courseTitle} ===\n`;
            versions.forEach((v) => {
                outputText += `v${v.versionNumber} | Commit Msg: "${v.commitMessage}" | By: ${v.createdAt.toLocaleDateString()} ${v.createdAt.toLocaleTimeString()}\n`;
            });
            return res.json({ output: outputText });
        }

        // D. COMMIT VERSION
        const commitMatch = trimmedCmd.match(/^(commit|\/commit)\s+(.+)$/i);
        if (commitMatch) {
            const message = commitMatch[2].trim();
            
            // Get last version number
            const lastVer = await CourseVersion.findOne({ courseId: targetCourseId })
                .sort({ versionNumber: -1 })
                .lean();
            const nextVerNum = lastVer ? lastVer.versionNumber + 1 : 1;

            const newVer = new CourseVersion({
                courseId: targetCourseId,
                versionNumber: nextVerNum,
                topics: curriculum.topics,
                commitMessage: message,
                createdBy: userId
            });
            await newVer.save();

            return res.json({ 
                output: `Success: Committed v${nextVerNum} ("${message}") containing ${curriculum.topics.length} items.`
            });
        }

        // E. REVERT TO VERSION
        const revertMatch = trimmedCmd.match(/^(revert|\/revert)\s+(\d+)$/i);
        if (revertMatch) {
            const verNum = parseInt(revertMatch[2], 10);
            const targetVer = await CourseVersion.findOne({ courseId: targetCourseId, versionNumber: verNum }).lean();

            if (!targetVer) {
                return res.status(404).json({ output: `Error: Version ${verNum} not found in commit history.` });
            }

            // Apply revert to the active curriculum
            curriculum.topics = targetVer.topics;
            curriculum.moduleCount = [...new Set(targetVer.topics.map(t => t.module))].length;
            curriculum.topicCount = targetVer.topics.length;
            await curriculum.save();

            return res.json({
                output: `Success: Reverted ${curriculum.courseTitle} to v${verNum} ("${targetVer.commitMessage}").`
            });
        }

        // F. AGENT COMPILER / AI PROMPT INTERPRETATION
        // Prompt is treated as an instruction to update the syllabus
        const systemPrompt = `
You are the Faculty Course Architect Agent. Your task is to modify the course syllabus according to the instructor's instructions.
You must output a valid JSON array of topics matching the existing scheme, representing the updated syllabus structure.

Existing syllabus structure:
${JSON.stringify(curriculum.topics, null, 2)}

Instructions:
"${trimmedCmd}"

JSON Schema details:
An array of objects containing keys:
- "module": Module name (e.g. "Module 2: Machine Learning")
- "topic": Topic name
- "subtopic": Subtopic detail (e.g. "Linear Regression with animated graphs")
- "difficulty": "easy", "medium", or "hard"
- "credits": number of credits (e.g. "1" or "2")

Output MUST be valid JSON only. Do not include markdown code block formatting or explanations. Output only the JSON.
`;

        const geminiResult = await generateContentWithHistory(
            [],
            "Analyze and modify the syllabus structure according to the faculty instruction.",
            systemPrompt,
            { model: 'gemini-2.0-flash' }
        );

        // Parse JSON output from Gemini
        let updatedTopics;
        try {
            const cleanedText = geminiResult.replace(/```json/g, '').replace(/```/g, '').trim();
            updatedTopics = JSON.parse(cleanedText);
        } catch (parseErr) {
            log.error('FACULTY', `Failed to parse AI syllabus modification JSON: ${parseErr.message}. Output was: ${geminiResult}`);
            return res.json({
                output: `Agent Swarm was unable to process changes. Gemini Response:\n${geminiResult}`
            });
        }

        // Save new layout as draft/active curriculum in UploadedCurriculum
        curriculum.topics = updatedTopics;
        curriculum.moduleCount = [...new Set(updatedTopics.map(t => t.module))].length;
        curriculum.topicCount = updatedTopics.length;
        await curriculum.save();

        let outputText = `=== Agent Swarm: Syllabus Modified (Uncommitted Draft) ===\n`;
        let currentModule = '';
        updatedTopics.forEach((t) => {
            if (t.module !== currentModule) {
                currentModule = t.module;
                outputText += `\n📦 ${currentModule}\n`;
            }
            outputText += `  ├─ Topic: ${t.topic}\n  │  └─ Subtopic: ${t.subtopic} (${t.difficulty || 'standard'})\n`;
        });
        outputText += `\n👉 Type 'commit <message>' to save this draft as a stable version, or 'revert' to restore a previous commit.`;

        return res.json({ output: outputText });

    } catch (error) {
        log.error('FACULTY', `CLI command execution error: ${error.message}`);
        res.status(500).json({ output: `Internal Error processing command: ${error.message}` });
    }
});

module.exports = router;

