// Vercel Serverless Function Entry Point
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import all routes
const authRoutes = require('../server/routes/auth');
const adminRoutes = require('../server/routes/admin');
const userRoutes = require('../server/routes/user');
const depositRoutes = require('../server/routes/deposit');
const withdrawalRoutes = require('../server/routes/withdrawal');
const investmentRoutes = require('../server/routes/investment');
const plansRoutes = require('../server/routes/plans');
const portfolioRoutes = require('../server/routes/portfolio');
const portfolioInvestRoutes = require('../server/routes/portfolio_invest');
const walletsRoutes = require('../server/routes/wallets');
const feesRoutes = require('../server/routes/fees');
const leaderboardRoutes = require('../server/routes/leaderboard');
const performanceRoutes = require('../server/routes/performance');
const supportChatRoutes = require('../server/routes/supportChat');
const uploadsRoutes = require('../server/routes/uploads');
const announcementUploadsRoutes = require('../server/routes/announcementUploads');
const aiChatRoutes = require('../server/routes/aiChat');
const blogRoutes = require('../server/routes/blog');
const eventRoutes = require('../server/routes/event');
const fundRoutes = require('../server/routes/fund');
const fundsRoutes = require('../server/routes/funds');
const goalsRoutes = require('../server/routes/goals');
const marketUpdatesRoutes = require('../server/routes/market-updates');
const newsRoutes = require('../server/routes/news');
const carsRoutes = require('../server/routes/cars');
const testRoutes = require('../server/routes/test');
const sendTestEmailRoutes = require('../server/routes/sendTestEmail');

// Import middleware
const { requestLogger, dbMetrics } = require('../server/middleware/monitoring');
const rateLimiter = require('../server/middleware/rateLimiter');
const securityHeaders = require('../server/middleware/securityHeaders');

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// CORS Configuration for Vercel
const allowedOrigins = [
  'https://www.thedigitaltrading.com',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
}));

// Security headers
app.use(securityHeaders);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Database connection (with connection pooling for serverless)
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }

    const connection = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0 // Disable mongoose buffering
    });

    cachedConnection = connection;
    console.log('Connected to MongoDB');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/investment', investmentRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/portfolio_invest', portfolioInvestRoutes);
app.use('/api/wallets', walletsRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/support-chat', supportChatRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/announcement-uploads', announcementUploadsRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/fund', fundRoutes);
app.use('/api/funds', fundsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/market-updates', marketUpdatesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/test', testRoutes);
app.use('/api/send-test-email', sendTestEmailRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      error: error.message 
    });
  }
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'TheDigitalTrading API is running on Vercel',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Vercel serverless function handler
module.exports = async (req, res) => {
  await connectToDatabase();
  return app(req, res);
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}