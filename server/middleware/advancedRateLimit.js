const rateLimit = require('express-rate-limit');
const { createClient } = require('redis');

// Redis client for distributed rate limiting (optional)
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
}

// IP-based rate limiting with different tiers
const createIPRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => {
      // Use X-Forwarded-For header if behind proxy, otherwise use connection IP
      return req.ip || req.connection.remoteAddress;
    }
  });
};

// Authentication-specific rate limiting
const authRateLimit = createIPRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per IP
  'Too many authentication attempts. Please try again later.',
  true // Skip successful requests
);

// Registration rate limiting
const registrationRateLimit = createIPRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 registrations per IP per hour
  'Too many registration attempts. Please try again later.'
);

// Password reset rate limiting
const passwordResetRateLimit = createIPRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 password reset attempts per hour
  'Too many password reset attempts. Please try again later.'
);

// API general rate limiting
const apiRateLimit = createIPRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per 15 minutes
  'Too many API requests. Please slow down.'
);

// Strict rate limiting for sensitive operations
const sensitiveOperationsRateLimit = createIPRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 sensitive operations per hour
  'Too many sensitive operations. Please try again later.'
);

// File upload rate limiting
const fileUploadRateLimit = createIPRateLimit(
  10 * 60 * 1000, // 10 minutes
  20, // 20 uploads per 10 minutes
  'Too many file uploads. Please wait before uploading again.'
);

// User-specific rate limiting (requires authentication)
const createUserRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id || req.ip;
    }
  });
};

// Investment operations rate limiting
const investmentRateLimit = createUserRateLimit(
  60 * 60 * 1000, // 1 hour
  5, // 5 investment operations per user per hour
  'Too many investment operations. Please wait before trying again.'
);

// Withdrawal operations rate limiting
const withdrawalRateLimit = createUserRateLimit(
  24 * 60 * 60 * 1000, // 24 hours
  3, // 3 withdrawal attempts per user per day
  'Too many withdrawal attempts. Please try again tomorrow.'
);

// Advanced abuse detection middleware
const abuseDetection = (req, res, next) => {
  const suspiciousPatterns = [
    // Check for rapid sequential requests
    req.headers['user-agent']?.includes('bot'),
    req.headers['user-agent']?.includes('crawler'),
    req.headers['user-agent']?.includes('spider'),
    // Check for missing common headers
    !req.headers['accept'],
    !req.headers['accept-language'],
    // Check for suspicious request patterns
    req.url.includes('..'),
    req.url.includes('<script>'),
    req.url.includes('SELECT'),
    req.url.includes('UNION')
  ];

  const suspiciousCount = suspiciousPatterns.filter(Boolean).length;
  
  if (suspiciousCount >= 3) {
    console.warn(`[ABUSE DETECTION] Suspicious request from ${req.ip}: ${req.method} ${req.url}`);
    return res.status(429).json({ 
      error: 'Request blocked due to suspicious activity',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// DDoS protection middleware
const ddosProtection = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute per IP
  message: { error: 'Too many requests. Possible DDoS detected.' },
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    console.error(`[DDOS PROTECTION] Rate limit exceeded for IP: ${req.ip}`);
  }
});

module.exports = {
  authRateLimit,
  registrationRateLimit,
  passwordResetRateLimit,
  apiRateLimit,
  sensitiveOperationsRateLimit,
  fileUploadRateLimit,
  investmentRateLimit,
  withdrawalRateLimit,
  abuseDetection,
  ddosProtection,
  createIPRateLimit,
  createUserRateLimit
};