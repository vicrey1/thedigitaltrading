// utils/logger.js

const debug = process.env.NODE_ENV !== 'production';

const logger = {
  info: (...args) => {
    console.log(`[INFO] ${new Date().toISOString()}:`, ...args);
  },

  error: (...args) => {
    console.error(`[ERROR] ${new Date().toISOString()}:`, ...args);
  },

  debug: (...args) => {
    if (debug) {
      console.log(`[DEBUG] ${new Date().toISOString()}:`, ...args);
    }
  },

  request: (req, prefix = '') => {
    if (debug) {
      console.log(`[REQUEST] ${prefix} ${req.method} ${req.originalUrl}`);
      console.log('  Headers:', JSON.stringify(req.headers, null, 2));
      if (req.body && Object.keys(req.body).length) {
        console.log('  Body:', JSON.stringify(req.body, null, 2));
      }
    }
  },

  response: (statusCode, data, prefix = '') => {
    if (debug) {
      console.log(`[RESPONSE] ${prefix} Status: ${statusCode}`);
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
  }
};

module.exports = logger;