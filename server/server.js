// server/server.js — Unified Chat Repository (Team3 base + Team1-6 features)
const dotenv = require("dotenv");
const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath, override: true });

require('./instrument.js');
const { register, httpRequestDurationMicroseconds } = require('./utils/metrics');
const Sentry = require("@sentry/node");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // [Team1-6] Security headers
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize"); // [Team1-6] NoSQL injection prevention
const axios = require("axios");
const mongoose = require("mongoose");

// --- Custom Modules & Middleware ---
const connectDB = require("./config/db");
const { getLocalIPs } = require("./utils/networkUtils");
const { performAssetCleanup } = require("./utils/assetCleanup");
const { authMiddleware } = require("./middleware/authMiddleware");
const { adminAuthMiddleware } = require('./middleware/adminAuthMiddleware');
const { connectRedis } = require("./config/redisClient");
const log = require('./utils/logger');
const { checkEmailCredentials } = require('./services/emailService');
const { verifyCoursesIntegrity, invalidateCurriculumCaches } = require('./services/courseIntegrityService');
const { auditRedisUsage } = require('./services/redisAuditService');
const { closeConnection: closeNeo4j } = require("./config/neo4j"); // [Team1-6] Neo4j graceful shutdown
const { bootstrapCoursesOnStartup } = require('./services/startupCourseBootstrapService');
const {
  authLimiter,
  chatLimiter,
  researchLimiter,
  toolsLimiter,
  sttLimiter
} = require('./middleware/rateLimitMiddleware');

// --- Route Imports ---
const networkRoutes = require("./routes/network");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const chatRoutes = require("./routes/chat");
const uploadRoutes = require("./routes/upload");
const analysisRoutes = require("./routes/analysis");
const adminMasterRouter = require('./routes/index');
const subjectsRoutes = require("./routes/subjects");
const coursesRoutes = require("./routes/courses");
const generationRoutes = require("./routes/generationRoutes");
const exportRoutes = require("./routes/export");
const kgRoutes = require("./routes/kg");
const llmConfigRoutes = require("./routes/llmConfig");
const toolsRoutes = require("./routes/tools");
const learningRoutes = require("./routes/learning");
const learningPathRoutes = require("./routes/learningPath");
const knowledgeSourceRoutes = require("./routes/knowledgeSource");
const analyticsRoutes = require('./routes/analytics');
const feedbackRoutes = require('./routes/feedback');
const finetuningRoutes = require('./routes/finetuning');
const gamificationRoutes = require('./routes/gamification');
const skilltreeCourseMatchingRoutes = require('./routes/skilltreeCourseMatching');
const knowledgeStateRoutes = require('./routes/knowledgeState');
const filesRoutes = require('./routes/files');
const researchRoutes = require('./routes/research');
const debugRoutes = require('./routes/debug');
const guestChatRoutes = require('./routes/guestChat');
const deepResearchRoutes = require('./routes/deepResearch'); // [Team1-6] Deep research
const tutorRoutes = require('./routes/tutorRoutes'); // Socratic tutor & curriculum routes
const socraticRoutes = require('./routes/socratic'); // [Team1-6] Socratic sessions
const studyModeRoutes = require('./routes/studyMode'); // Study questions + skill tree
const skillTreeGeneratorRoutes = require('./routes/skillTreeGenerator');
const quizRoutes = require('./routes/quiz'); // [Team1] Quiz system with knowledge gap analysis
const adaptiveProfileRoutes = require('./routes/adaptiveProfile'); // [Team8] Adaptive learning profiles
const { setupAdmin } = require('./scripts/setupAdmin');

// --- Course Material File Watcher ---
const chokidar = require('chokidar');

// --- Cron Jobs ---
const { startBossBattleCleanup } = require('./jobs/bossBattleCleanup');
const { startBossBattleGenerator } = require('./jobs/bossBattleGenerator');
const { startBountyCleanup } = require('./jobs/bountyCleanup');
const { startBountyGenerator } = require('./jobs/bountyGenerator');
const { startSpacedRepetitionScheduler } = require('./jobs/spacedRepetitionScheduler');

const ENABLE_CRON = process.env.ENABLE_CRON !== 'false';

// --- Configuration & Express App Setup ---
const port = process.env.PORT || 5006;
const mongoUri = process.env.MONGO_URI;
const pythonRagUrl = process.env.PYTHON_RAG_SERVICE_URL;

const cpursesDir = path.join(__dirname, 'Cpurses');

/** Call RAG service to ingest any new PDFs in Cpurses/ — fires on startup and on file additions. */
async function triggerCpursesIngestion(reason = 'startup') {
  if (!pythonRagUrl) return;
  try {
    const resp = await axios.post(`${pythonRagUrl}/ingest/cpurses`, {}, { timeout: 10000 });
    log.info('SYSTEM', `Course PDF ingestion triggered (${reason}): ${JSON.stringify(resp.data)}`);
  } catch (e) {
    log.warn('SYSTEM', `Course PDF ingestion trigger failed (${reason}): ${e.message}`);
  }
}

/**
 * Trigger the full course material pipeline (PDF→Markdown→Qdrant→STN→STN Qdrant)
 * via the Python RAG service.  Runs in background, is resumable on restart.
 */
async function triggerMaterialPipeline(reason = 'startup') {
  if (!pythonRagUrl) return;
  try {
    const resp = await axios.post(`${pythonRagUrl}/pipeline/run`, {}, { timeout: 15000 });
    log.info('SYSTEM', `Material pipeline triggered (${reason}): ${JSON.stringify(resp.data)}`);
  } catch (e) {
    log.warn('SYSTEM', `Material pipeline trigger failed (${reason}): ${e.message}`);
  }
}

/** Watch Cpurses/ AND course_bootstrap/ for new PDF files and re-trigger pipelines. */
const bootstrapDir = path.join(__dirname, 'course_bootstrap');

function startCourseFileWatchers() {
  const watchDirs = [];
  if (fs.existsSync(cpursesDir)) watchDirs.push(cpursesDir);
  if (fs.existsSync(bootstrapDir)) watchDirs.push(bootstrapDir);

  if (watchDirs.length === 0) {
    log.warn('SYSTEM', 'No course directories found — file watchers not started.');
    return;
  }

  let debounceTimer = null;
  const watcher = chokidar.watch(watchDirs, {
    ignored: /(^|[/\\])[\._]|_processed|_markdown|_markdown_backup|_stn_backup/,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 3000, pollInterval: 500 },
  });
  watcher.on('add', (filePath) => {
    if (!filePath.toLowerCase().endsWith('.pdf')) return;
    log.info('SYSTEM', `New course PDF detected: ${filePath}`);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Trigger both: Cpurses ingestion + full pipeline for course_bootstrap
      triggerCpursesIngestion('file-watcher');
      triggerMaterialPipeline('file-watcher');
    }, 5000);
  });
  log.info('SYSTEM', `Course file watchers started on: ${watchDirs.join(', ')}`);
}

const { validateEnv } = require('./config/env');
validateEnv();

const app = express();

// --- Security Middleware Stack [Team1-6] ---
app.use(compression()); // Gzip compression for all API responses
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "connect-src": ["'self'", "ws:", "wss:", "http:", "https:"],
      },
    },
  })
);
app.use(mongoSanitize()); // Prevent NoSQL injection

const configuredFrontendOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// If FRONTEND_PORT is given without a full FRONTEND_URL, also allow that port on localhost
const frontendPort = process.env.FRONTEND_PORT;
const portDerivedOrigins = frontendPort
  ? [`http://localhost:${frontendPort}`, `http://127.0.0.1:${frontendPort}`]
  : [];

const allowedOrigins = new Set([
  ...configuredFrontendOrigins,
  ...portDerivedOrigins,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

app.use((req, res, next) => {
  // Allow Chrome's Private Network Access (PNA) preflight for local dev
  if (req.method === 'OPTIONS' && req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
    if (allowedOrigins.has(origin) || isLocalDevOrigin) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ route: req.route?.path || req.path, code: res.statusCode, method: req.method });
  });
  next();
});

// --- API Route Mounting ---
app.get("/", (req, res) => res.send("AI Tutor Backend API is running..."));
app.use("/api/health", require('./routes/healthRoutes'));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// --- Public Routes & Static Course Assets ---
app.use('/course_bootstrap', express.static(path.join(__dirname, '..', 'course_bootstrap')));
app.use("/api/network", networkRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/guest", chatLimiter, guestChatRoutes); // [Optimization] Rate-limit unauthenticated chat

// --- Admin Routes (Uses its own adminAuthMiddleware) ---
app.use('/api/admin/analytics', adminAuthMiddleware, analyticsRoutes);
app.use('/api/admin/finetuning', adminAuthMiddleware, finetuningRoutes);
app.use('/api/admin/gamification', adminAuthMiddleware, require('./routes/adminGamification'));
app.use("/api/admin", adminAuthMiddleware, adminMasterRouter);

// --- Student Developer & Public API Engine (OpenAI & Claude Compatible) ---
app.use("/api/developer", authMiddleware, require("./routes/developer"));
app.use("/api/v1", require("./routes/developerApi"));

// --- Protected User Routes (Requires standard authMiddleware) ---
// The authMiddleware is now passed as the second argument, applying it specifically to these routers.
app.use("/api/user", authMiddleware, userRoutes);
app.use("/api/chat", authMiddleware, chatLimiter, chatRoutes);
app.use("/api/upload", authMiddleware, uploadRoutes);
app.use("/api/files", authMiddleware, filesRoutes);
app.use("/api/analysis", authMiddleware, analysisRoutes);
app.use("/api/subjects", authMiddleware, subjectsRoutes);
app.use("/api/courses", authMiddleware, coursesRoutes);
app.use("/api/generate", authMiddleware, toolsLimiter, generationRoutes); // [Optimization] Rate-limit LLM generation
app.use("/api/export", authMiddleware, exportRoutes);
app.use("/api/kg", authMiddleware, kgRoutes);
app.use("/api/llm", authMiddleware, llmConfigRoutes);
app.use("/api/tools", authMiddleware, toolsLimiter, toolsRoutes);
app.use("/api/learning", authMiddleware, learningRoutes);
app.use("/api/learning/paths", authMiddleware, learningPathRoutes);
app.use("/api/knowledge-sources", authMiddleware, knowledgeSourceRoutes);
app.use('/api/feedback', authMiddleware, feedbackRoutes);
app.use('/api/gamification', authMiddleware, gamificationRoutes);
app.use('/api/skill-tree', authMiddleware, skillTreeGeneratorRoutes);
app.use('/api/course-matching', authMiddleware, require('./routes/index_skilltreeCourseMatching'));
app.use('/api/skill-tree', authMiddleware, require('./routes/skillTreeCourseBridge'));
app.use('/api/gamification/skill-tree', authMiddleware, skilltreeCourseMatchingRoutes);

// --- Internal Service Routes (Python → Node.js callbacks, no JWT required) ---
const { syncSkillTreeToMongo } = require('./services/skillTreeSyncService');
app.post('/api/internal/skill-tree/sync', (req, res, next) => {
    // Simple shared-secret auth for internal service-to-service calls
    const token = req.header('X-Internal-Token') || req.header('Authorization')?.replace('Bearer ', '');
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    if (expected && token !== expected) {
        return res.status(403).json({ message: 'Invalid internal service token.' });
    }
    next();
}, async (req, res) => {
    try {
        const { course, skill_tree } = req.body;
        if (!course || !skill_tree || !Array.isArray(skill_tree)) {
            return res.status(400).json({ message: 'Missing course or skill_tree array.' });
        }
        log.info('SYSTEM', `Skill tree sync from Python for '${course}' — ${skill_tree.length} nodes`);
        const result = await syncSkillTreeToMongo(course, skill_tree);
        log.success('SYSTEM', `Skill tree synced: ${result.created} created, ${result.updated} updated`);
        res.json({ success: true, ...result });
    } catch (error) {
        log.error('SYSTEM', `Skill tree sync error: ${error.message}`);
        res.status(500).json({ message: 'Skill tree sync failed.' });
    }
});
app.use('/api/knowledge-state', authMiddleware, knowledgeStateRoutes);
app.use('/api/research', authMiddleware, researchLimiter, researchRoutes);
app.use('/api/deep-research', authMiddleware, researchLimiter, deepResearchRoutes); // [Team1-6] Deep research
app.use('/api/tutor', authMiddleware, chatLimiter, tutorRoutes);
app.use('/api/chat/tutor', authMiddleware, chatLimiter, tutorRoutes);
app.use('/api/socratic', authMiddleware, chatLimiter, socraticRoutes);
app.use('/api/study-mode', authMiddleware, studyModeRoutes); // Study questions + skill tree
app.use('/api/debug', authMiddleware, debugRoutes);
app.use('/api/progress', authMiddleware, require('./routes/progress'));
app.use('/api/jobs', authMiddleware, require('./routes/jobs'));
app.use('/api/quiz', authMiddleware, chatLimiter, quizRoutes); // [Team1] Quiz generation, submission & grading
app.use('/api/question-bank', authMiddleware, require('./routes/questionBank')); // Question Bank CRUD
app.use('/api/adaptive-profile', authMiddleware, adaptiveProfileRoutes); // [Team8] Student adaptive learning profiles
app.use('/api/assessment', authMiddleware, require('./routes/knowledgeAssessment')); // Knowledge Assessment Engine
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/placements', require('./routes/placementRoutes'));
app.use('/api/knowledge-state', authMiddleware, require('./routes/knowledgeState'));

// --- Sentry Error Handler ---
Sentry.setupExpressErrorHandler(app);

// --- Centralized Error Handling ---
app.use((err, req, res, next) => {
  log.error('SYSTEM', `Unhandled Error: ${err.message}`, err, `Check ${req.method} ${req.originalUrl}`);

  const statusCode = err.status || 500;
  const message = err.message || "An internal server error occurred.";
  if (!res.headersSent) {
    res.status(statusCode).json({ message });
  }
});

// --- Server Startup Logic ---
async function startServer() {
  log.info('SYSTEM', "Starting Server Initialization...");
  try {
    // Start HTTP server immediately so health checks pass instantly
    const server = app.listen(port, "0.0.0.0", () => {
      log.success('SYSTEM', `Server listening on port ${port}`);
    });

    // --- Initialize Socket.io ---
    const { initSocket } = require("./services/socketService");
    initSocket(server);
    log.success('SYSTEM', 'Socket.io initialized successfully');

    await setupAdmin(mongoUri);
    await ensureServerDirectories();
    await connectDB(mongoUri);
    await checkEmailCredentials();
    await connectRedis();

    // --- Start Health Revival Agent ---
    const healthRevivalAgent = require('./services/healthRevivalAgent');
    healthRevivalAgent.start();

    // Run remaining initializations in background
    setImmediate(async () => {
      await performAssetCleanup();
      await checkRagService(pythonRagUrl);
      const { checkOptionalServices } = require('./utils/startupServices');
      await checkOptionalServices();

      try {
        await bootstrapCoursesOnStartup({
          pythonServiceUrl: pythonRagUrl,
          bootstrapDir: path.join(__dirname, 'course_bootstrap'),
        });
      } catch (err) {
        log.warn('SYSTEM', `Startup bootstrap encountered non-fatal error: ${err.message}`);
      }

      await auditRedisUsage();

      try {
        const { logHealthSummary } = require('./services/startupHealthCheck');
        await logHealthSummary();
      } catch (e) {
        log.warn('HEALTH', `Health check failed: ${e.message}`);
      }

      startCourseFileWatchers();

      if (ENABLE_CRON) {
        startBountyGenerator();
        startBountyCleanup();
        startBossBattleGenerator();
        startBossBattleCleanup();
        startSpacedRepetitionScheduler();
      }

      const { initialize: initializeSemanticRouter } = require('./services/semanticRouter');
      initializeSemanticRouter()
        .then(() => log.success('SYSTEM', 'Semantic router initialized successfully'))
        .catch((err) => log.error('SYSTEM', `Semantic router initialization failed: ${err.message}`));
    });

    const gracefulShutdown = async (signal) => {
      log.info('SYSTEM', `${signal} received. Shutting down...`);
      server.close(async () => {
        try {
          await mongoose.connection.close();
          log.info('SYSTEM', "MongoDB connection closed.");
          await closeNeo4j(); // [Team1-6] Close Neo4j connection
          log.info('SYSTEM', "Neo4j connection closed.");
          process.exit(0);
        } catch (err) {
          log.error('SYSTEM', "Error closing connections", err);
          process.exit(1);
        }
      });
    };
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Global production error handlers
  process.on("unhandledRejection", (reason, promise) => {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      type: "UNHANDLED_REJECTION",
      reason: reason?.message || String(reason),
      stack: reason?.stack || null
    };
    log.error('SYSTEM', 'Unhandled Rejection (Non-fatal, isolating error)', errorDetails);
    try {
      fs.writeFileSync('/tmp/imentor_v2_last_unhandled_rejection.json', JSON.stringify(errorDetails, null, 2));
    } catch (_) {}
  });

  process.on("uncaughtException", (err) => {
    const errorDetails = {
      timestamp: new Date().toISOString(),
      type: "UNCAUGHT_EXCEPTION",
      message: err.message,
      code: err.code || null,
      stack: err.stack || null
    };
    log.error('SYSTEM', 'Uncaught Exception', errorDetails);
    try {
      fs.writeFileSync('/tmp/imentor_v2_last_crash.json', JSON.stringify(errorDetails, null, 2));
    } catch (_) {}

    const isFatal = err.code === 'EADDRINUSE' || err.code === 'MODULE_NOT_FOUND' || err.message?.includes('ENOMEM');
    if (isFatal) {
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    }
  });
  } catch (error) {
    log.error('SYSTEM', "Failed to start Node.js server", error);
    process.exit(1);
  }
}

// Helper functions
async function ensureServerDirectories() {
  const dirs = [
    path.join(__dirname, "assets"),
    path.join(__dirname, "backup_assets"),
    path.join(__dirname, "generated_docs"),
    path.join(__dirname, "course_bootstrap"),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) await fs.promises.mkdir(dir, { recursive: true });
  }
}

async function checkRagService(url) {
  if (!url) {
    log.warn('SYSTEM', "Python RAG service URL not configured.");
    return;
  }
  try {
    const response = await axios.get(`${url}/health`, { timeout: 7000 });
    if (response.data.status === "ok") {
      log.success('SYSTEM', "Python RAG service is available.");
    } else {
      log.warn('SYSTEM', `Python RAG service responded but is not healthy. Status: ${response.data.status}`);
    }
  } catch (error) {
    log.warn('SYSTEM', `Python RAG service is not reachable at ${url}.`);
  }
}

startServer();