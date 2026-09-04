const { z } = require('zod');
const log = require('../utils/logger');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.preprocess((val) => Number(val), z.number()).default(5006),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  ENCRYPTION_SECRET: z.string().min(32, "ENCRYPTION_SECRET must be at least 32 characters"),
  MONGO_URI: z.string().url("MONGO_URI must be a valid URL"),
  REDIS_URL: z.string().optional(),
  NEO4J_URI: z.string().optional(),
  QDRANT_URL: z.string().optional(),
  PYTHON_RAG_SERVICE_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    log.error('SYSTEM', '❌ Environment validation failed:');
    result.error.errors.forEach((err) => {
      log.error('SYSTEM', `   - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  
  // Extra warning if key credentials are not provided but features are enabled
  if (!process.env.GEMINI_API_KEY && process.env.SGLANG_ENABLED !== 'true') {
    log.warn('SYSTEM', '⚠️  Neither GEMINI_API_KEY is configured nor SGLANG_ENABLED=true. AI features will fail at runtime.');
  }

  log.success('SYSTEM', '✓ Environment variables validated successfully');
  return result.data;
}

module.exports = {
  validateEnv,
  env: process.env
};
