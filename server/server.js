require('dotenv').config({ path: __dirname + '/.env' });
console.log('==============================');
console.log('THE DIGITAL TRADING Backend Server Starting');
console.log('[DEBUG] MONGO_URI:', process.env.MONGO_URI);
console.log('[DEBUG] PORT from env:', process.env.PORT);
console.log('[DEBUG] NODE_ENV:', process.env.NODE_ENV);
console.log('==============================');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const { startRoiCron } = require('./utils/roiCalculator');

const app = express();
// Trust proxy headers (needed for WebSocket support on Render and similar hosts)
app.set('trust proxy', 1);
// Log all /socket.io/ requests for debugging WebSocket handshake issues
app.use('/socket.io', (req, res, next) => {
  console.log(`[SOCKET.IO] ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
  next();
});
const server = http.createServer(app);

const io = socketio(server, { cors: { origin: '*', credentials: true } });

io.use((socket, next) => {
  console.log('Socket connection attempt with headers:', socket.handshake.headers);
  next();
});

// Basic Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A client connected to WebSocket:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// CORS Middleware - Updated for Vercel + Render deployment
const allowedOrigins = [
  'https://thedigitaltrading.com',
  'https://www.thedigitaltrading.com',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // Vercel deployment URL
  process.env.CORS_ORIGIN   // Additional CORS origin from env
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization']
}));

// Handle preflight requests for all routes
app.options('*', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Added PATCH
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
// Ensure Authorization header is explicitly allowed for all responses (safety for proxies)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'Authorization');
  // Helpful debug logging for CORS issues
  if (req.method === 'OPTIONS') console.log('[CORS] Preflight', req.method, req.originalUrl, 'Headers:', Object.keys(req.headers));
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Register /api/plans route after app is initialized and after all require statements
app.use('/api/plans', require('./routes/plans'));

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    startRoiCron(); // Start ROI simulation cron after DB is connected
  })
  .catch(err => console.log(err));

// Routes
const authRouter = require('./routes/auth');
console.log('Mounting /api/auth routes...');
app.use('/api/auth', authRouter);
console.log('/api/auth routes mounted. All /api/auth/* requests will be logged by the router.');
app.use('/api/users', require('./routes/users'));
app.use('/api/funds', require('./routes/funds'));
app.use('/api/blogs', require('./routes/blog'));
app.use('/api/events', require('./routes/event'));
app.use('/api/user', require('./routes/user'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/portfolio', require('./routes/portfolio_invest'));
app.use('/api/deposit', require('./routes/deposit'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/wallets', require('./routes/wallets'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/plans', require('./routes/admin/plans'));
app.use('/api/market-updates', require('./routes/market-updates'));
app.use('/api/admin/roi-approvals', require('./routes/admin/roi-approvals'));
app.use('/api/admin/user-investments', require('./routes/admin/userInvestments'));
app.use('/uploads', require('./routes/uploads'));
app.use(require('./routes/sendTestEmail'));
app.use('/api/test', require('./routes/test'));
app.use('/uploads/announcements', express.static(__dirname + '/uploads/announcements'));
app.use('/api', require('./routes/announcementUploads'));
app.use('/api/performance', require('./routes/performance')); // Add performance metrics API route
app.use('/api/news', require('./routes/news')); // Add news API route

app.use('/api/investment', require('./routes/investment'));
app.use('/api/ai-chat', require('./routes/aiChat'));
app.use('/api/withdrawal', require('./routes/withdrawal'));
app.use('/api/cars', require('./routes/cars'));
app.use('/api/fees', require('./routes/fees'));
app.use('/api/support', require('./routes/supportChat'));
app.use('/api/admin/support', require('./routes/admin/supportChat'));

// Serve car uploads statically
app.use('/uploads/cars', express.static(__dirname + '/uploads/cars'));
// Serve support uploads statically
app.use('/uploads/support', express.static(__dirname + '/uploads/support'));

// Socket.IO logic
io.on('connection', (socket) => {
  // Group chat logic
  socket.on('joinGroup', ({ name }) => {
    socket.join('groupchat');
    socket.data.nickname = name;
    // Optionally notify others someone joined
    // io.to('groupchat').emit('groupMessage', { name: 'System', text: `${name} joined the chat`, time: new Date().toLocaleTimeString(), isAdmin: false });
  });

  socket.on('groupMessage', (msg) => {
    // Broadcast to all in groupchat room
    io.to('groupchat').emit('groupMessage', msg);
  });
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log('Socket joined room:', userId);
  });
  socket.on('adminJoin', () => {
    socket.join('admins');
    console.log('Admin joined admins room');
  });
  socket.on('leaveAdmins', () => {
    socket.leave('admins');
    console.log('Admin left admins room');
  });
  socket.on('adminTyping', ({ userId }) => {
    io.to(userId).emit('adminTyping', { userId });
  });
  socket.on('adminStopTyping', ({ userId }) => {
    io.to(userId).emit('adminStopTyping', { userId });
  });
  socket.on('endSupportSession', ({ userId }) => {
    console.log('Backend received endSupportSession for user:', userId);
    io.to(userId).emit('endSupportSession');
  });
});

// Health check endpoint for DB and server status
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    let dbStatus = 'disconnected';
    if (dbState === 1) dbStatus = 'connected';
    else if (dbState === 2) dbStatus = 'connecting';
    else if (dbState === 3) dbStatus = 'disconnecting';
    
    const health = {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'unknown'
      },
      server: {
        uptime: Math.round(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      }
    };
    
    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: err.message 
    });
  }
});

// Detailed metrics endpoint (for monitoring systems)
app.get('/api/metrics', async (req, res) => {
  try {
    const { SystemMetrics, requestMetrics, dbMetrics } = require('./middleware/monitoring');
    
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        memory: SystemMetrics.getMemoryUsage(),
        cpu: SystemMetrics.getCpuUsage(),
        process: SystemMetrics.getProcessInfo()
      },
      requests: requestMetrics.getMetrics(),
      database: {
        connection: {
          status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          name: mongoose.connection.name
        },
        metrics: dbMetrics.getMetrics()
      }
    };
    
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: err.message 
    });
  }
});

// Root route for health check
app.get('/', (req, res) => {
  res.send('API is running');
});

console.log(`[DEBUG] Final port check before listen: ${process.env.PORT}`);
server.listen(process.env.PORT, () => {
  console.log('Server running on port', process.env.PORT);
});