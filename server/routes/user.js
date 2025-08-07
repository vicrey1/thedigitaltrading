// server/routes/user.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Investment = require('../models/Investment');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');
const UserGainLog = require('../models/UserGainLog');
const MarketUpdate = require('../models/MarketUpdate');
const geoip = require('geoip-lite');
const useragent = require('useragent');
const bcrypt = require('bcryptjs');
const { sendMail } = require('../utils/mailer');

// Middleware to log device/browser/IP/location on login
async function logDeviceHistory(req, res, next) {
  try {
    if (req.user && req.user.id) {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const agent = useragent.parse(req.headers['user-agent']);
      const geo = geoip.lookup(ip) || {};
      const deviceEntry = {
        date: new Date().toISOString(),
        ip,
        browser: agent.family + ' ' + agent.major,
        device: agent.device.family,
        location: geo.city ? `${geo.city}, ${geo.country}` : geo.country || '-',
        status: 'Success',
        lastActive: new Date().toISOString()
      };
      await User.findByIdAndUpdate(req.user.id, { $push: { deviceHistory: deviceEntry } });
    }
  } catch {}
  next();
}

// Dashboard data endpoint
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Get user from database
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Get investments
    const investments = await Investment.find({ user: req.user.id });

    // Calculate totals
    const totalBalance = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
    const totalROI = investments.reduce((sum, inv) => sum + (inv.roi || 0), 0);

    // Generate performance data (last 6 months)
    const performanceData = generatePerformanceData(investments);

    // Generate allocation data
    const allocationData = generateAllocationData(investments);

    // --- Performance Metrics ---
    // ROI already calculated as totalROI
    // Calculate daily returns for volatility, sharpe, max drawdown, alpha
    let returns = [];
    if (investments.length > 0) {
      // Simulate daily returns from investment growth
      investments.forEach(inv => {
        if (inv.history && Array.isArray(inv.history)) {
          for (let i = 1; i < inv.history.length; i++) {
            const prev = inv.history[i-1].value;
            const curr = inv.history[i].value;
            if (prev > 0) returns.push((curr - prev) / prev);
          }
        }
      });
    }
    // fallback: simulate returns if not enough data
    if (returns.length < 2) returns = [0.01, 0.012, 0.009, 0.011, 0.013, 0.012, 0.014];

    // Volatility (std dev of returns)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // annualized %

    // Sharpe Ratio (assume risk-free rate = 0)
    const sharpeRatio = volatility ? (mean * 252) / (volatility / 100) : null;

    // Max Drawdown
    let maxDrawdown = 0;
    if (investments.length > 0 && investments[0].history && investments[0].history.length > 1) {
      let peak = investments[0].history[0].value;
      investments[0].history.forEach(h => {
        if (h.value > peak) peak = h.value;
        const drawdown = (peak - h.value) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });
      maxDrawdown = maxDrawdown * 100;
    }

    // Alpha (simulated as excess return over 10% benchmark)
    const alpha = (mean * 252 * 100) - 10;

    // Get market updates only for non-admins
    let marketUpdates = [];
    if (user.role !== 'admin') {
      marketUpdates = await MarketUpdate.find()
        .sort('-createdAt')
        .limit(3);
    }

    // Determine current tier from active investment plan
    let currentTier = 'Starter';
    const activeInvestment = investments.find(inv => inv.status === 'active');
    if (activeInvestment && activeInvestment.planId) {
      // Map planId to tier name if needed, or use planId directly
      currentTier = activeInvestment.planId.charAt(0).toUpperCase() + activeInvestment.planId.slice(1);
    }

    res.json({
      userInfo: {
        name: user.name || '',
        tier: currentTier,
        membershipLevel: user.membershipLevel || 'Basic',
        depositBalance: user.depositBalance || 0,
        isEmailVerified: user.isEmailVerified === undefined ? false : user.isEmailVerified,
      },
      summary: {
        totalBalance,
        totalROI,
        activeInvestments: investments.length,
        totalROIPercent: totalROI,
        sharpeRatio,
        alpha,
        volatility,
        maxDrawdown
      },
      performanceData,
      allocationData,
      ...(user.role !== 'admin' && { marketUpdates })
    });
  } catch (err) {
    console.error('[DASHBOARD ERROR]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Helper functions
function generatePerformanceData(investments) {
  // This would analyze investments and generate monthly ROI data
  // For simulation, we'll generate random but realistic data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  return months.map((month, index) => ({
    name: month,
    roi: (Math.random() * 3 + 3 + index * 0.5).toFixed(1)
  }));
}

function generateAllocationData(investments) {
  // Group investments by type and calculate percentages
  const types = {};
  investments.forEach(inv => {
    types[inv.fundType] = (types[inv.fundType] || 0) + inv.currentValue;
  });
  
  return Object.entries(types).map(([name, value]) => ({
    name,
    value: Math.round(value)
  }));
}

module.exports = router;
module.exports.logDeviceHistory = logDeviceHistory;

// server/routes/user.js
// Add to existing routes
router.post('/deposit', auth, async (req, res) => {
  try {
    const { fundType, amount, simulationDays } = req.body;
    
    // Validate inputs
    if (!['Spot Market', 'Derivatives', 'Yield Farming', 'NFT Fund', 'Arbitrage'].includes(fundType)) {
      return res.status(400).json({ message: 'Invalid fund type' });
    }
    
    if (amount < 100 || amount > 1000000) {
      return res.status(400).json({ message: 'Amount must be between $100 and $1,000,000' });
    }

    // Create simulated investment
    const investment = new Investment({
      user: req.user.id,
      fundType,
      amount: parseFloat(amount),
      currentValue: parseFloat(amount),
      daysInvested: 0,
      simulationDays: parseInt(simulationDays),
      startDate: new Date(),
      endDate: new Date(Date.now() + parseInt(simulationDays) * 24 * 60 * 60 * 1000)
    });

    await investment.save();

    res.json({
      message: 'Deposit simulated successfully',
      investment
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// In server/routes/user.js, update generatePerformanceData function
function generatePerformanceData(investments) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  
  // Calculate cumulative ROI by month
  return months.map((month, index) => {
    // Simulate ROI based on investments and time
    const baseROI = investments.reduce((sum, inv) => {
      const daysPassed = Math.min(inv.daysInvested + index * 30, inv.simulationDays);
      const roiFactor = {
        'Spot Market': 0.0005,
        'Derivatives': 0.0015,
        'Yield Farming': 0.002,
        'NFT Fund': 0.001,
        'Arbitrage': 0.0008
      };
      
      return sum + (inv.amount * roiFactor[inv.fundType] * daysPassed);
    }, 0);
    
    return {
      name: month,
      roi: (baseROI / investments.length || 0).toFixed(1)
    };
  });
}

// server/routes/user.js
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { investmentId, amount, method } = req.body;
    const Withdrawal = require('../models/Withdrawal');
    // Find investment
    const investment = await Investment.findById(investmentId);
    if (!investment || investment.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Investment not found' });
    }
    // Only allow ROI withdrawal from completed investments and only once
    if (investment.status !== 'completed') {
      return res.status(400).json({ message: 'Investment is not completed yet.' });
    }
    if (investment.roiWithdrawn) {
      return res.status(400).json({ message: 'ROI has already been withdrawn for this investment.' });
    }
    if (amount > investment.currentValue) {
      return res.status(400).json({ message: 'Insufficient funds in this investment' });
    }
    // Update user's locked balance
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.lockedBalance = (user.lockedBalance || 0) + parseFloat(amount);
    await user.save();
    // Mark investment as ROI withdrawn
    investment.roiWithdrawn = true;
    await investment.save();
    // Create Withdrawal record for admin approval
    const withdrawal = new Withdrawal({
      userId: req.user.id,
      amount: parseFloat(amount),
      currency: 'USDT', // or use investment currency if available
      network: 'ERC20', // or use investment network if available
      walletAddress: 'ROI_WITHDRAWN',
      status: 'pending',
      destination: 'locked',
      adminNotes: 'ROI withdrawal from completed investment',
      type: 'roi',
    });
    await withdrawal.save();
    res.json({
      message: 'ROI withdrawal request submitted successfully',
      withdrawal
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// server/routes/user.js
router.get('/investment/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    
    if (!investment || investment.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Investment not found' });
    }
    
    // Calculate current ROI
    investment.roi = ((investment.currentValue - investment.amount) / investment.amount) * 100;
    
    // Calculate days invested
    const now = new Date();
    const startDate = new Date(investment.startDate);
    investment.daysInvested = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    
    // Update status if completed
    if (investment.daysInvested >= investment.simulationDays) {
      investment.status = 'Completed';
    }
    
    await investment.save();
    
    res.json(investment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get user balances endpoint for withdrawal page
router.get('/balances', auth, async (req, res) => {
  try {
    // TODO: Replace with real balance logic from your database
    // For now, return mock data similar to the frontend
    res.json({
      available: 12500.75,
      locked: 36250.25,
      currencies: [
        { symbol: 'USDT', amount: 8500.50, available: 4500.25 },
        { symbol: 'BTC', amount: 0.42, available: 0.12 },
        { symbol: 'ETH', amount: 3.75, available: 1.25 },
        { symbol: 'BNB', amount: 12.5, available: 5.0 },
        { symbol: 'SOL', amount: 85.0, available: 35.0 },
      ]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Failed to load balances' });
  }
});

// Enhanced Referral stats endpoint
router.get('/referral-stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    // Find users referred by this user
    const referredUsers = await User.find({ referredBy: user._id });
    // For each referred user, sum their investment profits
    const Investment = require('../models/Investment');
    let totalEarnings = 0;
    let referredDetails = [];
    for (const refUser of referredUsers) {
      const investments = await Investment.find({ user: refUser._id });
      let userTotalProfit = 0;
      for (const inv of investments) {
        const profit = (inv.currentValue || 0) - (inv.amount || 0);
        if (profit > 0) userTotalProfit += profit;
      }
      // Referral reward is a fixed 10% of profit (not a percentage string)
      const reward = userTotalProfit * 0.10;
      totalEarnings += reward;
      referredDetails.push({
        name: refUser.name,
        email: refUser.email,
        totalInvested: investments.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        totalProfit: userTotalProfit,
        reward: Math.round(reward * 100) / 100
      });
    }
    res.json({
      referralCode: user.referralCode,
      referralLink: `${process.env.FRONTEND_URL}/register?ref=${user.referralCode}`,
      referredCount: referredUsers.length,
      referredUsers: referredDetails,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      activeReferrals: referredUsers.length
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch referral stats' });
  }
});

// Delete account
router.delete('/delete-account', auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    // Delete all related data in parallel, but don't fail all if one fails
    const results = await Promise.allSettled([
      Investment.deleteMany({ user: req.user.id }),
      Deposit.deleteMany({ user: req.user.id }),
      Withdrawal.deleteMany({ userId: req.user.id }),
      UserGainLog.deleteMany({ user_id: req.user.id })
    ]);
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.error('Partial account deletion error:', failed.map(f => f.reason));
      return res.json({ message: 'Account deleted, but some related data could not be fully removed.' });
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// Privacy controls (example: toggle data sharing)
router.patch('/privacy', auth, async (req, res) => {
  try {
    const { dataSharing } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { dataSharing }, { new: true });
    res.json({ message: 'Privacy settings updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update privacy settings' });
  }
});

// Get active sessions and login history
router.get('/sessions', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('deviceHistory');
    // deviceHistory: [{ device, browser, location, ip, lastActive, status }]
    res.json({ sessions: user.deviceHistory || [] });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

// Logout session (by index or id)
// Logout session for current device/browser
router.post('/logout-session', auth, async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const agent = useragent.parse(req.headers['user-agent']);
    const browser = agent.family + ' ' + agent.major;
    const device = agent.device.family;
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { deviceHistory: { browser, device } }
    });
    res.json({ message: 'Session logged out' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to logout session' });
  }
});

// Update user profile (name, phone, country, etc.)
router.patch('/profile', auth, async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'country', 'username'];
    const update = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change user password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await require('bcryptjs').compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = await require('bcryptjs').hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user notification preferences
router.patch('/notification-preferences', auth, async (req, res) => {
  try {
    const { email, sms, push } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.notificationPrefs = { email, sms, push };
    await user.save();
    res.json({ message: 'Notification preferences updated', notificationPrefs: user.notificationPrefs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Example: use logDeviceHistory middleware on login route
// router.post('/login', logDeviceHistory, ...existingLoginHandler

// Validate user password for profile edit
router.post('/validate-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });
    res.json({ message: 'Password validated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send OTP to old email for profile edit
router.post('/send-profile-edit-otp', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.profileEditOtp = code;
    user.profileEditOtpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendMail({
      to: user.email,
      subject: 'Profile Edit Confirmation',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <div style="font-family:sans-serif; font-size:2.5rem; font-weight:bold; letter-spacing:2px; margin-bottom:24px;">
          <span style="color:#FFD700;">LUX</span><span style="color:#fff;">HEDGE</span>
        </div>
        <h2 style="color:#FFD700;">Profile Edit Confirmation</h2>
        <p style="margin:24px 0;">Your OTP code is:</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;color:#FFD700;">${code}</div>
        <p style="margin-top:32px;font-size:12px;color:#aaa;">This code expires in 10 minutes.</p>
      </div>`
    });
    res.json({ message: 'OTP sent to your old email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify OTP and finalize profile update
router.post('/verify-profile-edit-otp', auth, async (req, res) => {
  try {
    const { otp, newProfile } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || !user.profileEditOtp || !user.profileEditOtpExpiry) {
      return res.status(400).json({ message: 'No OTP found.' });
    }
    if (user.profileEditOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    if (user.profileEditOtpExpiry < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    // Only allow editing allowed fields
    const allowedFields = ['name', 'phone', 'email'];
    if (user.kyc && user.kyc.status === 'verified') allowedFields.splice(allowedFields.indexOf('name'), 1);
    allowedFields.forEach(field => {
      if (newProfile[field] !== undefined) user[field] = newProfile[field];
    });
    user.profileEditOtp = undefined;
    user.profileEditOtpExpiry = undefined;
    await user.save();
    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { ...user.toObject(), isEmailVerified: user.isEmailVerified } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Download Statement Endpoint ---
router.get('/statement', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const investments = await require('../models/Investment').find({ user: userId });
    const withdrawals = await require('../models/Withdrawal').find({ userId });
    const deposits = await require('../models/Deposit').find({ user: userId });
    // For simplicity, generate a CSV (can be replaced with PDF logic)
    let csv = 'Type,Amount,Fund,Date,Status\n';
    investments.forEach(inv => {
      csv += `Investment,${inv.amount},${inv.fundName},${inv.createdAt.toISOString()},${inv.status}\n`;
    });
    withdrawals.forEach(wd => {
      csv += `Withdrawal,${wd.amount},,${wd.createdAt.toISOString()},${wd.status}\n`;
    });
    deposits.forEach(dep => {
      csv += `Deposit,${dep.amount},,${dep.createdAt.toISOString()},${dep.status}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=statement.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate statement', error: err.message });
  }
});

// --- Refresh KYC Status Endpoint ---
router.get('/kyc-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ kyc: user.kyc });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch KYC status', error: err.message });
  }
});
