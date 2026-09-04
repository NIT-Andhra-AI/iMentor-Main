// server/middleware/apiKeyAuth.js
const User = require('../models/User');
const DeveloperApiLog = require('../models/DeveloperApiLog');
const log = require('../utils/logger');

// Simple sliding window in-memory rate limiter per API key (fallback if Redis is unavailable)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;     // 60 requests per minute

function parseDeviceFromUserAgent(ua) {
  if (!ua) return { os: 'Unknown', browser: 'API Client', platform: 'server', isMobile: false };
  
  const uaLower = ua.toLowerCase();
  let os = 'Unknown';
  let browser = 'Unknown';
  let isMobile = false;

  // OS Detection
  if (uaLower.includes('windows')) os = 'Windows';
  else if (uaLower.includes('macintosh') || uaLower.includes('mac os')) os = 'macOS';
  else if (uaLower.includes('android')) { os = 'Android'; isMobile = true; }
  else if (uaLower.includes('iphone') || uaLower.includes('ipad')) { os = 'iOS'; isMobile = true; }
  else if (uaLower.includes('linux')) os = 'Linux';

  // Client/Browser Detection
  if (uaLower.includes('python')) browser = 'Python SDK / Requests';
  else if (uaLower.includes('java') || uaLower.includes('okhttp') || uaLower.includes('apache-httpclient')) browser = 'Java Client';
  else if (uaLower.includes('curl')) browser = 'cURL';
  else if (uaLower.includes('postman')) browser = 'Postman';
  else if (uaLower.includes('edg/')) browser = 'Microsoft Edge';
  else if (uaLower.includes('chrome')) browser = 'Google Chrome';
  else if (uaLower.includes('safari') && !uaLower.includes('chrome')) browser = 'Safari';
  else if (uaLower.includes('firefox')) browser = 'Mozilla Firefox';
  else if (uaLower.includes('node-fetch') || uaLower.includes('axios')) browser = 'Node.js Client';
  else browser = ua.substring(0, 40);

  return {
    os,
    browser,
    platform: isMobile ? 'mobile' : 'desktop',
    isMobile,
    clientLanguage: 'en'
  };
}

async function verifyApiKey(req, res, next) {
  const startTime = Date.now();

  // 1. Extract API Key
  const authHeader = req.headers['authorization'];
  const customHeader = req.headers['x-api-key'];
  const queryKey = req.query.api_key;

  let apiKey = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7).trim();
  } else if (customHeader) {
    apiKey = customHeader.trim();
  } else if (queryKey) {
    apiKey = String(queryKey).trim();
  }

  if (!apiKey) {
    return res.status(401).json({
      error: {
        message: 'Missing API Key. Pass your key via "Authorization: Bearer imk_live_..." or header "x-api-key: imk_live_...". Generate one at https://61.0.228.124/profile',
        type: 'authentication_error',
        code: 'missing_api_key'
      }
    });
  }

  // 2. Lookup User
  try {
    const user = await User.findOne({ developerApiKey: apiKey, developerKeyStatus: 'active' });
    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Invalid or revoked API Key. Please visit your iMentor Profile to refresh or generate a new Developer Key.',
          type: 'authentication_error',
          code: 'invalid_api_key'
        }
      });
    }

    // 3. Rate Limiting (Sliding Window per API Key)
    const now = Date.now();
    const clientRecord = rateLimitMap.get(apiKey) || { timestamps: [] };
    clientRecord.timestamps = clientRecord.timestamps.filter(ts => (now - ts) < RATE_LIMIT_WINDOW_MS);

    const maxLimit = user.apiRateLimitTier === 'unlimited' ? 500 : RATE_LIMIT_MAX_REQUESTS;
    if (clientRecord.timestamps.length >= maxLimit) {
      return res.status(429).json({
        error: {
          message: `Rate limit exceeded (${maxLimit} requests/min). Please throttle your client.`,
          type: 'rate_limit_error',
          code: 'rate_limit_exceeded'
        }
      });
    }

    clientRecord.timestamps.push(now);
    rateLimitMap.set(apiKey, clientRecord);

    // 4. Extract Client Telemetry
    const clientIp = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
                     req.headers['x-real-ip'] ||
                     req.socket?.remoteAddress ||
                     req.ip ||
                     '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const device = parseDeviceFromUserAgent(userAgent);
    device.clientLanguage = (req.headers['accept-language'] || 'en').split(',')[0].trim();
    const origin = req.headers['origin'] || req.headers['referer'] || '';

    // Attach to request
    req.user = user;
    req.apiKey = apiKey;
    req.apiKeyPrefix = apiKey.length > 12 ? `${apiKey.substring(0, 10)}...${apiKey.slice(-4)}` : 'imk_live_***';
    req.clientIp = clientIp;
    req.deviceTelemetry = device;
    req.userAgentStr = userAgent;
    req.originStr = origin;
    req.apiStartTime = startTime;

    // Helper to log transaction asynchronously off the critical path
    req.logApiTransaction = ({ statusCode = 200, requestPayload = {}, responsePayload = {}, toolCalls = [], tokenUsage = {}, streamed = false, errorMessage = null }) => {
      setImmediate(async () => {
        try {
          const latencyMs = Date.now() - startTime;
          
          await DeveloperApiLog.create({
            userId: user._id,
            apiKeyPrefix: req.apiKeyPrefix,
            endpoint: req.originalUrl || req.url,
            httpMethod: req.method,
            statusCode,
            latencyMs,
            clientIp,
            userAgent,
            device,
            origin,
            requestPayload,
            responsePayload,
            toolCalls,
            tokenUsage: {
              promptTokens: tokenUsage.promptTokens || tokenUsage.prompt_tokens || 0,
              completionTokens: tokenUsage.completionTokens || tokenUsage.completion_tokens || 0,
              totalTokens: tokenUsage.totalTokens || tokenUsage.total_tokens || 0,
            },
            streamed,
            errorMessage,
            timestamp: new Date(),
          });

          // Increment total request counter on User
          await User.updateOne({ _id: user._id }, { $inc: { totalApiRequests: 1 } });
        } catch (logErr) {
          log.warn('DEVELOPER_API', `Async logging failed: ${logErr.message}`);
        }
      });
    };

    next();
  } catch (err) {
    log.error('DEVELOPER_API', `Auth error: ${err.message}`);
    return res.status(500).json({
      error: {
        message: 'Internal authorization error.',
        type: 'api_error',
        code: 'server_error'
      }
    });
  }
}

module.exports = { verifyApiKey, parseDeviceFromUserAgent };
