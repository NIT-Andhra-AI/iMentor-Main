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

function sanitizeObject(obj, seen = new WeakSet(), depth = 0) {
  if (obj === null || obj === undefined) return obj;
  if (depth > 20) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (typeof obj !== 'object') return obj;

  // Handle Date, RegExp, Buffer, ObjectId
  if (obj instanceof Date || obj instanceof RegExp || (obj._bsontype && obj._bsontype === 'ObjectID')) {
    return obj;
  }

  // Prevent circular references
  if (seen.has(obj)) {
    return '[Circular]';
  }
  seen.add(obj);

  // If this is a Mongoose document or has toObject/toJSON, unwrap to plain object
  let target = obj;
  if (typeof target.toObject === 'function') {
    try {
      target = target.toObject();
    } catch (_) {}
  } else if (typeof target.toJSON === 'function') {
    try {
      target = target.toJSON();
    } catch (_) {}
  }

  if (Array.isArray(target)) {
    return target.map(item => sanitizeObject(item, seen, depth + 1));
  }

  const cleaned = {};
  for (const key of Object.keys(target)) {
    // Omit internal Mongoose private properties, stack traces, internal paths, and local IPs
    if (key.startsWith('$') || key === 'stack' || key === 'filePath' || key === 'absolutePath' || key === 'internalPath' || key === 'localIp' || key === 'internalIp') {
      continue;
    }
    cleaned[key] = sanitizeObject(target[key], seen, depth + 1);
  }
  return cleaned;
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
