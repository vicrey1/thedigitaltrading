
require('dotenv').config({ path: __dirname + '/.env' });
console.log('[DEBUG] MONGO_URI:', process.env.MONGO_URI);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const { startRoiCron } = require('./utils/roiCalculator');

const app = express();
const server = http.createServer(app);

const io = socketio(server, { cors: { origin: ['https://luxyield.com', 'https://www.luxyield.com', 'https://api.luxyield.com'], credentials: true } });

// Basic Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A client connected to WebSocket:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(cors({
  origin: ['https://luxyield.com', 'https://www.luxyield.com', 'https://api.luxyield.com'],
  credentials: true
}));
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
app.use('/api/auth', require('./routes/auth'));
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
const supportChat = require('./routes/supportChat');
app.use('/api/support', supportChat(io));
app.use('/api/investment', require('./routes/investment'));
app.use('/api/ai-chat', require('./routes/aiChat'));
app.use('/api/withdrawal', require('./routes/withdrawal'));

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
    res.json({
      status: 'ok',
      dbStatus,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Root route for health check
app.get('/', (req, res) => {
  res.send('API is running');
});

server.listen(process.env.PORT || 5001, () => {
  console.log('Server running on port', process.env.PORT || 5001);
});