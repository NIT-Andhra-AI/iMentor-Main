// server/routes/tutorRoutes.js
// Extracted from chat.js — Tutor mode & curriculum navigation endpoints
const express = require('express');
const router = express.Router();
const log = require('../utils/logger');
const { redisClient } = require('../config/redisClient');

const {
    setTutorSessionState,
    SOCRATIC_STATES,
    resolveCurrentPosition,
    advanceToNextSubtopic,
    resumeOrStartSession,
    saveUserProgress,
    loadUserProgress,
    getCurriculumStructure,
    buildInitialLearningPath,
    getPrecomputedContent
} = require('../services/socraticTutorService');

// @route   POST /api/chat/tutor/init
// @desc    Initialize tutor session state for Socratic reasoning loop
// @access  Private
router.post('/init', async (req, res) => {
    const { sessionId, moduleTitle, initialQuestion } = req.body;

    if (!sessionId || !moduleTitle || !initialQuestion) {
        return res.status(400).json({ message: 'sessionId, moduleTitle, and initialQuestion are required.' });
    }

    try {
        const tutorState = {
            moduleTitle,
            topic: moduleTitle,
            lastQuestion: initialQuestion,
            turnCount: 0,
            startedAt: new Date().toISOString(),
            socraticState: SOCRATIC_STATES.INTRODUCTION,
            cognitiveLevel: 'L1_CONCEPT',
            consecutiveWrong: 0,
            hintsGiven: 0,
            masteryScore: 0,
            userId: req.user?._id, // Attach userId for KnowledgeState integration
            learningPath: await buildInitialLearningPath('General', { subtopicName: moduleTitle })
        };

        const success = await setTutorSessionState(sessionId, tutorState);

        if (success) {
            res.status(200).json({ message: 'Tutor state initialized', sessionId });
        } else {
            log.warn('SYSTEM', 'Tutor state init failed (Redis)');
            res.status(200).json({ message: 'Tutor state initialization skipped (Redis unavailable)', sessionId });
        }
    } catch (error) {
        log.error('SYSTEM', 'Tutor state initialization error', error);
        res.status(500).json({ message: 'Failed to initialize tutor state' });
    }
});

// @route   GET /api/chat/tutor/current-position/:course
// @desc    Resolve current teaching position based on user's progress
// @access  Private
router.get('/current-position/:course', async (req, res) => {
    const userId = req.user._id;
    const { course } = req.params;

    try {
        const User = require('../models/User');
        const user = await User.findById(userId);
        const userProgress = user?.curriculumProgress?.get(course);
        const completedSubtopics = userProgress?.completedSubtopics || [];
        const completedTopics = userProgress?.completedTopics || [];

        const position = await resolveCurrentPosition(course, completedSubtopics, completedTopics);

        if (!position) {
            return res.status(404).json({
                success: false,
                message: 'Could not resolve curriculum position. Curriculum may not exist.'
            });
        }

        // Compute total curriculum counts for the progress bar on the frontend
        let totalSubtopics = 0;
        let totalTopics = 0;
        try {
            const { getCurriculumStructure } = require('../services/socraticTutorService');
            const structure = await getCurriculumStructure(course);
            if (structure?.modules) {
                structure.modules.forEach(m => {
                    totalTopics += (m.topics || []).length;
                    (m.topics || []).forEach(t => {
                        totalSubtopics += (t.subtopics || t.prerequisites || []).length;
                    });
                });
            }
        } catch (_) { /* non-critical */ }

        res.json({
            success: true,
            position,
            completedSubtopics,
            completedTopics,
            completedModules: userProgress?.completedModules || [],
            totalSubtopics,
            totalTopics
        });
    } catch (error) {
        log.error('TUTOR', 'Position resolution failed', error);
        res.status(500).json({ success: false, message: 'Failed to resolve curriculum position' });
    }
});

// @route   GET /api/chat/tutor/greeting/:course
// @desc    Get greeting message + current position + precomputed intro for tutor mode.
//          Returns a ready-to-display welcome/resume message so the UI can show it
//          instantly when the user selects a course — no chat turn needed.
// @access  Private
router.get('/greeting/:course', async (req, res) => {
    const userId = req.user._id;
    const { course } = req.params;
    try {
        const sessionData = await resumeOrStartSession(userId.toString(), course);
        res.json({ success: true, ...sessionData });
    } catch (error) {
        log.error('TUTOR', 'Greeting fetch failed', error);
        res.status(500).json({ success: false, message: 'Failed to load course greeting' });
    }
});

// @route   GET /api/chat/tutor/resume/:course
// @desc    Resume or start tutor session based on saved Redis progress
// @access  Private
router.get('/resume/:course', async (req, res) => {
    const userId = req.user._id;
    const { course } = req.params;

    try {
        const sessionData = await resumeOrStartSession(userId.toString(), course);
        res.json({ success: true, ...sessionData });
    } catch (error) {
        log.error('TUTOR', 'Session resume failed', error);
        res.status(500).json({ success: false, message: 'Failed to resume tutor session' });
    }
});

// @route   GET /api/chat/tutor/precomputed/:course/:topicId
// @desc    Fetch precomputed Socratic content for a specific topic (for frontend prefetch)
// @access  Private
router.get('/precomputed/:course/:topicId', async (req, res) => {
    const { course, topicId } = req.params;
    try {
        const content = await getPrecomputedContent(course, topicId);
        if (!content) return res.json({ success: false, cached: false });
        res.json({ success: true, cached: true, content });
    } catch (error) {
        log.error('TUTOR', 'Precomputed fetch failed', error);
        res.status(500).json({ success: false, message: 'Failed to fetch precomputed content' });
    }
});

// @route   POST /api/chat/tutor/progress/:course
// @desc    Save user's curriculum progress
// @access  Private
router.post('/progress/:course', async (req, res) => {
    const userId = req.user._id;
    const { course } = req.params;
    const { completedSubtopics, completedTopics, completedModules, currentPosition } = req.body;

    try {
        const progress = {
            completedSubtopics: completedSubtopics || [],
            completedTopics: completedTopics || [],
            completedModules: completedModules || [],
            currentPosition,
            lastActiveDate: new Date().toISOString()
        };

        const saved = await saveUserProgress(userId.toString(), course, progress);

        if (saved) {
            res.json({ success: true, message: 'Progress saved' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save progress' });
        }
    } catch (error) {
        log.error('TUTOR', 'Save progress failed', error);
        res.status(500).json({ success: false, message: 'Failed to save progress' });
    }
});

// @route   GET /api/chat/tutor/curriculum/:course
// @desc    Get full curriculum structure for a course
// @access  Private
router.get('/curriculum/:course', async (req, res) => {
    const { course } = req.params;

    try {
        const curriculum = await getCurriculumStructure(course);
        if (!curriculum) {
            return res.status(404).json({ success: false, message: 'Curriculum not found for this course' });
        }
        res.json({ success: true, curriculum });
    } catch (error) {
        log.error('TUTOR', 'Curriculum fetch failed', error);
        res.status(500).json({ success: false, message: 'Failed to fetch curriculum' });
    }
});

// @route   GET /api/chat/curriculum/structure/:course
// @desc    Node gateway endpoint for curriculum structure
// @access  Private
router.get('/curriculum/structure/:course', async (req, res) => {
    const { course } = req.params;

    try {
        const curriculum = await getCurriculumStructure(course);
        if (!curriculum) {
            return res.status(404).json({ success: false, message: 'Curriculum not found for this course' });
        }
        res.json({ success: true, curriculum });
    } catch (error) {
        log.error('TUTOR', 'Curriculum structure gateway failed', error);
        res.status(500).json({ success: false, message: 'Failed to fetch curriculum structure' });
    }
});

// @route   POST /api/chat/tutor/invalidate-cache/:course
// @desc    Invalidate Redis curriculum cache for a course
// @access  Private
router.post('/invalidate-cache/:course', async (req, res) => {
    const { course } = req.params;

    try {
        const keysToDelete = [
            `curriculum:structure:${encodeURIComponent(course)}`,
            `curriculum:courses`
        ];

        let deleted = 0;
        if (redisClient && redisClient.isOpen) {
            for (const key of keysToDelete) {
                const result = await redisClient.del(key);
                deleted += result;
            }
        }

        log.info('TUTOR', `Cache invalidated for course '${course}': ${deleted} key(s) removed`);
        res.json({ success: true, message: `Cache cleared for course "${course}"`, keysDeleted: deleted });
    } catch (error) {
        log.error('TUTOR', 'Cache invalidation failed', error);
        res.status(500).json({ success: false, message: 'Failed to invalidate cache' });
    }
});

// ─── Spaced Repetition Review Endpoints ─────────────────────────────────

// GET /api/tutor/reviews/due — Get topics due for review
router.get('/reviews/due', async (req, res) => {
    try {
        const { getDueReviewTopics } = require('../jobs/spacedRepetitionScheduler');
        const userId = req.user._id;
        const dueTopics = await getDueReviewTopics(userId);
        res.json({ success: true, dueTopics, count: dueTopics.length });
    } catch (error) {
        log.error('TUTOR', 'Failed to fetch due review topics', error);
        res.status(500).json({ success: false, message: 'Failed to fetch review topics' });
    }
});

// POST /api/tutor/reviews/complete — Mark a topic as successfully reviewed
router.post('/reviews/complete', async (req, res) => {
    try {
        const { markTopicReviewed } = require('../jobs/spacedRepetitionScheduler');
        const userId = req.user._id;
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ success: false, message: 'topic is required' });

        const result = await markTopicReviewed(userId, topic);
        res.json({ success: true, ...result });
    } catch (error) {
        log.error('TUTOR', 'Failed to mark topic reviewed', error);
        res.status(500).json({ success: false, message: 'Failed to mark topic reviewed' });
    }
});

// GET /api/chat/tutor/active-session — Restore active session progress & state
router.get('/active-session', async (req, res) => {
    try {
        const userId = req.user._id;
        const TutorSession = require('../models/TutorSession');
        const ChatHistory = require('../models/ChatHistory');

        // Find latest active tutor session for this user
        const latestSession = await TutorSession.findOne({ userId }).sort({ updatedAt: -1 }).lean();
        if (!latestSession) {
            return res.json({ success: true, active: false });
        }

        const chatHistory = await ChatHistory.findOne({ sessionId: latestSession.sessionId, userId }).lean();

        res.json({
            success: true,
            active: true,
            sessionId: latestSession.sessionId,
            topic: latestSession.topic,
            cognitiveLevel: latestSession.cognitiveLevel,
            masteryScore: latestSession.masteryScore,
            updatedAt: latestSession.updatedAt,
            messages: chatHistory?.messages || [],
            state: latestSession.state || {}
        });
    } catch (error) {
        log.error('TUTOR', 'Failed to fetch active tutor session', error);
        res.status(500).json({ success: false, message: 'Failed to fetch active tutor session' });
    }
});

// GET /api/chat/tutor/live-memory-map — Get real-time student concept memory map
router.get('/live-memory-map', async (req, res) => {
    try {
        const userId = req.user._id;
        const StudentKnowledgeState = require('../models/StudentKnowledgeState');
        const liveMemoryMapService = require('../services/liveMemoryMapService');

        const knowledgeState = await StudentKnowledgeState.findOne({ userId }).lean();
        if (!knowledgeState) {
            return res.json({
                success: true,
                liveMap: { nodes: [], links: [], summary: { totalConcepts: 0, overallMastery: 0 } }
            });
        }

        const liveMap = liveMemoryMapService.buildMemoryMapGraph(knowledgeState);
        res.json({ success: true, liveMap });
    } catch (error) {
        log.error('TUTOR', 'Failed to fetch live memory map', error);
        res.status(500).json({ success: false, message: 'Failed to fetch live memory map' });
    }
});

module.exports = router;
