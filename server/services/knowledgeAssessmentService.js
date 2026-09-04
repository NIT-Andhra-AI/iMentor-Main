const { callWithFallback } = require('./llmFallbackService');
const { evaluateAssessment } = require('./evaluationAgentService');
const AssessmentResult = require('../models/AssessmentResult');
const StudentKnowledgeState = require('../models/StudentKnowledgeState');
const QuestionBank = require('../models/QuestionBank');
const log = require('../utils/logger');
const { runQuery: neo4jRun } = require('../config/neo4j');
const { resolveCourseTitle } = require('./courseIdentityService');

async function fetchCurriculumConcepts(course) {
  try {
    const result = await neo4jRun(
      `MATCH (m:Module)
       WHERE toLower(m.course) = toLower($course)
       OPTIONAL MATCH (m)-[:HAS_TOPIC]->(t:Topic)
       OPTIONAL MATCH (s:Subtopic)-[:PREREQUISITE_OF]->(t)
       RETURN COLLECT(DISTINCT m.name) AS modules,
              COLLECT(DISTINCT t.name) AS topics,
              COLLECT(DISTINCT s.name) AS subtopics`,
      { course }
    );
    if (result.records && result.records.length > 0) {
      const row = result.records[0].toObject();
      const all = [...(row.modules || []), ...(row.topics || []), ...(row.subtopics || [])]
        .filter(Boolean)
        .filter(n => n.length > 3 && !/^\d/.test(n));
      return [...new Set(all)];
    }
  } catch (e) {
    log.warn('KNOWLEDGE_ASSESS', `Neo4j curriculum fetch failed: ${e.message}`);
  }
  return [];
}

async function reuseOrGenerateQuestions({ course, module, topic, count = 5 }) {
  const searchTerm = topic || course || '';
  if (!searchTerm) return null;

  try {
    const escapeTerm = escapeRegex(searchTerm);
    const keywords = searchTerm.split(/[\s,]+/).filter(w => w.length > 3).map(escapeRegex);
    const keywordRegexes = keywords.map(k => new RegExp(k, 'i'));

    const qbFilter = {
      $or: [
        { course: { $regex: new RegExp(escapeTerm, 'i') } },
        { topic: { $regex: new RegExp(escapeTerm, 'i') } },
        ...(keywordRegexes.length > 0 ? [{ topic: { $in: keywordRegexes } }] : []),
      ]
    };
    
    // Query legacy QuestionBank
    const qbExisting = await QuestionBank.find(qbFilter).limit(20).lean();
    
    // Query ConceptQuestionBank
    const ConceptQuestionBank = require('../models/ConceptQuestionBank');
    const cqbFilter = {
      $or: [
        { course: { $regex: new RegExp(escapeTerm, 'i') } },
        { concept: { $regex: new RegExp(escapeTerm, 'i') } },
        { topic: { $regex: new RegExp(escapeTerm, 'i') } },
        ...(keywordRegexes.length > 0 ? [{ concept: { $in: keywordRegexes } }] : []),
      ]
    };
    const cqbExisting = await ConceptQuestionBank.find(cqbFilter).limit(20).lean();

    // Map legacy QuestionBank questions (ensure valid options exist)
    const mappedQb = qbExisting
      .filter(q => Array.isArray(q.options) && q.options.length >= 2)
      .map((q, i) => ({
        id: `qb_${i}_${Date.now()}`,
        question: q.question,
        type: 'mcq',
        options: q.options.map((opt, optIdx) => /^[A-D]\.\s*/i.test(opt) ? opt : `${String.fromCharCode(65 + optIdx)}. ${opt}`),
        bloomLevel: q.bloomLevel || 'understand',
        difficulty: q.difficulty || 'medium',
        concepts: q.tags || q.concepts || [q.topic || searchTerm],
        correctAnswer: q.correctAnswer || (q.options && q.options[q.correctIndex || 0]) || 'A',
        modelAnswer: q.explanation || '',
      }));

    // Map ConceptQuestionBank questions (ensure valid options exist)
    const mappedCqb = cqbExisting
      .filter(q => Array.isArray(q.options) && q.options.length >= 2)
      .map((q, i) => ({
        id: `cqb_${i}_${Date.now()}`,
        question: q.question,
        type: 'mcq',
        options: q.options.map((opt, optIdx) => /^[A-D]\.\s*/i.test(opt) ? opt : `${String.fromCharCode(65 + optIdx)}. ${opt}`),
        bloomLevel: q.bloomLevel || 'understand',
        difficulty: q.difficulty || 'medium',
        concepts: q.conceptTags || [q.concept || searchTerm],
        correctAnswer: (q.options && q.options[q.correctIndex !== undefined ? q.correctIndex : 0]) || 'A',
        modelAnswer: q.explanation || '',
      }));

    const combined = [...mappedQb, ...mappedCqb];
    if (combined.length >= count) {
      // Prioritize spanning across bloom levels
      const bloomGroups = {};
      combined.forEach(q => {
        const bl = q.bloomLevel.toLowerCase();
        if (!bloomGroups[bl]) bloomGroups[bl] = [];
        bloomGroups[bl].push(q);
      });

      const chosen = [];
      const bloomLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate'];
      
      // Shuffle each group
      Object.keys(bloomGroups).forEach(bl => {
        bloomGroups[bl].sort(() => Math.random() - 0.5);
      });

      // Try to pick one from each bloom level first
      for (const level of bloomLevels) {
        if (bloomGroups[level] && bloomGroups[level].length > 0) {
          chosen.push(bloomGroups[level].pop());
        }
      }

      // If we still need more questions, pull randomly from all remaining
      const remaining = Object.values(bloomGroups).flat().sort(() => Math.random() - 0.5);
      while (chosen.length < count && remaining.length > 0) {
        chosen.push(remaining.pop());
      }

      if (chosen.length >= count) {
        log.info('KNOWLEDGE_ASSESS', `Reused ${chosen.length} questions (legacy QB: ${qbExisting.length}, CQB: ${cqbExisting.length}) spanning bloom levels for "${searchTerm}"`);
        return chosen.slice(0, count);
      }
    }
  } catch (qbErr) {
    log.warn('KNOWLEDGE_ASSESS', `Predefined Question Bank query/merge failed: ${qbErr.message}`);
  }

  return null;
}

async function generateDiagnosticAssessment({ course, module, topic, userId }) {
  const courseTitle = resolveCourseTitle(course || topic || '', course || topic || '');
  // 1. Try Question Bank reuse
  const reused = await reuseOrGenerateQuestions({ course, module, topic });
  if (reused) {
    const now = new Date().toISOString();
    return {
      questions: reused, course, topic, courseTitle,
      source: 'question_bank',
      generatedBy: 'database',
      model: 'question_bank',
      pipelineVersion: 'v2',
      generatedAt: now,
      _source: 'question_bank',
    };
  }

  // 2. Try unified pipeline (Redis → MongoDB → Provider Chain → Template)
  try {
    const cg = require('./contentGenerationService');
    const result = await cg.generateOrRetrieveAssessment(course || topic, topic, userId);
    if (result && result.questions && result.questions.length > 0) {
      const questions = result.questions.map((q, i) => ({
        id: `assess_${i}_${Date.now()}`,
        question: q.question,
        type: 'mcq',
        options: q.options || [],
        bloomLevel: q.bloomLevel || 'understand',
        difficulty: q.difficulty || 'medium',
        concepts: [topic || course || 'general'],
        correctAnswer: String(q.options?.[q.correctIndex] || ''),
        modelAnswer: q.explanation || '',
      }));
      const now = new Date().toISOString();
      return {
        questions, course, topic, courseTitle,
        source: result._source || 'generated',
        generatedBy: result.generatedBy || 'pipeline',
        model: result.model || 'unknown',
        pipelineVersion: result.pipelineVersion || 'v2',
        generatedAt: result.generatedAt || now,
        _source: result._source || 'pipeline',
      };
    }
  } catch (e) {
    log.warn('KNOWLEDGE_ASSESS', `Pipeline generation failed, falling back to direct: ${e.message}`);
  }

  // 3. Fetch curriculum concepts for context-aware generation
  const concepts = await fetchCurriculumConcepts(course || topic || '');
  const conceptList = concepts.length > 0 ? concepts.slice(0, 15).join(', ') : (topic || course || 'general');
  const subjectTitle = courseTitle || topic || course || 'General';

  const prompt = `You are an expert educational diagnostician. Generate a diagnostic assessment to evaluate a learner's current knowledge.

Course: ${subjectTitle}
${module ? `Module: ${module}` : ''}
${topic ? `Topic: ${topic}` : ''}
Key concepts to cover: ${conceptList}

Generate exactly 5 Multiple Choice Questions (MCQs) that span Bloom's Taxonomy levels:
- 1 Remember (recall facts, definitions)
- 1 Understand (explain concepts in own words)
- 1 Apply (use knowledge in a practical context)
- 1 Analyze (break down components, find patterns)
- 1 Evaluate (make judgments, critique, justify)

Rules:
- Each question must test a DIFFERENT concept from the key concepts list
- Questions must be about actual subject matter, NOT about course codes or course names
- ALL 5 questions MUST be Multiple Choice Questions (type: "mcq") with exactly 4 options labeled "A. ...", "B. ...", "C. ...", "D. ..."
- Provide "correctAnswer" as the letter "A", "B", "C", or "D"
- Provide "modelAnswer" as a concise explanation of why the correct option is right
- Tag each question with its bloomLevel and difficulty (easy/medium/hard)

Return valid JSON only:
{
  "questions": [
    {
      "question": "Clear question text testing the concept...",
      "type": "mcq",
      "options": ["A. First choice", "B. Second choice", "C. Third choice", "D. Fourth choice"],
      "correctAnswer": "A",
      "modelAnswer": "Detailed explanation of why A is the correct answer.",
      "bloomLevel": "remember",
      "difficulty": "easy",
      "concepts": ["concept1"]
    }
  ]
}`;

  try {
    const providerHealth = require('./providerHealthCache');
    const healthyProviders = providerHealth.getHealthyProviders(['sglang', 'gemini', 'groq', 'openai', 'ollama']);
    const preferredProvider = healthyProviders[0] || 'sglang';
    const responseText = await callWithFallback({
      userQuery: prompt,
      systemPrompt: 'You are an educational assessment generator. Respond with valid JSON only. Every question MUST be a multiple choice question with 4 options in an array.',
      chatHistory: [],
      preferredProvider,
      preferLocalFirst: true,
      options: { groqModel: 'llama-3.1-8b-instant', temperature: 0.2, maxOutputTokens: 1200, timeout: 20000 },
    });

    const raw = typeof responseText === 'string' ? responseText : (responseText.text || JSON.stringify(responseText));
    let parsed;
    const text = raw;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error('Could not parse LLM response as JSON');
    }

    const questions = (parsed.questions || []).slice(0, 5).map((q, i) => {
      let rawOptions = Array.isArray(q.options) && q.options.length > 0 ? q.options : [];
      if (rawOptions.length < 4) {
        const fallbacks = [
          `Primary mechanism of ${q.concepts?.[0] || 'the concept'}`,
          `Secondary auxiliary application`,
          `Inverse / opposite operational mode`,
          `General boundary condition limitation`
        ];
        rawOptions = fallbacks;
      }
      const formattedOptions = rawOptions.map((opt, optIdx) => 
        /^[A-D]\.\s*/i.test(opt) ? opt : `${String.fromCharCode(65 + optIdx)}. ${opt}`
      );

      return {
        id: `diag_${i}_${Date.now()}`,
        question: q.question,
        type: 'mcq',
        options: formattedOptions,
        bloomLevel: q.bloomLevel || 'understand',
        difficulty: q.difficulty || 'medium',
        concepts: q.concepts || [topic || course || 'general'],
        correctAnswer: (q.correctAnswer || 'A').trim().charAt(0).toUpperCase(),
        modelAnswer: q.modelAnswer || q.explanation || '',
      };
    });

    const provider = typeof responseText === 'object' && responseText?.provider ? responseText.provider : 'unknown';
    const model = typeof responseText === 'object' && responseText?.model ? responseText.model : 'unknown';
    const now = new Date().toISOString();
    return {
      questions, course, topic, courseTitle: subjectTitle,
      source: provider,
      generatedBy: provider,
      model,
      pipelineVersion: 'v2',
      generatedAt: now,
      _source: provider,
    };
  } catch (error) {
    log.error('KNOWLEDGE_ASSESS', `Diagnostic generation failed: ${error.message}. Using curriculum-based fallback.`);
    return generateOfflineAssessment({ course, topic, concepts, courseTitle: subjectTitle });
  }
}

function generateOfflineAssessment({ course, topic, concepts = [], courseTitle = '' }) {
  const allConcepts = concepts.length > 0 ? concepts : ['fundamental principles', 'core concepts', 'practical applications', 'system architecture', 'design trade-offs'];

  const questionTemplates = [
    {
      bloomLevel: 'remember',
      difficulty: 'easy',
      question: allConcepts[0]
        ? `Which statement best defines "${allConcepts[0]}" in the context of this domain?`
        : `Which statement represents a core fundamental principle in this subject area?`,
      options: [
        `A. A foundational construct governing operational integrity and definitions.`,
        `B. A deprecated secondary utility with no current production relevance.`,
        `C. An external network protocol solely used in unrelated legacy hardware.`,
        `D. A compilation warning that does not affect runtime semantics.`
      ],
      correctAnswer: 'A',
      modelAnswer: `Option A correctly identifies the foundational nature and purpose of the concept.`,
      concepts: [allConcepts[0] || 'fundamentals'],
    },
    {
      bloomLevel: 'understand',
      difficulty: 'easy',
      question: allConcepts[1]
        ? `How does "${allConcepts[1]}" directly interact with or build upon "${allConcepts[0] || 'core concepts'}"?`
        : `How do foundational components interact to maintain consistency in this system?`,
      options: [
        `A. It provides higher-level abstraction and orchestrates underlying operations.`,
        `B. It completely bypasses all prerequisite data structures without safety.`,
        `C. It serves only as a static documentation comment.`,
        `D. It disables execution caching across all layers.`
      ],
      correctAnswer: 'A',
      modelAnswer: `Option A accurately captures how higher-level modules build upon foundational structures.`,
      concepts: [allConcepts[1] || 'relationships', allConcepts[0] || 'foundations'],
    },
    {
      bloomLevel: 'apply',
      difficulty: 'medium',
      question: allConcepts[2]
        ? `In a real-world scenario requiring optimal efficiency, how should "${allConcepts[2]}" be applied?`
        : `When applying key architectural patterns to solve a problem, what is the best practice?`,
      options: [
        `A. Implement appropriate data partitioning and minimize redundant operations.`,
        `B. Reallocate unbounded memory buffers unconditionally on every transaction.`,
        `C. Ignore synchronization constraints during concurrent state mutations.`,
        `D. Replace deterministic algorithms with unverified heuristic randomizers.`
      ],
      correctAnswer: 'A',
      modelAnswer: `Option A represents the optimal engineering practice for applying this concept.`,
      concepts: [allConcepts[2] || 'application'],
    },
    {
      bloomLevel: 'analyze',
      difficulty: 'medium',
      question: `When analyzing trade-offs between competing strategies in this domain, which factor is most critical?`,
      options: [
        `A. Algorithmic complexity, resource contention, and throughput guarantees.`,
        `B. The alphabetical ordering of internal function identifiers.`,
        `C. The date the source repository was cloned locally.`,
        `D. The operating system UI color theme.`
      ],
      correctAnswer: 'A',
      modelAnswer: `Option A details the genuine technical metrics used to analyze competing strategies.`,
      concepts: ['analysis', 'comparison'],
    },
    {
      bloomLevel: 'evaluate',
      difficulty: 'hard',
      question: `To evaluate whether a proposed architectural overhaul is justified, what primary criterion must be verified?`,
      options: [
        `A. Measurable improvements in fault tolerance, latency, and system scalability.`,
        `B. Immediate elimination of all test suites to accelerate release.`,
        `C. Using the maximum possible number of third-party dependencies.`,
        `D. Hardcoding runtime configurations into static global constants.`
      ],
      correctAnswer: 'A',
      modelAnswer: `Option A provides the rigorous engineering criteria for evaluating an architectural redesign.`,
      concepts: ['evaluation', 'trade-offs'],
    },
  ];

  const questions = questionTemplates.map((t, i) => ({
    id: `offline_${i}_${Date.now()}`,
    question: t.question,
    type: 'mcq',
    options: t.options,
    bloomLevel: t.bloomLevel,
    difficulty: t.difficulty,
    concepts: t.concepts,
    correctAnswer: t.correctAnswer,
    modelAnswer: t.modelAnswer,
  }));

  const now = new Date().toISOString();
  return {
    questions, course, topic, courseTitle: courseTitle || topic || course || 'General',
    source: 'curriculum_fallback',
    generatedBy: 'template',
    model: 'fallback',
    pipelineVersion: 'v2',
    generatedAt: now,
    _source: 'curriculum_fallback',
  };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function evaluateAndClassify({ responses, topic, course, userId, weakAreas: userWeakAreas, strengths: userStrengths }) {
  const courseTitle = resolveCourseTitle(course || topic || '', course || topic || '');
  // Use agent-based evaluation combining LLM + keyword + basic evaluation
  // with Bloom/difficulty weighting and confidence scoring
  const agentResult = await evaluateAssessment({
    responses: responses.map(r => ({
      question: r.question,
      userAnswer: r.userAnswer || r.answer || '',
      correctAnswer: r.correctAnswer,
      modelAnswer: r.modelAnswer,
      concepts: r.concepts || [],
      bloomLevel: r.bloomLevel || 'understand',
      difficulty: r.difficulty || 'medium',
      type: r.type || 'mcq',
    })),
    course,
    topic: topic || course,
  });

  const strengths = [...new Set([...agentResult.strengths, ...(userStrengths || [])])].slice(0, 10);
  const weakAreas = [...new Set([...agentResult.weakAreas, ...(userWeakAreas || [])])].slice(0, 10);

  const result = {
    ...agentResult,
    strengths,
    weakAreas,
    topic: topic || course,
    course,
    courseTitle,
  };

  if (userId) {
    try {
      await AssessmentResult.create({
        userId, topic: topic || course || 'general', course,
        level: result.level,
        score: result.score,
        maxScore: result.maxScore,
        scorePercent: result.scorePercent,
        confidence: result.confidence,
        highestBloomLevel: result.highestBloomLevel,
        bloomProfile: result.bloomProfile,
        strengths, weakAreas,
        misconceptions: result.misconceptions,
        feedback: result.feedback,
        recommendation: result.recommendation,
        gradingDetails: result.gradingDetails,
      });

      await syncToKnowledgeState(userId, topic, { weakAreas, strengths, level: result.level });

      syncAssessmentToSkillTree(userId, course || topic || 'general', result.level, weakAreas, strengths)
        .catch(e => log.warn('KNOWLEDGE_ASSESS', `Skill tree sync: ${e.message}`));
    } catch (err) {
      log.warn('KNOWLEDGE_ASSESS', `Persist failed: ${err.message}`);
    }
  }

  return result;
}

async function syncToKnowledgeState(userId, topic, { weakAreas, strengths, level }) {
  const state = await StudentKnowledgeState.findOneAndUpdate(
    { userId },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const now = new Date();
  state.engagementMetrics.totalSessions = (state.engagementMetrics.totalSessions || 0) + 1;
  state.engagementMetrics.lastActiveDate = now;

  weakAreas.forEach(area => {
    const existing = state.concepts.find(c => c.conceptName.toLowerCase() === area.toLowerCase());
    if (existing) {
      existing.understandingLevel = 'struggling';
      existing.masteryScore = Math.min(existing.masteryScore || 50, 40);
    } else {
      state.concepts.push({
        conceptName: area, understandingLevel: 'struggling', masteryScore: 20,
        category: 'fundamental', difficulty: 'medium',
      });
    }
  });

  strengths.forEach(area => {
    const existing = state.concepts.find(c => c.conceptName.toLowerCase() === area.toLowerCase());
    if (existing) {
      existing.understandingLevel = 'mastered';
      existing.masteryScore = Math.max(existing.masteryScore || 0, 85);
    } else {
      state.concepts.push({
        conceptName: area, understandingLevel: 'comfortable', masteryScore: 85,
        category: 'intermediate', difficulty: 'low',
      });
    }
  });

  try { await state.save(); } catch (e) { log.warn('KNOWLEDGE_ASSESS', `KnowledgeState sync error: ${e.message}`); }
}



async function generateLearningReadiness(userId, topic) {
  try {
    const query = { userId };
    if (topic) query.topic = topic;
    const latest = await AssessmentResult.findOne(query).sort({ createdAt: -1 });

    if (!latest) {
      return {
        readiness: 'unknown',
        message: 'No assessment data available. Take a diagnostic assessment to determine readiness.',
        recommendations: [{ area: 'assessment', action: 'Take a diagnostic assessment', priority: 'high' }],
      };
    }

    const recommendations = [];
    if (latest.level === 'Beginner' || latest.level === 'Intermediate') {
      recommendations.push({ area: 'foundation', action: 'Review core concepts with structured lecture notes', priority: 'high' });
    }
    if (latest.highestBloomLevel === 'remember' || latest.highestBloomLevel === 'understand') {
      recommendations.push({ area: 'application', action: 'Practice with scenario-based questions', priority: 'medium' });
    }
    (latest.weakAreas || []).forEach(area => {
      recommendations.push({ area: 'knowledge_gap', action: `Review ${area} with targeted practice`, priority: 'high' });
    });
    recommendations.push({
      area: 'progression',
      action: latest.level === 'Beginner' ? 'Progress to Intermediate material' : 'Attempt advanced analysis questions',
      priority: 'medium',
    });

    return {
      readiness: latest.level !== 'Beginner' ? 'ready' : 'needs_preparation',
      currentLevel: latest.level,
      highestBloomLevel: latest.highestBloomLevel,
      lastAssessed: latest.createdAt,
      recommendations,
    };
  } catch (error) {
    log.error('KNOWLEDGE_ASSESS', `Readiness check failed: ${error.message}`);
    return { readiness: 'error', message: error.message, recommendations: [] };
  }
}

async function getAssessmentHistory(userId, topic) {
  const query = { userId };
  if (topic) query.topic = topic;
  const assessments = await AssessmentResult.find(query).sort({ createdAt: -1 }).limit(20).lean();

  const sorted = [...assessments].reverse();
  const trend = sorted.length >= 2 ? sorted[sorted.length - 1].scorePercent - sorted[0].scorePercent : null;

  return { assessments: sorted, trend };
}

async function syncAssessmentToSkillTree(userId, topic, level, weakAreas, strengths) {
  try {
    const SkillTree = require('../models/SkillTree');
    const GamificationProfile = require('../models/GamificationProfile');

    const matchedNodes = await SkillTree.find({
      $or: [
        { course: { $regex: topic, $options: 'i' } },
        { category: { $regex: topic, $options: 'i' } },
      ],
      isActive: true,
    }).lean();

    if (!matchedNodes || matchedNodes.length === 0) return;

    const profile = await GamificationProfile.findOne({ userId });
    if (!profile) return;

    matchedNodes.forEach(node => {
      const nodeId = node.skillId?.toLowerCase() || '';
      const nodeName = node.name?.toLowerCase() || '';
      const nodeCategory = node.category?.toLowerCase() || '';

      const isStrong = strengths.some(s => {
        const sl = s.toLowerCase();
        return nodeId.includes(sl) || nodeName.includes(sl) || nodeCategory.includes(sl);
      });
      const isWeak = weakAreas.some(w => {
        const wl = w.toLowerCase();
        return nodeId.includes(wl) || nodeName.includes(wl) || nodeCategory.includes(wl);
      });

      if (isStrong) {
        profile.skillMastery.set(node.skillId, Math.min(100, (profile.skillMastery.get(node.skillId) || 0) + 20));
        if (!profile.unlockedSkills.includes(node.skillId)) {
          profile.unlockedSkills.push(node.skillId);
        }
      } else if (isWeak) {
        profile.skillMastery.set(node.skillId, Math.max(0, (profile.skillMastery.get(node.skillId) || 0) - 10));
      } else if (level !== 'Beginner') {
        if (!profile.unlockedSkills.includes(node.skillId)) {
          profile.unlockedSkills.push(node.skillId);
        }
      }
    });

    profile.markModified('skillMastery');
    profile.markModified('unlockedSkills');
    await profile.save();
    log.info('KNOWLEDGE_ASSESS', `Skill tree synced: ${matchedNodes.length} nodes evaluated for ${topic}`);
  } catch (e) {
    log.warn('KNOWLEDGE_ASSESS', `Skill tree sync error: ${e.message}`);
  }
}

module.exports = {
  generateDiagnosticAssessment,
  evaluateAndClassify,
  generateLearningReadiness,
  getAssessmentHistory,
  syncAssessmentToSkillTree,
};
