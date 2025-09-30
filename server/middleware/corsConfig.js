const cors = require('cors');

const allowedOrigins = [
  'https://thedigitaltrading.com',
  'https://www.thedigitaltrading.com',
  'http://localhost:3000',  // For local development
  'http://localhost:5173',   // For Vite dev server
  'https://thedigitaltrading.onrender.com'  // Render deployment URL
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      console.log('[CORS] Origin allowed:', origin || 'No origin');
      callback(null, true);
    } else {
      console.log('[CORS] Origin rejected:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache preflight requests for 10 minutes
};

module.exports = { corsOptions, allowedOrigins };