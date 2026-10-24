// server/routes/gamification.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/authMiddleware');
const gamificationService = require('../services/gamificationService');
const skillTreeService = require('../services/skillTreeService');
const streakService = require('../services/streakService');
const energyService = require('../services/energyService');
const badgeService = require('../services/badgeService');
const BossBattle = require('../models/BossBattle');
const ConceptContribution = require('../models/ConceptContribution');
const SkillTreeGame = require('../models/SkillTreeGame');
const SkillTree = require('../models/SkillTree');
const { selectLLM } = require('../services/llmRouterService');
const geminiService = require('../services/geminiService');
const { getCurriculumStructure } = require('../services/socraticTutorService');
const conceptQuestionRepository = require('../services/conceptQuestionRepository');
const skillTreeGameService = require('../services/skillTreeGameService');
const activeQuestionValidatorService = require('../services/activeQuestionValidatorService');
const log = require('../utils/logger');

// All routes require authentication
router.use(authMiddleware);

// ===== User Profile & Stats =====

// @route   GET /api/gamification/profile
// @desc    Get user's complete gamification profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user._id;

        const [statsRes, skillTreeRes, streakRes] = await Promise.allSettled([
            gamificationService.getUserStats(userId),
            skillTreeService.getSkillTreeStats(userId),
            streakService.getStreakStats(userId)
        ]);

        const stats = statsRes.status === 'fulfilled' ? statsRes.value : {};
        const skillTreeStats = skillTreeRes.status === 'fulfilled' ? skillTreeRes.value : null;
        const streakStats = streakRes.status === 'fulfilled' ? streakRes.value : null;

        res.json({
            ...stats,
            skillTree: skillTreeStats,
            streak: streakStats
        });

    } catch (error) {
        log.error('SYSTEM', `Gamification profile fetch error: ${error.message}`);
        res.status(500).json({ message: 'Error fetching gamification profile' });
    }
});

//===== Skill Tree =====

// @route   GET /api/gamification/skill-tree
// @desc    Get user's skill tree state (for fog-of-war visualization)
router.get('/skill-tree', async (req, res) => {
    try {
        const course = req.query.course || 'EE3621';
        const skillTree = await skillTreeService.getUserSkillTree(req.user._id, course);
        res.json({ skillTree });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching skill tree', error);
        res.status(500).json({ message: 'Error fetching skill tree' });
    }
});

// @route   GET /api/gamification/skill/:skillId/assessment
// @desc    Get assessment questions for a skill
router.get('/skill/:skillId/assessment', async (req, res) => {
    try {
        const questions = await skillTreeService.getSkillAssessment(
            req.user._id,
            req.params.skillId
        );

        if (!questions) {
            return res.status(403).json({ message: 'Skill is locked or not found' });
        }

        // Always serve fresh unseen sanitized questions on each attempt/retry
        const { gameId, levelId, levelName } = req.query;
        if (gameId && questions.length > 0) {
            try {
                const game = await SkillTreeGame.findOne({ _id: gameId, userId: req.user._id });
                if (game) {
                    const idx = typeof levelId !== 'undefined'
                        ? game.levels.findIndex(l => String(l.id) === String(levelId))
                        : game.levels.findIndex(l => l.name === levelName);

                    if (idx !== -1) {
                        game.levels[idx].questions = questions;
                        await game.save();
                    }
                }
            } catch (saveErr) {
                log.warn('SYSTEM', `Failed to persist generated questions: ${saveErr.message}`);
            }
        }

        res.json({ questions });

    } catch (error) {
        log.error('SYSTEM', `Assessment fetch error: ${error.message}`);
        res.status(500).json({ message: 'Error fetching assessment' });
    }
});

// @route   POST /api/gamification/skill/:skillId/assessment
// @desc    Submit assessment answers
router.post('/skill/:skillId/assessment', async (req, res) => {
    try {
        const { answers } = req.body;

        if (!Array.isArray(answers)) {
            return res.status(400).json({ message: 'Answers must be an array' });
        }

        const result = await skillTreeService.submitSkillAssessment(
            req.user._id,
            req.params.skillId,
            answers
        );

        res.json(result);

    } catch (error) {
        log.error('SYSTEM', 'Error submitting assessment', error);
        res.status(500).json({ message: 'Error submitting assessment' });
    }
});

// @route   POST /api/gamification/skill-tree/check-topic
// @desc    Check if a topic is already active or was previously played
router.post('/skill-tree/check-topic', async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic || !topic.trim()) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        const userId = req.user._id;
        const normalizedTopic = topic.trim();

        // Check if there's an active game with this topic (case-insensitive)
        const activeGame = await SkillTreeGame.findOne({
            userId,
            topic: { $regex: new RegExp(`^${normalizedTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (activeGame) {
            return res.json({
                status: 'active',
                message: 'This game is already present',
                gameId: activeGame._id.toString()
            });
        }

        // Check if this topic was previously played and deleted with >5 levels completed
        const GamificationProfile = require('../models/GamificationProfile');
        const profile = await GamificationProfile.findOne({ userId });

        if (profile && profile.deletedGames && profile.deletedGames.length > 0) {
            const topicGames = profile.deletedGames.filter(
                g => g.topic && g.topic.toLowerCase() === normalizedTopic.toLowerCase()
            );
            const previousGame = topicGames.reduce((best, current) => {
                if (!best) return current;
                return (current.completedLevels || 0) > (best.completedLevels || 0) ? current : best;
            }, null);

            if (previousGame && (previousGame.completedLevels || 0) > 5) {
                return res.json({
                    status: 'replay',
                    message: 'You already played this game, if you want to play again then use credits',
                    completedLevels: previousGame.completedLevels,
                    totalCredits: profile.totalLearningCredits || 0,
                    replayCost: 100
                });
            }
        }

        // Topic is fresh — no issues
        res.json({ status: 'ok' });

    } catch (error) {
        log.error('SYSTEM', `Check topic error: ${error.message}`);
        res.status(500).json({ message: 'Error checking topic' });
    }
});

// @route   POST /api/gamification/skill-tree/spend-credits
// @desc    Deduct credits for replaying a previously completed topic
router.post('/skill-tree/spend-credits', async (req, res) => {
    try {
        const { topic, amount } = req.body;
        if (!topic || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Topic and valid amount are required' });
        }

        const userId = req.user._id;
        const GamificationProfile = require('../models/GamificationProfile');
        const profile = await GamificationProfile.findOne({ userId });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        if ((profile.totalLearningCredits || 0) < amount) {
            return res.status(400).json({ message: 'Not enough credits', totalCredits: profile.totalLearningCredits || 0 });
        }

        // Deduct credits
        profile.totalLearningCredits = (profile.totalLearningCredits || 0) - amount;
        profile.learningCreditsHistory.push({
            amount: -amount,
            reason: 'spent',
            topic: topic.trim(),
            timestamp: new Date()
        });

        // Find the saved game data for this topic and restore it
        const normalizedTopic = topic.trim().toLowerCase();
        const deletedEntry = (profile.deletedGames || []).find(
            g => g.topic && g.topic.toLowerCase() === normalizedTopic
        );

        let restoredGameId = null;

        if (deletedEntry && deletedEntry.savedGameData && deletedEntry.savedGameData.levels) {
            // Restore the game from the saved snapshot
            const restoredGame = new SkillTreeGame({
                userId,
                topic: deletedEntry.topic,
                assessmentResult: deletedEntry.savedGameData.assessmentResult || {},
                levels: deletedEntry.savedGameData.levels || []
            });
            await restoredGame.save();
            restoredGameId = restoredGame._id;
            log.success('SYSTEM', `Restored game "${deletedEntry.topic}" for user ${userId}`);
        }

        await profile.save();

        res.json({
            success: true,
            totalCredits: profile.totalLearningCredits,
            restoredGameId
        });

    } catch (error) {
        log.error('SYSTEM', `Spend credits error: ${error.message}`);
        res.status(500).json({ message: 'Error spending credits' });
    }
});

// @route   POST /api/gamification/skill-tree/diagnostic
// @desc    Generate Socratic diagnostic questions for a topic
function resolveCourseCode(topicStr) {
    if (!topicStr) return '';
    const str = String(topicStr).toLowerCase().trim();
    if (str.includes('signal') || str.includes('dsp') || str.includes('ee3621')) return 'EE3621';
    if (str.includes('data structure') || str.includes('cs2101') || str.includes('structures and applications')) return 'CS2101';
    if (str.includes('control system') || str.includes('ee3601') || str.includes('ee2061')) return 'EE3601';
    return String(topicStr).trim();
}

router.post('/skill-tree/diagnostic', async (req, res) => {
    try {
        const { topic } = req.body;

        if (!topic || !topic.trim()) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        const topicStr = String(topic).trim();
        const courseCode = resolveCourseCode(topicStr);

        // 1. Try to find pre-computed skills for this course/topic
        let skills = await SkillTree.find({ 
            $or: [
                { course: { $regex: new RegExp(`^${courseCode}$`, 'i') } },
                { courseCode: { $regex: new RegExp(`^${courseCode}$`, 'i') } },
                { course: { $regex: new RegExp(topicStr, 'i') } },
                { category: { $regex: new RegExp(topicStr, 'i') } }
            ],
            isActive: { $ne: false },
            'assessmentQuestions.0': { $exists: true }
        }).lean();

        // 2. If no skills found for this specific subject, fall back to LLM (legacy path)
        if (!skills || skills.length === 0) {
            log.info('GAMIFICATION', `No pre-computed skills found for "${topic}", falling back to LLM generation`);
            return generateDiagnosticWithLLM(topic, req, res);
        }

        // 3. Selection Strategy: 2 Beginners, 2 Intermediate, 1 Advanced
        const beginnerSkills = skills.filter(s => s.difficulty === 'beginner');
        const intermediateSkills = skills.filter(s => s.difficulty === 'intermediate');
        const advancedSkills = skills.filter(s => s.difficulty === 'advanced' || s.difficulty === 'expert');

        const selectedSkills = [];
        
        // Helper to pick random items
        const pickRandom = (arr, num) => {
            const shuffled = [...arr].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, num);
        };

        selectedSkills.push(...pickRandom(beginnerSkills, 2));
        selectedSkills.push(...pickRandom(intermediateSkills, 2));
        selectedSkills.push(...pickRandom(advancedSkills, 1));

        // Fill up to 5 if any category is empty
        if (selectedSkills.length < 5) {
            const remainingNeeded = 5 - selectedSkills.length;
            const notSelected = skills.filter(s => !selectedSkills.find(ss => ss.skillId === s.skillId));
            selectedSkills.push(...pickRandom(notSelected, remainingNeeded));
        }

        // 4. Extract one unseen random question from each selected skill, shuffle options, vault answers server-side
        const {
            shuffleQuestionOptions,
            sanitizeQuestionsForClient,
            storeActiveAssessmentAttempt
        } = activeQuestionValidatorService;

        const fullDiagnosticQuestions = selectedSkills.map(skill => {
            const q = skill.assessmentQuestions[Math.floor(Math.random() * skill.assessmentQuestions.length)];
            const shuffled = shuffleQuestionOptions({
                ...q,
                subtopic: skill.name,
                courseOutcome: 'CO1'
            });
            return {
                ...shuffled,
                level: q.difficulty || skill.difficulty || 'beginner',
                skillId: skill.skillId,
                type: 'mcq'
            };
        });

        await storeActiveAssessmentAttempt({
            userId: req.user._id,
            assessmentKey: `diagnostic_${courseCode || topicStr}`,
            questions: fullDiagnosticQuestions
        });

        const questions = sanitizeQuestionsForClient(fullDiagnosticQuestions).map((sq, idx) => ({
            ...sq,
            level: fullDiagnosticQuestions[idx].level,
            skillId: fullDiagnosticQuestions[idx].skillId,
            type: 'mcq'
        }));

        log.success('GAMIFICATION', `Served ${questions.length} pre-computed sanitized diagnostic questions for "${topic}" (<20ms)`);
        res.json({ questions });

    } catch (error) {
        log.error('SYSTEM', `Diagnostic serve error: ${error.message}`);
        res.status(500).json({ message: 'Error fetching diagnostic questions' });
    }
});

async function generateDiagnosticWithLLM(topic, req, res) {
    try {
        // 1. Check repository first
        try {
            const conceptQuestionRepository = require('../services/questionReuseService');
            const repoQuestions = await conceptQuestionRepository.getReusableQuestionsByConcept({
                concept_id: topic,
                question_text: topic,
                limit: 5,
                threshold: 0.8
            });
            if (repoQuestions && repoQuestions.length >= 3) {
                const questions = repoQuestions.slice(0, 5).map(q => ({
                    question: q.question || q.question_text,
                    options: q.options || [],
                    level: q.difficulty || 'beginner',
                    skillId: q.concept_id,
                    type: 'mcq'
                }));
                log.success('GAMIFICATION', `Served ${questions.length} repository diagnostic questions for "${topic}"`);
                return res.json({ questions, source: 'repository' });
            }
        } catch (repoErr) {
            log.warn('GAMIFICATION', `Repository lookup for "${topic}" failed: ${repoErr.message}`);
        }

        // 2. Generate via LLM
        log.info('GAMIFICATION', `Generating diagnostic questions via LLM for "${topic}"`);
        const skillTreeGameService = require('../services/skillTreeGameService');
        const diagnostic = await skillTreeGameService.getDiagnosticQuiz(topic, req.user._id);
        const questions = (diagnostic.questions || []).map(q => ({
            question: q.question || q,
            options: q.options || [],
            level: 'beginner',
            type: q.options?.length ? 'mcq' : 'open-ended'
        }));
        if (questions.length === 0) {
            return res.status(503).json({ message: 'AI Service could not generate diagnostic questions. Please try again.' });
        }

        log.success('GAMIFICATION', `Generated ${questions.length} LLM-based diagnostic questions for "${topic}"`);
        return res.json({ questions });
    } catch (llmError) {
        log.error('GAMIFICATION', `LLM diagnostic generation failed for "${topic}": ${llmError.message}`);
        return res.status(503).json({ message: 'AI Service Unavailable. Please try a pre-configured course.' });
    }
}

// @route   POST /api/gamification/skill-tree/diagnostic/submit
// @desc    Submit diagnostic answers and get assessment result
router.post('/skill-tree/diagnostic/submit', async (req, res) => {
    try {
        const { topic, answers } = req.body;

        if (!topic || !answers || !Array.isArray(answers)) {
            return res.status(400).json({ message: 'Topic and answers are required' });
        }

        // 1. Server-side Grading for Diagnostic MCQ (with option-shuffle vault support)
        const courseCode = resolveCourseCode(String(topic).trim());
        const gradedDiag = await activeQuestionValidatorService.gradeAssessmentSubmission({
            userId: req.user._id,
            assessmentKey: `diagnostic_${courseCode || String(topic).trim()}`,
            answers: answers.map(a => ({
                question: a.question,
                selectedIndex: typeof a.selectedIndex === 'number' ? a.selectedIndex : undefined,
                userAnswer: a.answer || a.userAnswer || ''
            }))
        });

        let score = gradedDiag.correctCount || 0;
        const gradingDetails = (gradedDiag.results || []).map(r => ({
            question: r.question,
            correct: r.isCorrect,
            conceptHint: r.conceptHint
        }));

        // 2. Map score to level
        let level = 'Beginner';
        if (score >= 5) level = 'Expert';
        else if (score >= 4) level = 'Advanced';
        else if (score >= 2) level = 'Intermediate';

        const result = {
            level: level,
            score: score,
            total: answers.length,
            summary: `You answered ${score} out of ${answers.length} questions correctly. Based on your performance in "${topic}", we've placed you at the ${level} level.`,
            strengths: gradingDetails.filter(d => d.correct).map(d => d.question.substring(0, 50) + '...'),
            improvements: gradingDetails.filter(d => !d.correct).map(d => d.question.substring(0, 50) + '...'),
            recommendedStartingPoint: level === 'Beginner' ? 'Module 1: Fundamentals' : 'Module 2: Advanced Concepts',
            gradingDetails: gradingDetails
        };

        // ── REPLAY PROTECTION: Store seen question texts for this user/topic ───────────────
        try {
            const questionTexts = answers.map(a => a.question).filter(Boolean);
            if (questionTexts.length > 0) {
                const questionGeneratorService = require('../services/questionGeneratorService');
                await questionGeneratorService.addSeenQuizQuestions(
                    req.user._id,
                    topic,
                    topic,
                    questionTexts
                );
            }
        } catch (e) {
            log.warn('GAMIFICATION', `Failed to store seen diagnostic questions: ${e.message}`);
        }

        // 3. Store the assessment result for future use (Crucial for Skill Tree progression)
        await skillTreeService.storeUserTopicAssessment(req.user._id, topic, result, answers);

        log.success('GAMIFICATION', `Diagnostic submitted for "${topic}": Score ${score}/${answers.length} -> ${level}`);
        res.json(result);

    } catch (error) {
        log.error('SYSTEM', `Diagnostic submission error: ${error.message}`);
        res.status(500).json({ message: 'Error processing diagnostic results' });
    }
});

// @route   POST /api/gamification/skill-tree/generate-levels
// @desc    Generate personalized skill tree levels based on topic and assessment
router.post('/skill-tree/generate-levels', async (req, res) => {
    try {
        const { topic, assessmentResult, answers } = req.body;

        if (!topic) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        const knowledgeLevel = assessmentResult?.level || 'Beginner';
        let levels = [];

        const topicStr = String(topic).trim();
        const courseCode = resolveCourseCode(topicStr);

        // ── BRANCH 1: Admin Course → use the Neo4j curriculum map ────────────────
        const curriculumStructure = (await getCurriculumStructure(courseCode).catch(() => null)) ||
                                    (await getCurriculumStructure(topicStr).catch(() => null));
        const isAdminCourse = curriculumStructure?.modules?.length > 0;

        if (isAdminCourse) {
            log.info('AI', `[SkillTree] Topic "${topic}" matched Admin Course — loading Neo4j curriculum map`);
            let levelIndex = 1;
            for (const mod of curriculumStructure.modules) {
                for (const topicNode of (mod.topics || [])) {
                    for (const sub of (topicNode.subtopics || [])) {
                        const subName = sub.name || sub.id || `Subtopic ${levelIndex}`;
                        const diff = levelIndex <= 10 ? 'easy' : levelIndex <= 20 ? 'medium' : 'hard';
                        levels.push({
                            id: levelIndex,
                            name: subName,
                            description: `${topicNode.name || mod.name} › ${subName}`,
                            difficulty: diff,
                            status: levelIndex === 1 ? 'unlocked' : 'locked',
                            stars: 0,
                            credits: levelIndex * 10,
                            // Bind pre-existing subtopic questions if any
                            subtopic_id: sub.id,
                            topic_name: topicNode.name,
                            module_name: mod.name,
                            isAdminCourse: true
                        });
                        levelIndex++;
                    }
                }
            }

            // Apply diagnostic level jump: if not beginner, unlock already-acquired subtopics
            if (knowledgeLevel !== 'Beginner' && levels.length > 0) {
                const skipCount = knowledgeLevel === 'Expert' ? Math.floor(levels.length * 0.6) :
                    knowledgeLevel === 'Advanced' ? Math.floor(levels.length * 0.4) :
                    knowledgeLevel === 'Intermediate' ? Math.floor(levels.length * 0.2) : 0;
                for (let i = 0; i < skipCount && i < levels.length; i++) {
                    levels[i].status = 'unlocked';
                    levels[i].skippedByDiagnostic = true;
                }
                if (skipCount > 0) {
                    log.info('AI', `[SkillTree] ${knowledgeLevel} diagnostic — unlocked first ${skipCount} levels for "${topic}"`);
                }
            }

            log.success('AI', `[SkillTree] Built ${levels.length}-level map from Neo4j for "${topic}"`);
        }

        // ── BRANCH 2: Custom Topic → use content generation service ──────────
        let genResult = null;
        if (!isAdminCourse) {
            log.info('AI', `[SkillTree] Topic "${topic}" is custom — using content generation service`);
            const contentGen = require('../services/contentGenerationService');
            genResult = await contentGen.generateOrRetrieveSkillTreeLevels(topic, assessmentResult);
            levels = genResult.levels || [];
            log.info('AI', `[SkillTree] Got ${levels.length} levels from ${genResult._source}`);
        }

        // Persist to Redis + MongoDB was already done by contentGenerationService
        res.json({
          levels,
          isAdminCourse,
          _source: genResult?._source || (isAdminCourse ? 'neo4j' : 'generated'),
          generatedBy: genResult?.generatedBy || '',
          model: genResult?.model || '',
          pipelineVersion: genResult?.pipelineVersion || '',
        });

    } catch (error) {
        log.error('SYSTEM', 'Error generating levels', error);
        res.status(500).json({ message: 'Error generating skill tree levels' });
    }
});

const COURSE_BOOTSTRAP_DIR_REF = path.join(__dirname, '..', '..', 'course_bootstrap');

function getEvaluationPoolForTopicAndLevel(topic, levelId, levelName) {
    if (!topic) return null;
    try {
        if (!fs.existsSync(COURSE_BOOTSTRAP_DIR_REF)) return null;
        const dirs = fs.readdirSync(COURSE_BOOTSTRAP_DIR_REF);
        const cleanTopic = String(topic).toLowerCase().replace(/[^a-z0-9]/g, '');
        
        let targetDir = dirs.find(d => d.toLowerCase() === cleanTopic || cleanTopic.includes(d.toLowerCase()));
        
        if (!targetDir) {
            targetDir = dirs.find(d => {
                const evalPath = path.join(COURSE_BOOTSTRAP_DIR_REF, d, 'skill_tree_evaluation.json');
                if (fs.existsSync(evalPath)) {
                    try {
                        const content = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
                        const cName = String(content.course_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                        return cName.includes(cleanTopic) || cleanTopic.includes(cName);
                    } catch (e) { return false; }
                }
                return false;
            });
        }

        if (targetDir) {
            const evalPath = path.join(COURSE_BOOTSTRAP_DIR_REF, targetDir, 'skill_tree_evaluation.json');
            if (fs.existsSync(evalPath)) {
                const evalData = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
                const levels = evalData.levels || [];
                
                let targetLvl = null;
                if (typeof levelId !== 'undefined' && levelId !== null) {
                    const parsedLvlId = parseInt(levelId);
                    targetLvl = levels.find(l => l.level === parsedLvlId);
                }
                if (!targetLvl && levelName) {
                    targetLvl = levels.find(l => l.name?.toLowerCase().includes(String(levelName).toLowerCase()) || String(levelName).includes(`Level ${l.level}`));
                }
                if (!targetLvl) {
                    targetLvl = levels[0];
                }

                if (targetLvl && targetLvl.questions && targetLvl.questions.length > 0) {
                    return {
                        courseCode: evalData.course_code,
                        courseName: evalData.course_name,
                        level: targetLvl.level,
                        levelName: targetLvl.name,
                        questionsPool: targetLvl.questions
                    };
                }
            }
        }
    } catch (err) {
        log.warn('GAMIFICATION', `Evaluation pool lookup error: ${err.message}`);
    }
    return null;
}

// // @route   POST /api/gamification/skill-tree/level-questions
// @desc    Generate/validate quiz questions for a specific level (Active Deduplication & Local LLM dynamic generator)
router.post('/skill-tree/level-questions', async (req, res) => {
    try {
        const { topic, levelId, levelName, difficulty, gameId, seenQuestions: reqBodySeen, requestedCount = 5 } = req.body;

        if (!topic || (!levelId && !levelName)) {
            return res.status(400).json({ message: 'Topic and level identifier (levelId or levelName) are required' });
        }

        const topicStr = String(topic || '').trim();
        const courseCode = resolveCourseCode(topicStr);

        let seenQuestions = Array.isArray(reqBodySeen) ? [...reqBodySeen] : [];

        // Check active game state for additional seen questions if gameId provided
        let game = null;
        if (gameId) {
            try {
                game = await SkillTreeGame.findOne({ _id: gameId, userId: req.user._id });
                if (game) {
                    const level = typeof levelId !== 'undefined'
                        ? game.levels.find(l => String(l.id) === String(levelId))
                        : game.levels.find(l => l.name === levelName);
                    if (level?.seenQuestions) {
                        seenQuestions = Array.from(new Set([...seenQuestions, ...level.seenQuestions]));
                    }
                }
            } catch (err) {
                log.warn('GAMIFICATION', `Game state lookup error: ${err.message}`);
            }
        }

        // Delegate to Active Question Validator Service (enforces deduplication, option shuffling & local LLM/DSP dynamic synthesis)
        const assessmentKey = `level_${levelId || levelName}`;
        const valResult = await activeQuestionValidatorService.validateAndGenerateFreshQuestions({
            userId: req.user._id,
            courseCode: courseCode,
            topic: topicStr,
            levelId,
            levelName,
            requestedCount: Math.min(parseInt(requestedCount) || 5, 10),
            seenQuestions,
            assessmentKey
        });

        const safeClientQuestions = valResult.clientQuestions || activeQuestionValidatorService.sanitizeQuestionsForClient(valResult.questions);

        // Persist served questions (sanitized, without answers) into game state if gameId provided
        if (game && safeClientQuestions.length > 0) {
            try {
                const levelIdx = typeof levelId !== 'undefined'
                    ? game.levels.findIndex(l => String(l.id) === String(levelId))
                    : game.levels.findIndex(l => l.name === levelName);

                if (levelIdx !== -1) {
                    const newlyServed = valResult.questions.map(q => q.question || q.id);
                    game.levels[levelIdx].seenQuestions = Array.from(new Set([...seenQuestions, ...newlyServed]));
                    game.levels[levelIdx].questions = safeClientQuestions;
                    await game.save();
                }
            } catch (saveErr) {
                log.warn('GAMIFICATION', `Failed updating game state: ${saveErr.message}`);
            }
        }

        return res.json({
            questions: safeClientQuestions,
            totalServed: valResult.totalServed,
            timeLimitMinutes: 60,
            timeLimitSeconds: 3600,
            minSyllabusCoveragePercentage: 100,
            deduplicationActive: true,
            llmSynthesizedCount: valResult.llmSynthesizedCount,
            source: 'active_question_validator_service',
            generatedBy: 'active_validator_local_llm',
            model: 'rubric_evaluator_sglang_ollama',
            pipelineVersion: 'v2',
            generatedAt: new Date().toISOString()
        });

    } catch (error) {
        log.error('SYSTEM', 'Error validating level questions', error);
        res.status(500).json({ message: 'Error generating level questions' });
    }
});

// @route   POST /api/gamification/skill-tree/grade-level
// @desc    Server-side grading for Skill Tree Level Worksheet & Single-Card mode (Zero Answer Reveal)
router.post('/skill-tree/grade-level', async (req, res) => {
    try {
        const { topic, levelId, levelName, answers, questions } = req.body;
        if (!Array.isArray(answers)) {
            return res.status(400).json({ message: 'answers array is required' });
        }

        const assessmentKey = `level_${levelId || levelName || topic || 'default'}`;
        const graded = await activeQuestionValidatorService.gradeAssessmentSubmission({
            userId: req.user._id,
            assessmentKey,
            answers,
            submittedQuestions: Array.isArray(questions) ? questions : []
        });

        return res.json({
            success: true,
            score: graded.score,
            correctCount: graded.correctCount,
            totalQuestions: graded.totalQuestions,
            percentage: graded.percentage,
            results: (graded.results || []).map(r => ({
                questionIndex: r.questionIndex,
                selectedIndex: r.selectedIndex,
                isCorrect: r.isCorrect,
                conceptHint: r.conceptHint
            }))
        });
    } catch (error) {
        log.error('GAMIFICATION', `Error grading level: ${error.message}`);
        res.status(500).json({ message: 'Error grading level submission' });
    }
});

// @route   POST /api/gamification/skill-tree/record-answers
// @desc    Record individual question results for analytics tracking
router.post('/skill-tree/record-answers', async (req, res) => {
    try {
        const { topic, levelName, answers } = req.body;
        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: 'answers array is required' });
        }

        const conceptQbService = require('../services/conceptQuestionBankService');
        let recorded = 0;

        for (const ans of answers) {
            if (ans._conceptQuestionId) {
                await conceptQbService.recordQuestionAttempt(
                    ans._conceptQuestionId,
                    req.user._id,
                    ans.correct === true
                );
                recorded++;
            }
        }

        log.info('GAMIFICATION', `Recorded ${recorded} question attempts for ${topic}/${levelName}`);
        res.json({ success: true, recorded });
    } catch (error) {
        log.warn('GAMIFICATION', `Record answers error: ${error.message}`);
        res.json({ success: true, recorded: 0 });
    }
});

// @route   GET /api/gamification/skill-tree/analytics
// @desc    Get question analytics for a concept/course
router.get('/skill-tree/analytics', async (req, res) => {
    try {
        const { concept, course } = req.query;
        const conceptQbService = require('../services/conceptQuestionBankService');
        const analytics = await conceptQbService.getQuestionAnalytics(concept, course);
        res.json({ success: true, analytics });
    } catch (error) {
        log.error('GAMIFICATION', `Analytics error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});

// ===== Skill Tree Game Persistence =====

// @route   POST /api/gamification/skill-tree/games
// @desc    Create a new skill tree game for the user (or return existing)
router.post('/skill-tree/games', async (req, res) => {
    try {
        const userId = req.user._id;
        const { topic, assessmentResult, levels } = req.body;

        if (!topic) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        // Try to find existing game for user+topic
        let game = await SkillTreeGame.findOne({ userId, topic });
        if (game) {
            // Optionally update assessment or levels if provided
            if (assessmentResult) game.assessmentResult = assessmentResult;
            if (Array.isArray(levels) && levels.length > 0) {
                // Merge provided levels with existing, keeping the highest stars/score
                const provided = levels;
                provided.forEach(p => {
                    const idx = game.levels.findIndex(l => String(l.id) === String(p.id) || l.name === p.name);
                    if (idx !== -1) {
                        const existing = game.levels[idx];
                        existing.stars = Math.max(existing.stars || 0, p.stars || 0);
                        existing.score = Math.max(existing.score || 0, p.score || 0);
                        existing.totalQuestions = p.totalQuestions || existing.totalQuestions;
                        existing.attempts = Math.max(existing.attempts || 0, p.attempts || 0);
                        if (p.status === 'completed') existing.status = 'completed';
                        else if (p.status === 'unlocked' && existing.status !== 'completed') existing.status = 'unlocked';
                        game.levels[idx] = existing;
                    } else {
                        game.levels.push(p);
                    }
                });
            }
            await game.save();
            return res.json({ game });
        }

        // Auto-populate levels from SkillTreeLevels if levels array is empty
        let initialLevels = Array.isArray(levels) && levels.length > 0 ? levels : [];
        if (initialLevels.length === 0) {
            try {
                const SkillTreeLevels = require('../models/SkillTreeLevels');
                const courseCode = resolveCourseCode(topic);
                const cachedLvls = await SkillTreeLevels.findOne({
                    topic: { $in: [topic.trim(), courseCode] }
                }).lean();
                if (cachedLvls && Array.isArray(cachedLvls.levels) && cachedLvls.levels.length > 0) {
                    initialLevels = cachedLvls.levels.map((l, idx) => ({
                        ...l,
                        id: l.id || (idx + 1),
                        status: idx === 0 ? 'unlocked' : (l.status || 'locked')
                    }));
                }
            } catch (lvlErr) {
                log.warn('GAMIFICATION', `Auto-populate levels failed: ${lvlErr.message}`);
            }
        }

        // Create new game
        game = new SkillTreeGame({
            userId,
            topic,
            assessmentResult: assessmentResult || {},
            levels: initialLevels
        });

        await game.save();

        res.status(201).json({ game });

    } catch (error) {
        log.error('SYSTEM', 'Error creating skill tree game', error);
        res.status(500).json({ message: 'Error creating skill tree game' });
    }
});

// @route   GET /api/gamification/skill-tree/games
// @desc    Get all saved skill tree games for the user
router.get('/skill-tree/games', async (req, res) => {
    try {
        const userId = req.user._id;
        const games = await SkillTreeGame.find({ userId }).sort({ updatedAt: -1 });
        res.json({ games });
    } catch (error) {
        log.error('SYSTEM', 'Error fetching skill tree games', error);
        res.status(500).json({ message: 'Error fetching skill tree games' });
    }
});

// @route   DELETE /api/gamification/skill-tree/games/:gameId
// @desc    Delete a saved skill tree game (saves topic + completed levels to profile history)
router.delete('/skill-tree/games/:gameId', async (req, res) => {
    try {
        const userId = req.user._id;
        const { gameId } = req.params;

        // Fetch the game before deleting so we can save its history
        const game = await SkillTreeGame.findOne({ _id: gameId, userId });
        if (!game) return res.status(404).json({ message: 'Game not found' });

        const completedLevels = game.levels ? game.levels.filter(l => l.status === 'completed').length : 0;
        const totalLevels = game.levels ? game.levels.length : 0;

        // Save/update deleted game history: keep only the best completed-level count per topic
        const GamificationProfile = require('../models/GamificationProfile');
        let profile = await GamificationProfile.findOne({ userId });
        if (!profile) {
            profile = new GamificationProfile({ userId });
        }

        if (!Array.isArray(profile.deletedGames)) {
            profile.deletedGames = [];
        }

        const normalizedDeletedTopic = (game.topic || '').toLowerCase();
        const existingIdx = profile.deletedGames.findIndex(
            g => g.topic && g.topic.toLowerCase() === normalizedDeletedTopic
        );

        const gameSnapshot = {
            topic: game.topic,
            completedLevels,
            totalLevels,
            savedGameData: {
                assessmentResult: game.assessmentResult,
                levels: game.levels
            },
            deletedAt: new Date()
        };

        if (existingIdx === -1) {
            // No existing record for this topic, add it
            profile.deletedGames.push(gameSnapshot);
            await profile.save();
        } else {
            const existing = profile.deletedGames[existingIdx];
            // Replace only if the new deleted game has higher completed levels
            if ((completedLevels || 0) > (existing.completedLevels || 0)) {
                profile.deletedGames[existingIdx] = gameSnapshot;
                await profile.save();
            }
            // Otherwise keep existing DB record unchanged
        }

        await SkillTreeGame.deleteOne({ _id: gameId, userId });
        res.json({ success: true });
    } catch (error) {
        log.error('SYSTEM', 'Error deleting skill tree game', error);
        res.status(500).json({ message: 'Error deleting skill tree game' });
    }
});

// @route   PUT /api/gamification/skill-tree/games/:gameId/level/:levelId
// @desc    Update a single level's progress within a game
router.put('/skill-tree/games/:gameId/level/:levelId', async (req, res) => {
    try {
        const userId = req.user._id;
        const { gameId, levelId } = req.params;
        const update = req.body; // { status, stars, score, attempts, completedAt }

        let game;
        if (mongoose.Types.ObjectId.isValid(gameId)) {
            game = await SkillTreeGame.findOne({ _id: gameId, userId });
        }
        if (!game) {
            game = await SkillTreeGame.findOne({ userId }).sort({ updatedAt: -1 });
        }
        if (!game) return res.status(404).json({ message: 'Game not found' });

        const levelIndex = game.levels.findIndex(l => String(l.id) === String(levelId) || String(l._id) === String(levelId) || l.name === levelId);
        if (levelIndex === -1) return res.status(404).json({ message: 'Level not found in game' });

        const level = game.levels[levelIndex];

        // Security Anti-Tamper: Cannot mark a locked level as completed or unlocked directly
        if (level.status === 'locked' && (update.status === 'completed' || update.status === 'unlocked')) {
            log.warn('GAMIFICATION_SECURITY', `Attempted unauthorized state change on locked level ${levelId} by user ${userId}`);
            return res.status(400).json({ message: 'Security restriction: Cannot complete or unlock a locked level directly.' });
        }

        // Apply safe updates: strictly clamp stars to [0, 3] and prevent arbitrary score forging
        if (typeof update.stars !== 'undefined') {
            const boundedStars = Math.min(3, Math.max(0, parseInt(update.stars, 10) || 0));
            level.stars = Math.max(level.stars || 0, boundedStars);
        }
        if (typeof update.score !== 'undefined') {
            const boundedScore = Math.min(100, Math.max(0, parseInt(update.score, 10) || 0));
            level.score = Math.max(level.score || 0, boundedScore);
        }
        if (typeof update.totalQuestions !== 'undefined') {
            level.totalQuestions = Math.max(1, parseInt(update.totalQuestions, 10) || 1);
        }
        // Attempts increment (take max)
        if (typeof update.attempts !== 'undefined') {
            level.attempts = Math.min(1000, Math.max(level.attempts || 0, parseInt(update.attempts, 10) || 0));
        } else {
            level.attempts = (level.attempts || 0) + 1;
        }

        // Status: only move forward to 'unlocked' or 'completed' but never back to 'locked'
        // Only mark as completed if user earned at least 1 star
        if (typeof update.status !== 'undefined') {
            if (update.status === 'completed' && level.stars > 0) {
                level.status = 'completed';
            } else if (update.status === 'unlocked' && level.status !== 'completed') {
                level.status = 'unlocked';
            }
        }

        // Calculate credits earned (only on first completion)
        // Normal: 1★ = 5, 2★ = 8, 3★ = 10 credits. Boss Level: 2x multiplier!
        let creditsEarned = 0;
        const isFirstCompletion = level.status === 'completed' && !level.completedAt;
        const isBoss = (parseInt(levelId) % 5 === 0) || level.isMilestone;
        if (isFirstCompletion) {
            const baseCredits = level.stars === 3 ? 10 : level.stars === 2 ? 8 : level.stars === 1 ? 5 : 0;
            creditsEarned = isBoss ? baseCredits * 2 : baseCredits;
            level.creditsEarned = creditsEarned; // Store credits earned on first completion
            level.completedAt = new Date();

            // Award learning credits to profile history (don't block level save on failure)
            if (creditsEarned > 0) {
                try {
                    await gamificationService.awardLearningCredits(req.user._id, creditsEarned, isBoss ? 'milestone_boss_completion' : 'skill_tree_completion', game.topic);
                } catch (awardError) {
                    log.error('SYSTEM', 'Failed to award credits', awardError);
                }
                // Also award Bloom's XP: Doubled for Boss
                try {
                    const baseXp = level.stars === 3 ? 20 : level.stars === 2 ? 15 : 10;
                    const xpToAward = isBoss ? baseXp * 2 : baseXp;
                    await gamificationService.awardXP(req.user._id, xpToAward, 'application', game.topic);
                } catch (xpError) {
                    log.warn('SYSTEM', 'Failed to award XP for skill tree level', xpError);
                }
            }
        }

        game.levels[levelIndex] = level;
        // If this level was marked completed with stars, unlock the next locked level (if any)
        if (level.status === 'completed' && level.stars > 0) {
            // find next by position in array
            const nextIndex = levelIndex + 1;
            if (game.levels[nextIndex] && game.levels[nextIndex].status === 'locked') {
                game.levels[nextIndex].status = 'unlocked';
            }
        }

        log.success('SYSTEM', `Updated level ${levelId}: stars=${level.stars}, status=${level.status}`);

        // Mark levels array as modified to ensure Mongoose saves changes
        game.markModified('levels');
        await game.save();
        log.info('SYSTEM', 'Game saved successfully');

        // Record progress in the user's gamification profile
        try {
            // Use atomic mark to prevent duplicate credit awards on retries
            const didMark = await gamificationService.markLevelCreditsAwardedIfNot(
                userId,
                game.topic,
                levelId
            );
            const shouldAwardProfileCredits = didMark && level.stars > 0 && level.status === 'completed';
            await gamificationService.recordSkillTreeProgress(
                userId,
                game.topic,
                levelId,
                level.stars || 0,
                level.score || 0,
                level.totalQuestions || 0,
                shouldAwardProfileCredits
            );
        } catch (profileErr) {
            log.error('SYSTEM', 'Failed to record profile progress', profileErr);
        }

        res.json({ game, creditsEarned });
    } catch (error) {
        log.error('SYSTEM', 'Error updating level progress', error);
        res.status(500).json({ message: 'Error updating level progress' });
    }
});

// @route   POST /api/gamification/skill-tree/games/:gameId/save
// @desc    Save entire game state (levels array) for resume
router.post('/skill-tree/games/:gameId/save', async (req, res) => {
    try {
        const userId = req.user._id;
        const { gameId } = req.params;
        const { levels, assessmentResult } = req.body;

        const game = await SkillTreeGame.findOne({ _id: gameId, userId });
        if (!game) return res.status(404).json({ message: 'Game not found' });

        if (Array.isArray(levels)) {
            // Merge provided levels with existing, preserve higher stars/score
            const provided = levels;
            provided.forEach(p => {
                const idx = game.levels.findIndex(l => String(l.id) === String(p.id) || l.name === p.name);
                if (idx !== -1) {
                    const existing = game.levels[idx];
                    existing.stars = Math.max(existing.stars || 0, p.stars || 0);
                    existing.score = Math.max(existing.score || 0, p.score || 0);
                    existing.totalQuestions = p.totalQuestions || existing.totalQuestions;
                    existing.attempts = Math.max(existing.attempts || 0, p.attempts || 0);
                    if (p.status === 'completed') existing.status = 'completed';
                    else if (p.status === 'unlocked' && existing.status !== 'completed') existing.status = 'unlocked';
                    game.levels[idx] = existing;
                } else {
                    game.levels.push(p);
                }
            });
        }
        if (assessmentResult) game.assessmentResult = assessmentResult;

        await game.save();

        res.json({ game });
    } catch (error) {
        log.error('SYSTEM', 'Error saving game state', error);
        res.status(500).json({ message: 'Error saving game state' });
    }
});

// @route   POST /api/gamification/skill-tree/complete-level
// @desc    Save level completion progress
router.post('/skill-tree/complete-level', async (req, res) => {
    try {
        const { topic, levelId, stars, score, totalQuestions } = req.body;

        // Atomically mark credits awarded if not already, to avoid race conditions
        const didMark = await gamificationService.markLevelCreditsAwardedIfNot(req.user._id, topic, levelId);

        // Record progress (preserve creditsAwarded if mark succeeded)
        await gamificationService.recordSkillTreeProgress(
            req.user._id,
            topic,
            levelId,
            stars,
            score,
            totalQuestions,
            didMark
        );

        // Award Learning Credits only if our atomic mark succeeded
        let learningCreditsEarned = 0;
        let xpEarned = 0;
        if (didMark && stars > 0) {
            learningCreditsEarned = stars === 3 ? 10 : stars === 2 ? 8 : 5;
            xpEarned = stars === 3 ? 30 : stars === 2 ? 20 : 15;
            await gamificationService.awardLearningCredits(req.user._id, learningCreditsEarned, 'skill_tree_completion', topic);
            await gamificationService.awardXP(req.user._id, xpEarned, 'skill_tree_completion', topic);
        }

        res.json({
            success: true,
            learningCreditsEarned,
            message: `Level ${levelId} completed with ${stars} stars!`
        });

    } catch (error) {
        log.error('SYSTEM', 'Error completing level', error);
        res.status(500).json({ message: 'Error saving level progress' });
    }
});

// ===== Skill Tree Games (Additional Endpoints) =====

// @route   GET /api/gamification/skill-tree/games/:gameId
// @desc    Get a specific saved game
router.get('/skill-tree/games/:gameId', async (req, res) => {
    try {
        let game = null;
        if (mongoose.Types.ObjectId.isValid(req.params.gameId)) {
            game = await SkillTreeGame.findOne({
                _id: req.params.gameId,
                userId: req.user._id
            });
        }

        if (!game) {
            // Fallback: if gameId was invalid or not found, check for most recent game of this user (optionally filtered by topic)
            const topic = req.query.topic;
            const query = { userId: req.user._id };
            if (topic) query.topic = topic;
            game = await SkillTreeGame.findOne(query).sort({ updatedAt: -1 });
        }

        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }

        res.json({ game });
    } catch (error) {
        log.error('SYSTEM', 'Error fetching skill tree game', error);
        res.status(500).json({ message: 'Error fetching game' });
    }
});

// ===== Leaderboards =====

// @route   GET /api/gamification/mind-map
// @desc    Get user's Concept Mind Map & Anti-Farm XP status
router.get('/mind-map', async (req, res) => {
    try {
        const mindMap = await gamificationService.getStudentMindMap(req.user._id);
        res.json(mindMap);
    } catch (error) {
        log.error('SYSTEM', 'Error fetching student mind map', error);
        res.status(500).json({ message: 'Error fetching student mind map' });
    }
});

// @route   GET /api/gamification/leaderboard
// @desc    Get global XP leaderboard (excludes test users, developers, and admins)
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
        const data = await gamificationService.getGlobalLeaderboard(limit, req.user?._id);
        res.json(data);
    } catch (error) {
        log.error('SYSTEM', 'Error fetching global leaderboard', error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});

// @route   GET /api/gamification/leaderboard/:topic
// @desc    Get topic-specific leaderboard
router.get('/leaderboard/:topic', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const leaderboard = await gamificationService.getTopicLeaderboard(
            req.params.topic,
            limit
        );

        res.json({ leaderboard });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching leaderboard', error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});



// ===== Concept Crafting =====

// @route   POST /api/gamification/craft-concept
// @desc    Submit user-created learning content
router.post('/craft-concept', async (req, res) => {
    try {
        const { topic, type, content } = req.body;

        if (!topic || !type || !content) {
            return res.status(400).json({ message: 'Topic, type, and content are required' });
        }

        // AI evaluation prompt
        const evaluationPrompt = `Evaluate this student-created learning content:

Topic: ${topic}
Type: ${type}
Title: ${content.title}
Content: ${content.body || content.front + ' ' + content.back}

Rate on these criteria (0-100 each):
1. Accuracy: Is the content factually correct?
2. Clarity: Is it easy to understand?
3. Creativity: Is it memorable/original?

Return JSON:
{
  "accuracyScore": <0-100>,
  "clarityScore": <0-100>,
  "creativityScore": <0-100>,
  "feedback": "brief constructive feedback (max 100 words)"
}`;

        const { chosenModel } = await selectLLM(evaluationPrompt, { user: req.user });

        let evaluationText;
        if (chosenModel.provider === 'gemini') {
            evaluationText = await geminiService.generateContent(evaluationPrompt, {
                temperature: 0.4
            });
        } else {
            evaluationText = await require('../services/sglangService').generateContent(
                evaluationPrompt,
                chosenModel.modelId,
                { temperature: 0.4 }
            );
        }

        // Parse AI evaluation
        const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
        let aiEvaluation = {
            accuracyScore: 70,
            clarityScore: 70,
            creativityScore: 70,
            feedback: 'Good effort!',
            evaluatedAt: new Date()
        };

        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                aiEvaluation = {
                    ...parsed,
                    overallScore: Math.round((parsed.accuracyScore + parsed.clarityScore + parsed.creativityScore) / 3),
                    evaluatedAt: new Date()
                };
            } catch (e) {
                log.warn('AI', 'Failed to parse AI evaluation');
            }
        }

        // Create contribution
        const contribution = new ConceptContribution({
            userId: req.user._id,
            topic,
            type,
            content,
            aiEvaluation
        });

        await contribution.save();

        // Award Learning Credits
        const learningCreditsEarned = contribution.calculateXP();
        if (learningCreditsEarned > 0) {
            await gamificationService.awardLearningCredits(req.user._id, learningCreditsEarned, 'crafting', topic);
        }

        res.json({
            contribution,
            earnedLearningCredits: learningCreditsEarned,
            evaluation: aiEvaluation
        });

    } catch (error) {
        log.error('SYSTEM', 'Error crafting concept', error);
        res.status(500).json({ message: 'Error creating concept contribution' });
    }
});

// @route   GET /api/gamification/my-contributions
// @desc    Get user's concept contributions
router.get('/my-contributions', async (req, res) => {
    try {
        const contributions = await ConceptContribution.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ contributions });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching contributions', error);
        res.status(500).json({ message: 'Error fetching contributions' });
    }
});

// ===== Energy & Streak =====

// @route   GET /api/gamification/energy
// @desc    Get current energy status
router.get('/energy', async (req, res) => {
    try {
        const profile = await gamificationService.getOrCreateProfile(req.user._id);
        const breakStatus = await energyService.checkBreakStatus(req.user._id);

        res.json({
            currentEnergy: profile.currentEnergy,
            fatigueScore: profile.fatigueScore,
            onBreak: breakStatus.onBreak,
            breakRemaining: breakStatus.remainingMinutes
        });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching energy', error);
        res.status(500).json({ message: 'Error fetching energy status' });
    }
});

// @route   GET /api/gamification/streak
// @desc    Get current streak info
router.get('/streak', async (req, res) => {
    try {
        const streakStats = await streakService.getStreakStats(req.user._id);
        res.json(streakStats);

    } catch (error) {
        log.error('SYSTEM', 'Error fetching streak', error);
        res.status(500).json({ message: 'Error fetching streak' });
    }
});

// ===== Bounty Questions System =====

const bountyService = require('../services/bountyService');

// @route   GET /api/gamification/bounties
// @desc    Get active bounty questions for user (auto-generates if none exist)
router.get('/bounties', async (req, res) => {
    try {
        let bounties = await bountyService.getActiveBounties(req.user._id);

        // Auto-generate a bounty if user has none
        if (bounties.length === 0) {
            log.info('SYSTEM', `User ${req.user._id} has no bounties, auto-generating...`);
            try {
                const newBounty = await bountyService.generateBountyForUser(req.user._id);
                if (newBounty) {
                    bounties = [newBounty];
                }
            } catch (error) {
                log.error('SYSTEM', 'Bounty auto-generation failed', error);
                // Return empty array if auto-generation fails
            }
        }

        res.json({ bounties });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching bounties', error);
        res.status(500).json({ message: 'Error fetching bounty questions' });
    }
});

// @route   POST /api/gamification/bounty/:bountyId/submit
// @desc    Submit answer to bounty question
router.post('/bounty/:bountyId/submit', async (req, res) => {
    try {
        const { answer } = req.body;

        if (!answer) {
            return res.status(400).json({ message: 'Answer is required' });
        }

        const result = await bountyService.submitBountyAnswer(
            req.params.bountyId,
            req.user._id,
            answer
        );

        log.success('SYSTEM', `Bounty result: ${result.isCorrect ? 'CORRECT' : 'INCORRECT'}, Credits: ${result.creditsAwarded}`);

        res.json({
            success: true,
            ...result,
            message: result.isCorrect
                ? `Correct! You earned ${result.creditsAwarded} Bounty Credits and +${result.xpAwarded || 20} XP!`
                : 'Incorrect answer. Better luck next time!'
        });

    } catch (error) {
        log.error('SYSTEM', 'Error submitting bounty', error);
        res.status(400).json({ message: error.message || 'Error submitting answer' });
    }
});

// @route   GET /api/gamification/credits
// @desc    Get user's learning credits balance
router.get('/credits', async (req, res) => {
    try {
        const GamificationProfile = require('../models/GamificationProfile');
        const profile = await GamificationProfile.findOne({ userId: req.user._id });

        if (!profile) {
            return res.json({ credits: 0, history: [] });
        }

        res.json({
            credits: profile.learningCredits || 0,
            history: profile.creditsHistory?.slice(-20).reverse() || []
        });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching credits balance', error);
        res.status(500).json({ message: 'Error fetching credits' });
    }
});

// @route   POST /api/gamification/generate-bounty
// @desc    Manually trigger bounty generation (for testing)
router.post('/generate-bounty', async (req, res) => {
    try {
        const gapAnalysis = await bountyService.analyzeKnowledgeGaps(req.user._id, 7);

        if (!gapAnalysis) {
            return res.status(404).json({ message: 'Not enough data to generate bounty' });
        }

        const bounty = await bountyService.generateBountyQuestion(req.user._id, gapAnalysis);


        if (!bounty) {
            return res.status(500).json({ message: 'Failed to generate bounty' });
        }

        res.json({ bounty, message: 'Bounty question generated successfully' });

    } catch (error) {
        log.error('SYSTEM', 'Error generating manual bounty', error);
        res.status(500).json({ message: 'Error generating bounty question' });
    }
});

// ===== Boss Battles System =====

const bossBattleService = require('../services/bossBattleService');

// @route   GET /api/gamification/boss-battles
// @desc    Get active boss battles for user (auto-generates if none exist)
router.get('/boss-battles', async (req, res) => {
    try {
        let battles = await bossBattleService.getActiveBattles(req.user._id);

        // Auto-generate a battle if user has none
        if (battles.length === 0) {
            log.info('SYSTEM', `User ${req.user._id} has no battles, auto-generating...`);
            try {
                const newBattle = await bossBattleService.createBossBattle(req.user._id);
                battles = [newBattle];
            } catch (error) {
                log.error('SYSTEM', 'Boss battle auto-generation failed', error);
                // Return empty array if auto-generation fails
            }
        }

        res.json({ battles });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching boss battles', error);
        res.status(500).json({ message: 'Error fetching boss battles' });
    }
});

// @route   GET /api/gamification/boss-battle/:battleId
// @desc    Get specific boss battle (sanitized)
router.get('/boss-battle/:battleId', async (req, res) => {
    try {
        const battle = await bossBattleService.getBattle(req.params.battleId, req.user._id);

        if (!battle) {
            return res.status(404).json({ message: 'Boss battle not found' });
        }

        res.json({ battle });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching boss battle', error);
        res.status(500).json({ message: 'Error fetching boss battle' });
    }
});

// @route   GET /api/gamification/boss-battles/history
// @desc    Get boss battle history
router.get('/boss-battles/history', async (req, res) => {
    try {
        const history = await bossBattleService.getBattleHistory(req.user._id, 20);
        res.json({ history });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching battle history', error);
        res.status(500).json({ message: 'Error fetching history' });
    }
});

// @route   POST /api/gamification/boss-battle/create
// @desc    Create a new boss battle
router.post('/boss-battle/create', async (req, res) => {
    try {
        const { topic, difficulty } = req.body;

        const battle = await bossBattleService.createBossBattle(
            req.user._id,
            topic,
            difficulty
        );

        res.json({ battle, message: 'Boss battle created successfully' });

    } catch (error) {
        log.error('SYSTEM', 'Error creating battle', error);
        res.status(500).json({ message: 'Error creating boss battle' });
    }
});

// @route   POST /api/gamification/boss-battle/:battleId/submit
// @desc    Submit answers for a boss battle
router.post('/boss-battle/:battleId/submit', async (req, res) => {
    try {
        const { answers } = req.body;

        if (!answers) {
            log.warn('SYSTEM', 'No answers provided for boss battle');
            return res.status(400).json({ message: 'Answers are required. Please provide an answers array.' });
        }

        if (!Array.isArray(answers)) {
            log.warn('SYSTEM', `Invalid answers format: ${typeof answers}`);
            return res.status(400).json({ message: `Answers must be an array, received: ${typeof answers}` });
        }

        if (answers.length === 0) {
            log.warn('SYSTEM', 'Empty answers array provided');
            return res.status(400).json({ message: 'Answers array cannot be empty' });
        }

        log.info('SYSTEM', `Submitting boss battle ${req.params.battleId} (${answers.length} answers)`);

        const result = await bossBattleService.submitBattle(
            req.params.battleId,
            req.user._id,
            answers
        );

        log.success('SYSTEM', `Battle result: ${result.status}, Score: ${result.score}%`);

        res.json({
            success: true,
            ...result,
            message: result.status === 'completed'
                ? `Victory! You scored ${result.score}% and earned ${result.earnedLearningCredits} Learning Credits!${result.leveledUp ? ' You leveled up!' : ''}`
                : `Battle failed with ${result.score}%. Review the revision plan and try again!`
        });

    } catch (error) {
        log.error('SYSTEM', 'Error submitting battle', error);
        res.status(400).json({ message: error.message || 'Error submitting battle' });
    }
});

// ===== Badges System =====

// @route   GET /api/gamification/badges
// @desc    Get all user's earned badges
router.get('/badges', async (req, res) => {
    try {
        const badges = await badgeService.getUserBadges(req.user._id);
        res.json({ badges });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching badges', error);
        res.status(500).json({ message: 'Error fetching badges' });
    }
});

// @route   GET /api/gamification/badges/all
// @desc    Get all available badges (for showcase)
router.get('/badges/all', async (req, res) => {
    try {
        const allBadges = badgeService.getAllBadges();
        const userBadges = await badgeService.getUserBadges(req.user._id);
        const earnedIds = userBadges.map(b => b.badgeId);

        // Mark which badges are earned
        const badges = allBadges.map(badge => ({
            ...badge,
            earned: earnedIds.includes(badge.badgeId),
            earnedAt: userBadges.find(b => b.badgeId === badge.badgeId)?.earnedAt || null
        }));

        res.json({ badges });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching all badges', error);
        res.status(500).json({ message: 'Error fetching badge catalog' });
    }
});

// @route   POST /api/gamification/check-badges
// @desc    Manual trigger to check and award new badges
router.post('/check-badges', async (req, res) => {
    try {
        const newBadges = await badgeService.checkAndAwardBadges(req.user._id);

        res.json({
            newBadges,
            count: newBadges.length,
            message: newBadges.length > 0 ? `Earned ${newBadges.length} new badges!` : 'No new badges'
        });

    } catch (error) {
        log.error('SYSTEM', 'Error checking badges', error);
        res.status(500).json({ message: 'Error checking badges' });
    }
});

// ===== Skill Tree Visual Map =====

// @route   GET /api/gamification/skill-tree-map
// @desc    Get skill tree with all connections for visualization (fog-of-war map)
router.get('/skill-tree-map', async (req, res) => {
    try {
        const course = req.query.course || 'EE3621';
        const skillTree = await skillTreeService.getUserSkillTree(req.user._id, course);

        // Build connection map for edges
        const connections = [];
        skillTree.forEach(skill => {
            if (skill.prerequisites && skill.prerequisites.length > 0) {
                skill.prerequisites.forEach(prereqId => {
                    connections.push({
                        from: prereqId,
                        to: skill.skillId,
                        type: skill.status === 'locked' ? 'blocked' : 'active'
                    });
                });
            }
        });

        res.json({
            skills: skillTree,
            connections,
            mapMetadata: {
                totalSkills: skillTree.length,
                unlockedCount: skillTree.filter(s => s.status !== 'locked').length,
                masteredCount: skillTree.filter(s => s.status === 'mastered').length
            }
        });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching skill tree map', error);
        res.status(500).json({ message: 'Error fetching skill tree map' });
    }
});

// @route   GET /api/gamification/skill/:skillId/details
// @desc    Get detailed information about a specific skill
router.get('/skill/:skillId/details', async (req, res) => {
    try {
        const { skillId } = req.params;
        const SkillTree = require('../models/SkillTree');

        const skill = await SkillTree.findOne({ skillId, isActive: true });
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        const unlockStatus = await skillTreeService.isSkillUnlocked(req.user._id, skillId);
        const profile = await require('../models/GamificationProfile').findOne({ userId: req.user._id });
        const mastery = profile ? profile.skillMastery.get(skillId) || 0 : 0;

        res.json({
            skill: {
                ...skill.toObject(),
                unlocked: unlockStatus.unlocked,
                mastery,
                blockedBy: unlockStatus.blockedBy,
                masteryThreshold: skill.masteryThreshold
            }
        });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching skill details', error);
        res.status(500).json({ message: 'Error fetching skill details' });
    }
});

// @route   GET /api/gamification/skill/:skillId/unlock-path
// @desc    Get the path of skills needed to unlock a locked skill
router.get('/skill/:skillId/unlock-path', async (req, res) => {
    try {
        const { skillId } = req.params;
        const SkillTree = require('../models/SkillTree');
        const userId = req.user._id;

        const skill = await SkillTree.findOne({ skillId, isActive: true });
        if (!skill) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        const unlockStatus = await skillTreeService.isSkillUnlocked(userId, skillId);

        if (unlockStatus.unlocked) {
            return res.json({
                unlocked: true,
                path: []
            });
        }

        // Build unlock path
        const path = [];
        const visited = new Set();

        async function buildPath(currentSkillId) {
            if (visited.has(currentSkillId)) return;
            visited.add(currentSkillId);

            const current = await SkillTree.findOne({ skillId: currentSkillId });
            if (!current) return;

            const currentUnlock = await skillTreeService.isSkillUnlocked(userId, currentSkillId);

            path.push({
                skillId: currentSkillId,
                name: current.name,
                unlocked: currentUnlock.unlocked,
                mastery: currentUnlock.masteryPercentage || 0,
                required: current.masteryThreshold
            });

            if (current.prerequisites) {
                for (const prereqId of current.prerequisites) {
                    await buildPath(prereqId);
                }
            }
        }

        await buildPath(skillId);

        res.json({
            unlocked: false,
            path: path.reverse()
        });

    } catch (error) {
        log.error('SYSTEM', 'Error fetching unlock path', error);
        res.status(500).json({ message: 'Error fetching unlock path' });
    }
});

// @route   POST /api/gamification/skill/:skillId/checkpoint
// @desc    Mark a checkpoint achievement for a skill
router.post('/skill/:skillId/checkpoint', async (req, res) => {
    try {
        const { skillId } = req.params;
        const { checkpointType, data } = req.body; // checkpointType: 'assessment', 'reading', 'practice'

        const userId = req.user._id;
        const profile = await require('../models/GamificationProfile').findOne({ userId });

        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Log the checkpoint achievement
        const checkpoint = {
            skillId,
            checkpointType,
            achievedAt: new Date(),
            data
        };

        // Could extend profile with checkpoint tracking
        log.info('SYSTEM', `Checkpoint recorded for ${skillId}: ${checkpointType}`);

        res.json({
            message: 'Checkpoint recorded',
            checkpoint
        });

    } catch (error) {
        log.error('SYSTEM', 'Error recording checkpoint', error);
        res.status(500).json({ message: 'Error recording checkpoint' });
    }
});

module.exports = router;


