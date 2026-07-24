<<<<<<< HEAD
// server/routes/skilltreeCourseMatching.js
// Dedicated routes for course search bar + CSV upload matching.
// No modifications to existing SkillTree generation routes.

=======
>>>>>>> pr-2
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('../middleware/authMiddleware');
<<<<<<< HEAD
const log = require('../utils/logger');
=======
>>>>>>> pr-2

const skilltreeCourseMatchingService = require('../services/skilltreeCourseMatchingService');
const SkillTreeCsvUploadSnapshot = require('../models/SkillTreeCsvUploadSnapshot');

<<<<<<< HEAD
const REPORT_PATH = path.join(__dirname, '..', '..', 'curriculum_reports', 'skilltree_course_matching_report.json');
=======
const REPORT_DIR = path.join(__dirname, '..', '..', 'curriculum_reports');
const REPORT_PATH = path.join(REPORT_DIR, 'skilltree_course_matching_report.json');

// Ensure reports directory exists
try {
    if (!fs.existsSync(REPORT_DIR)) {
        fs.mkdirSync(REPORT_DIR, { recursive: true });
    }
} catch (e) {
    // Non-critical — directory may already exist
}
>>>>>>> pr-2

function writeReport(report) {
  try {
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  } catch (e) {
<<<<<<< HEAD
    // best-effort; do not fail request
  }
}

// @route   POST /api/course-matching/upload
// @desc    Accept CSV upload (multipart) OR CSV text payload and return match decision.
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
    const requestId = `REQ-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    console.log(`[${requestId}] [USER_CONTEXT]`, JSON.stringify({
        userId: String(userId || ''),
        role: req.user?.isAdmin ? 'admin' : 'student',
        email: req.user?.email || ''
    }));
    console.log(`[${requestId}] [CSV UPLOAD] request received`);
    console.log(`[${requestId}] [CSV UPLOAD] uploadedFileName=`, req.body?.uploadedFileName || null);
=======
  }
}

router.post('/course-matching/upload', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id;
>>>>>>> pr-2

    let csvText = '';

    if (req.body?.csvText) {
      csvText = req.body.csvText;
    }

    if (!csvText && req.file?.buffer) {
      csvText = req.file.buffer.toString('utf8');
    } else if (!csvText && req.file?.path) {
      csvText = fs.readFileSync(req.file.path, 'utf8');
    }

    if (!csvText) {
      return res.status(400).json({ message: 'csvText or uploaded file is required' });
    }

    const existingCourseNames = Array.isArray(req.body?.existingCourseNames) ? req.body.existingCourseNames : [];
    const existingSkillTreeTopics = Array.isArray(req.body?.existingSkillTreeTopics) ? req.body.existingSkillTreeTopics : [];

<<<<<<< HEAD
    console.log(`[${requestId}] [CSV UPLOAD] csvText length=`, csvText?.length || 0);
    console.log(`[${requestId}] [CSV UPLOAD] existingCourseNames count=`, existingCourseNames?.length || 0);
    console.log(`[${requestId}] [CSV UPLOAD] existingSkillTreeTopics count=`, existingSkillTreeTopics?.length || 0);

    // First, validate CSV structure and extract topics
=======
    const match = await skilltreeCourseMatchingService.matchUploadedCsvToExistingTopics({
      csvText,
      existingCourseNames,
      existingSkillTreeTopics,
      userId,
    });
>>>>>>> pr-2
    const uploadValidation = skilltreeCourseMatchingService.validateCsvUploadStructure(csvText);

    if (uploadValidation.validRows === 0) {
      return res.status(400).json({
        message: 'CSV validation failed',
        uploadReport: {
          validRows: uploadValidation.validRows,
          invalidRows: uploadValidation.invalidRows,
          duplicates: uploadValidation.duplicates,
          warnings: uploadValidation.warnings
        }
      });
    }

<<<<<<< HEAD
    // Pre-extract topics to populate snapshot BEFORE matching (fixes first-upload cold start)
    const rawExtracted = await skilltreeCourseMatchingService.extractTopicsFromCsvText(csvText);
    const preExtractedTopics = skilltreeCourseMatchingService.cleanCurriculumTopics(rawExtracted) || [];
    const canonicalTopic = skilltreeCourseMatchingService.firstRealCurriculumTopic(preExtractedTopics) || '';

    // Seed a snapshot for the current upload BEFORE matching, so the matching
    // service can find its own topics on the first upload attempt.
    if (canonicalTopic && !skilltreeCourseMatchingService.isInvalidSnapshotCanonical?.(canonicalTopic)) {
      try {
        await SkillTreeCsvUploadSnapshot.create({
          userId,
          canonicalTopic,
          extractedTopics: preExtractedTopics,
          courseName: req.body?.courseName || canonicalTopic,
          topic: req.body?.topic || canonicalTopic,
          createdAt: new Date()
        });
        log.debug('CSV_UPLOAD', `Seeded snapshot for "${canonicalTopic}" (${preExtractedTopics.length} topics) before matching`);
      } catch (seedErr) {
        log.warn('CSV_UPLOAD', `Snapshot seed skipped: ${seedErr.message}`);
      }
    }

    const match = await skilltreeCourseMatchingService.matchUploadedCsvToExistingTopics({
      csvText,
      existingCourseNames,
      existingSkillTreeTopics,
      userId,
    });

=======
>>>>>>> pr-2
    const extractedTopics = Array.isArray(match.extractedTopics) ? match.extractedTopics : [];
    const matchedConcepts = Array.isArray(match.matchedConcepts) && match.matchedConcepts.length > 0
      ? match.matchedConcepts
      : (match.matchedCandidate ? [match.matchedCandidate] : []);
<<<<<<< HEAD
    let matchPercentage = match.matchPercentage;
    let reusedSkillTreeDecision = match.reusedSkillTreeDecision;

    // Override: if the user specified a courseName that doesn't match any known
    // course/subject in the system, force generate_new (topic-level matches
    // on generic terms like "Intro" should not trigger reuse).
    const providedCourseName = (req.body?.courseName || '').trim();
    if (providedCourseName && reusedSkillTreeDecision === 'reuse_existing') {
      let knownNames = (req.body?.existingCourseNames || []).map(s => s.toLowerCase());
      if (knownNames.length === 0) {
        try {
          const fs = require('fs');
          const path = require('path');
          const inventoryPath = path.join(__dirname, '..', '..', 'curriculum_reports', 'curriculum_inventory.json');
          if (fs.existsSync(inventoryPath)) {
            const raw = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
            const inventoryCourses = Array.isArray(raw.courses) ? raw.courses : [];
            knownNames = inventoryCourses.map(c => (c.name || c.courseName || c.courseCode || '').toLowerCase()).filter(Boolean);
          }
          if (knownNames.length === 0) {
            const bootstrapDir = path.join(__dirname, '..', '..', 'server', 'course_bootstrap');
            if (fs.existsSync(bootstrapDir)) {
              knownNames = fs.readdirSync(bootstrapDir).filter(e => {
                const fp = path.join(bootstrapDir, e);
                return fs.statSync(fp).isDirectory() && !e.startsWith('.');
              }).map(s => s.toLowerCase());
            }
          }
        } catch (fsErr) {
          log.warn('CSV_MATCHING', `Could not load known course names: ${fsErr.message}`);
        }
      }
      const isKnownCourse = knownNames.includes(providedCourseName.toLowerCase());
      if (!isKnownCourse) {
        reusedSkillTreeDecision = 'generate_new';
        matchPercentage = 0;
        log.info('CSV_MATCHING', `Course "${providedCourseName}" not in known subjects; overriding to generate_new`);
      }
    }

    console.log(`[${requestId}] [CSV PARSER VERIFY]`, {
      lectureTopicCount: extractedTopics.length,
      firstTenTopics: extractedTopics.slice(0, 10),
    });

    console.log(`[${requestId}] [CSV UPLOAD] extractedTopics=`, extractedTopics);
    console.log(`[${requestId}] [CSV UPLOAD] matchedConcepts=`, matchedConcepts);
    console.log(`[${requestId}] [CSV UPLOAD] matchPercentage=`, matchPercentage);
    console.log(`[${requestId}] [CSV UPLOAD] reusedSkillTreeDecision=`, reusedSkillTreeDecision);

    if (!extractedTopics || extractedTopics.length === 0) {
      console.log(`[${requestId}] [CSV UPLOAD] WARNING: no topics extracted from CSV`);
    }
=======
    const matchPercentage = match.matchPercentage;
    const reusedSkillTreeDecision = match.reusedSkillTreeDecision;
>>>>>>> pr-2

    const report = {
      uploadedFileName: req.body?.uploadedFileName || null,
      extractedTopics,
      matchedConcepts,
<<<<<<< HEAD
      matchPercentage: matchPercentage,
      reusedSkillTreeDecision: reusedSkillTreeDecision,
=======
      matchPercentage: match.matchPercentage,
      reusedSkillTreeDecision: match.reusedSkillTreeDecision,
>>>>>>> pr-2
      uploadReport: {
        validRows: uploadValidation.validRows,
        invalidRows: uploadValidation.invalidRows,
        duplicates: uploadValidation.duplicates,
        warnings: uploadValidation.warnings
      },
      meta: {
        userId,
        generatedAt: new Date().toISOString(),
        threshold: 80,
      }
    };

<<<<<<< HEAD
    // Persist snapshot for later CFP usage (do not change response contract)
=======
>>>>>>> pr-2
    try {
      const canonicalTopic = skilltreeCourseMatchingService.firstRealCurriculumTopic(extractedTopics);

      const courseNameAlias = (req.body?.courseName || req.body?.canonicalTopic || req.body?.topic || '').trim();
      const topicAliases = [...new Set([
        canonicalTopic,
        courseNameAlias,
        (req.body?.topic || '').trim(),
      ].filter(Boolean))];

<<<<<<< HEAD
      if (!canonicalTopic || skilltreeCourseMatchingService.isInvalidSnapshotCanonical(canonicalTopic)) {
        console.warn('[SNAPSHOT SAVE] skipped — no valid curriculum canonicalTopic', {
          firstFiveTopics: extractedTopics.slice(0, 5),
        });
        throw new Error('No valid curriculum canonicalTopic');
      }

      console.log('[SNAPSHOT SAVE]', {
        canonicalTopic,
        firstFiveTopics: extractedTopics.slice(0, 5)
      });

      console.log('[CSV_OWNER]', JSON.stringify({
        snapshotOwner: String(userId || ''),
        requestUser: String(userId || ''),
        canonicalTopic
      }));

      if (canonicalTopic) {
=======
      if (canonicalTopic && !skilltreeCourseMatchingService.isInvalidSnapshotCanonical(canonicalTopic)) {
>>>>>>> pr-2
        const snapshotPayload = {
          userId,
          canonicalTopic,
          topicAliases,
          extractedTopics,
          matchedConcepts,
          matchPercentage: report.matchPercentage,
          reusedSkillTreeDecision: report.reusedSkillTreeDecision,
        };

        await SkillTreeCsvUploadSnapshot.create(snapshotPayload);

        const existing = await SkillTreeCsvUploadSnapshot.find({ userId, canonicalTopic })
          .sort({ createdAt: -1 }).lean();
        if (existing.length > 5) {
          const toDelete = existing.slice(5).map(d => d._id);
          await SkillTreeCsvUploadSnapshot.deleteMany({ _id: { $in: toDelete } });
        }
      }
    } catch (persistErr) {
      console.warn('[SNAPSHOT SAVE] persist failed:', persistErr?.message || persistErr);
    }

    writeReport(report);

    res.json(report);
  } catch (err) {
<<<<<<< HEAD
    log.error('CSV_MATCHING', `Course matching failed: ${err.message}${err.stack ? '\n' + err.stack : ''}`);
    res.status(500).json({
      success: false,
      message: err?.message || 'Course matching failed',
      stage: 'course_matching',
      details: {
        error: err?.message || 'Unknown error',
        stack: err?.stack || ''
      }
    });
  }
});

=======
    res.status(500).json({ message: 'Course matching failed', error: err?.message });
  }
});

router.post('/course-matching/validate', authMiddleware, async (req, res) => {
  const courseName = req.body?.courseName;
  if (!courseName || !String(courseName).trim()) {
    return res.status(400).json({ message: 'courseName is required' });
  }

  const qNorm = String(courseName).trim().toLowerCase();

  const inventoryPath = path.join(__dirname, '..', '..', 'curriculum_reports', 'curriculum_inventory.json');
  let inventory = { courses: [] };
  try {
    if (fs.existsSync(inventoryPath)) {
      inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    }
  } catch (e) {
  }

  const courses = (Array.isArray(inventory?.courses) ? inventory.courses : [])
    .map(c => c.courseName || c.name || '').filter(Boolean);

  const exact = courses.find(c => c.toLowerCase() === qNorm);
  if (exact) {
    return res.json({ status: 'exact', canonical: exact, suggestions: [] });
  }

  const alias = courses.find(c => c.toLowerCase().includes(qNorm) || qNorm.includes(c.toLowerCase()));
  if (alias) {
    return res.json({ status: 'alias', canonical: alias, suggestions: [] });
  }

  const suggestions = courses
    .filter(c => c.toLowerCase().includes(qNorm) || qNorm.includes(c.toLowerCase()))
    .slice(0, 6);

  res.json({ status: suggestions.length ? 'suggestions' : 'other', canonical: null, suggestions });
});

router.get('/course-matching/autocomplete', authMiddleware, async (req, res) => {
  const q = req.query?.q;
  if (!q || String(q).trim().length < 3) {
    return res.json({ suggestions: [] });
  }

  const query = String(q).trim().toLowerCase();

  const inventoryPath = path.join(__dirname, '..', '..', 'curriculum_reports', 'curriculum_inventory.json');
  let inventory = { courses: [] };
  try {
    if (fs.existsSync(inventoryPath)) {
      inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    }
  } catch (e) {
  }

  const courseNames = Array.isArray(inventory?.courses) ? inventory.courses.map(c => c.courseName || c.name || '').filter(Boolean) : [];

  const scored = courseNames
    .map(name => {
      const lower = name.toLowerCase();
      let score = 0;
      if (lower.startsWith(query)) score = 1;
      else if (lower.includes(query)) score = 0.6;
      return { type: 'course', value: name, label: name, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  res.json({ suggestions: scored });
});

>>>>>>> pr-2
module.exports = router;
