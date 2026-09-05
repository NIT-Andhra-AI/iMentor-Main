/**
 * Security Middleware: Path & IP Sanitizer
 * Scrubs absolute server file paths (/home/sri/...), internal local IPs (127.0.0.1, localhost:2001),
 * stack traces, and internal code directory structures from all user-facing HTTP responses.
 */

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\/home\/[^\/]+\/[^\s\n"']+/g, '[Internal Path]')
    .replace(/\/tmp\/[^\s\n"']+/g, '[Temp Path]')
    .replace(/http:\/\/localhost:\d+/g, '[Service Endpoint]')
    .replace(/http:\/\/127\.0\.0\.1:\d+/g, '[Service Endpoint]')
    .replace(/127\.0\.0\.1:\d+/g, '[Local Endpoint]')
    .replace(/\b127\.0\.0\.1\b/g, '[Local IP]')
    .replace(/\blocalhost:\d+\b/g, '[Local Endpoint]')
    .replace(/mongodb:\/\/127\.0\.0\.1:\d+\/[^\s\n"']+/g, '[Database Connection]')
    .replace(/redis:\/\/127\.0\.0\.1:\d+/g, '[Cache Endpoint]');
}

function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      // Omit stack traces or internal server paths and local IPs in public JSON
      if (key === 'stack' || key === 'filePath' || key === 'absolutePath' || key === 'internalPath' || key === 'localIp' || key === 'internalIp') {
        continue;
      }
      cleaned[key] = sanitizeObject(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

function pathSanitizerMiddleware(req, res, next) {
  const originalJson = res.json;
  res.json = function (data) {
    const sanitizedData = sanitizeObject(data);
    return originalJson.call(this, sanitizedData);
  };
  next();
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  pathSanitizerMiddleware
};
