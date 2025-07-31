// middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Bulk operations rate limiter
exports.bulkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each admin to 5 bulk requests per window
  message: 'Too many bulk operations, please try again later',
  skip: req => req.admin?.role === 'superadmin' // Bypass for superadmins
});

// Export rate limiter
exports.exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each admin to 10 exports per hour
  message: 'Too many export requests, please try again later'
});