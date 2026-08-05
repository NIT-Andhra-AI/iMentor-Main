const axios = require('axios');
const mongoose = require('mongoose');
const { redisClient } = require('../config/redisClient');
const log = require('../utils/logger');

async function runHealthCheck() {
  const results = [];

  results.push({ name: 'MongoDB', reachable: mongoose.connection.readyState === 1 });

  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      results.push({ name: 'Redis', reachable: true });
    } else {
      results.push({ name: 'Redis', reachable: false, error: 'client not open' });
    }
  } catch (e) {
    results.push({ name: 'Redis', reachable: false, error: e.message });
  }

  try {
    const neo4j = require('../config/neo4j');
    const result = await neo4j.runQuery('RETURN 1');
    results.push({ name: 'Neo4j', reachable: result.records.length > 0 });
  } catch (e) {
    results.push({ name: 'Neo4j', reachable: false, error: e.message });
  }

  // ── SGLang Health Checks ──
  const sglangUrl = process.env.SGLANG_CHAT_URL || 'http://localhost:8000/v1';
  const baseUrl = sglangUrl.replace(/\/chat\/completions\/?$/, '');
  const modelsUrl = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;

  try {
    const resp = await axios.get(modelsUrl, { timeout: 3000 });
    results.push({ name: 'SGLang (reachable)', reachable: true });
    const models = resp.data?.data?.map(m => m.id) || [];
    results.push({ name: 'SGLang (models)', reachable: true, note: `loaded models: ${models.join(', ')}` });

    // Test SGLang generation
    try {
      const testModel = process.env.SGLANG_CHAT_MODEL || 'QuantTrio/Qwen3.5-9B-AWQ';
      const genResp = await axios.post(`${baseUrl}/chat/completions`, {
        model: testModel,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
        temperature: 0
      }, { timeout: 3000 });
      const reply = genResp.data?.choices?.[0]?.message?.content?.trim();
      results.push({ name: 'SGLang (test gen)', reachable: true, note: `response: "${reply}"` });
    } catch (genErr) {
      results.push({ name: 'SGLang (test gen)', reachable: false, error: genErr.message });
    }
  } catch (e) {
    results.push({ name: 'SGLang', reachable: false, error: e.message });
  }

  if (process.env.GROQ_API_KEY) {
    results.push({ name: 'Groq', reachable: true, note: 'API key configured' });
  } else {
    results.push({ name: 'Groq', reachable: false, error: 'API key missing' });
  }

  if (process.env.GEMINI_API_KEY) {
    results.push({ name: 'Gemini', reachable: true, note: 'API key configured' });
  } else {
    results.push({ name: 'Gemini', reachable: false, error: 'API key missing' });
  }

  if (process.env.OPENAI_API_KEY) {
    results.push({ name: 'OpenAI', reachable: true, note: 'API key configured' });
  } else {
    results.push({ name: 'OpenAI', reachable: false, error: 'API key missing' });
  }

  return results;
}

async function logHealthSummary() {
  const results = await runHealthCheck();
  log.info('HEALTH', '===== STARTUP HEALTH CHECK =====');
  for (const r of results) {
    const icon = r.reachable ? '✓' : '✗';
    const detail = r.model ? `model=${r.model}` : r.error ? `error=${r.error}` : r.note || '';
    log.info('HEALTH', `  ${icon} ${r.name}${detail ? ' — ' + detail : ''}`);
  }
  log.info('HEALTH', '================================');
  return results;
}

module.exports = { runHealthCheck, logHealthSummary };
