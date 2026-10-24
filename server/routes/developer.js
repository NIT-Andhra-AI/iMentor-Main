// server/routes/developer.js
const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const DeveloperApiLog = require('../models/DeveloperApiLog');
const log = require('../utils/logger');

function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || '172.180.14.125';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}/api/v1`;
}

const router = express.Router();

function generateSecureKey() {
  const randomHex = crypto.randomBytes(24).toString('hex');
  return `imk_live_${randomHex}`;
}

function maskKey(key) {
  if (!key || typeof key !== 'string') return null;
  if (key.length <= 14) return 'imk_live_***';
  return `${key.substring(0, 11)}...${key.slice(-4)}`;
}

// ── 1. Generate API Key ───────────────────────────────────────────────────────
router.post('/key/generate', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const newKey = generateSecureKey();
    user.developerApiKey = newKey;
    user.developerApiKeyCreatedAt = new Date();
    user.developerKeyStatus = 'active';
    await user.save();

    log.info('DEVELOPER', `User ${user.username} (${user._id}) generated new Developer API Key`);

    res.json({
      success: true,
      apiKey: newKey,
      maskedKey: maskKey(newKey),
      createdAt: user.developerApiKeyCreatedAt,
      status: user.developerKeyStatus,
      rateLimit: '60 requests / minute',
      baseUrl: getBaseUrl(req),
      message: 'Developer API Key generated successfully. Keep it secure!'
    });
  } catch (err) {
    log.error('DEVELOPER', `Error generating API Key: ${err.message}`);
    res.status(500).json({ message: 'Failed to generate API Key.', error: err.message });
  }
});

// ── 2. Refresh / Rotate API Key ───────────────────────────────────────────────
router.post('/key/refresh', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const newKey = generateSecureKey();
    user.developerApiKey = newKey;
    user.developerApiKeyCreatedAt = new Date();
    user.developerKeyStatus = 'active';
    await user.save();

    log.info('DEVELOPER', `User ${user.username} (${user._id}) refreshed Developer API Key`);

    res.json({
      success: true,
      apiKey: newKey,
      maskedKey: maskKey(newKey),
      createdAt: user.developerApiKeyCreatedAt,
      status: user.developerKeyStatus,
      rateLimit: '60 requests / minute',
      baseUrl: getBaseUrl(req),
      message: 'Developer API Key rotated successfully. Old key is immediately invalid.'
    });
  } catch (err) {
    log.error('DEVELOPER', `Error refreshing API Key: ${err.message}`);
    res.status(500).json({ message: 'Failed to refresh API Key.', error: err.message });
  }
});

// ── 3. Reveal / Copy Full Key ─────────────────────────────────────────────────
router.get('/key/reveal', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (!user.developerApiKey || user.developerKeyStatus !== 'active') {
      return res.status(404).json({ message: 'No active API Key found. Please generate one.' });
    }

    res.json({
      apiKey: user.developerApiKey,
      status: user.developerKeyStatus,
      createdAt: user.developerApiKeyCreatedAt
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve API key.', error: err.message });
  }
});

// ── 4. Key Status & Quota ─────────────────────────────────────────────────────
router.get('/key/status', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const hasKey = Boolean(user.developerApiKey && user.developerKeyStatus === 'active');
    
    // Aggregate recent stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await DeveloperApiLog.countDocuments({
      userId: user._id,
      timestamp: { $gte: todayStart }
    });

    const lastLog = await DeveloperApiLog.findOne({ userId: user._id }).sort({ timestamp: -1 });

    res.json({
      hasKey,
      maskedKey: maskKey(user.developerApiKey),
      createdAt: user.developerApiKeyCreatedAt,
      status: user.developerKeyStatus || 'none',
      apiRateLimitTier: user.apiRateLimitTier || 'standard',
      totalApiRequests: user.totalApiRequests || 0,
      todayRequests: todayCount,
      lastActive: lastLog ? lastLog.timestamp : null,
      baseUrl: getBaseUrl(req),
      supportedEndpoints: [
        '/api/v1/chat/completions (OpenAI SDK / Python / Java / cURL)',
        '/api/v1/messages (Claude SDK)',
        '/api/v1/models'
      ]
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch API key status.', error: err.message });
  }
});

// ── 5. Revoke Key ─────────────────────────────────────────────────────────────
router.delete('/key/revoke', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.developerKeyStatus = 'revoked';
    await user.save();

    log.info('DEVELOPER', `User ${user.username} (${user._id}) revoked Developer API Key`);
    res.json({ success: true, message: 'Developer API Key revoked successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to revoke API key.', error: err.message });
  }
});

// ── 6. Paginated Request & Telemetry Logs ─────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    
    const [logs, total] = await Promise.all([
      DeveloperApiLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeveloperApiLog.countDocuments(query)
    ]);

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch developer logs.', error: err.message });
  }
});

module.exports = router;
