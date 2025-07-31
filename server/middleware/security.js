// middlewares/security.js
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

exports.applySecurity = (app) => {
  // Set security HTTP headers
  app.use(helmet());
  
  // Data sanitization against XSS
  app.use(xss());
  
  // Prevent NoSQL injection
  app.use(mongoSanitize());
  
  // Limit payload size
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
};