// server/routes/portfolio.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Investment = require('../models/Investment');
const Withdrawal = require('../models/Withdrawal');
const Deposit = require('../models/Deposit');
const User = require('../models/User');
const UserGainLog = require('../models/UserGainLog');
const mongoose = require('mongoose');

// Shared function to get portfolio data for any user
async function getPortfolioData(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID.');
  }

  // Get all investments for the user
  const investments = await Investment.find({ user: userId });
  // Calculate totals
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  // totalInvested, totalROI, and totalROIPercent will be calculated after allInvestments is defined below
  // Generate performance data (last 12 months)
  const performanceData = generatePerformanceData(investments);
  // Generate allocation data
  const allocationData = generateAllocationData(investments);
  // Get recent activity (investments + withdrawals + deposits)
  const recentInvestments = await Investment.find({ user: userId })
    .sort('-createdAt')
    .limit(5);
  const recentWithdrawals = await Withdrawal.find({ userId: userId })
    .sort('-createdAt')
    .limit(5);
  const recentDeposits = await Deposit.find({ user: userId, status: 'confirmed' })
    .sort('-createdAt')
    .limit(5);
  const recentActivity = [
    ...recentInvestments.map(inv => ({
      type: 'Investment',
      amount: inv.amount,
      fund: inv.fundName,
      date: inv.createdAt,
      status: inv.status || 'Completed',
      description: inv.planName ? `Invested in ${inv.planName}` : 'Investment',
    })),
    ...recentWithdrawals.map(wd => ({
      type: 'Withdrawal',
      amount: wd.amount,
      fund: '',
      date: wd.createdAt,
      status: wd.status,
      description: `Withdrawal to ${wd.walletAddress}`,
    })),
    ...recentDeposits.map(dep => ({
      type: 'Deposit',
      amount: dep.amount,
      fund: '',
      date: dep.createdAt,
      status: dep.status,
      description: `Deposit via ${dep.method || 'manual'}`,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);
  // Fetch user details for name and tier
  const userDoc = await User.findById(userId);
  // Calculate user's performance percentile (simulate for now)
  const performancePercentile = 87; // TODO: Replace with real calculation
  // Calculate depositBalance as sum of all confirmed deposits
  const confirmedDeposits = await Deposit.find({ user: userId, status: 'confirmed' });
  const depositBalance = confirmedDeposits.reduce((sum, d) => sum + d.amount, 0);
  // Calculate total invested (active + completed investments)
  const allInvestments = await Investment.find({ user: userId });
  // Calculate admin-confirmed ROI withdrawals (status: 'confirmed', type: 'roi')
  const confirmedRoiWithdrawals = await Withdrawal.find({ userId: userId, status: 'confirmed', type: 'roi' });
  const totalConfirmedRoi = confirmedRoiWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  // Calculate totalInvested after allInvestments is defined
  const totalInvested = allInvestments.reduce((sum, inv) => sum + inv.amount, 0);
  // Calculate availableBalance: depositBalance - totalInvested + totalConfirmedRoi
  const availableBalance = depositBalance - totalInvested + totalConfirmedRoi;
  function calculateInvestmentROI(inv) {
    const roiTransactions = (inv.transactions || []).filter(t => t.type === 'roi');
    const roiSum = roiTransactions.reduce((sum, t) => sum + t.amount, 0);
    // ROI = (all ROI payouts + (currentValue - amount)) / amount * 100
    return ((roiSum + (inv.currentValue - inv.amount)) / inv.amount) * 100;
  }
  // Fetch user gain logs
  const userGainLogs = await UserGainLog.find({ user_id: userId }).sort('-logged_at').limit(20);
  // Calculate advanced performance metrics from performanceData
  function calculatePerformanceMetrics(performanceData) {
    if (!performanceData || performanceData.length < 2) {
      return { sharpeRatio: null, alpha: null, volatility: null, maxDrawdown: null };
    }
    // Calculate monthly returns
    const returns = [];
    for (let i = 1; i < performanceData.length; i++) {
      const prev = performanceData[i - 1].portfolioValue;
      const curr = performanceData[i].portfolioValue;
      if (prev > 0) {
        returns.push((curr - prev) / prev);
      }
    }
    // Volatility (std dev of returns)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
    const volatility = Math.sqrt(variance) * Math.sqrt(12) * 100; // annualized, percent
    // Sharpe Ratio (assume risk-free rate = 0)
    const sharpeRatio = volatility > 0 ? (mean * 12) / (Math.sqrt(variance) * Math.sqrt(12)) : null;
    // Max Drawdown
    let maxDrawdown = 0;
    let peak = performanceData[0].portfolioValue;
    for (const d of performanceData) {
      if (d.portfolioValue > peak) peak = d.portfolioValue;
      const drawdown = (peak - d.portfolioValue) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    maxDrawdown = maxDrawdown * 100;
    // Alpha (vs. benchmark, if available)
    let alpha = null;
    if (performanceData[0].benchmark !== undefined) {
      // Calculate benchmark returns
      const benchReturns = [];
      for (let i = 1; i < performanceData.length; i++) {
        const prev = performanceData[i - 1].benchmark;
        const curr = performanceData[i].benchmark;
        if (prev > 0) {
          benchReturns.push((curr - prev) / prev);
        }
      }
      const meanBench = benchReturns.reduce((a, b) => a + b, 0) / benchReturns.length;
      alpha = (mean * 12 - meanBench * 12) * 100; // annualized, percent
    }
    return {
      sharpeRatio: sharpeRatio !== null ? parseFloat(sharpeRatio.toFixed(2)) : null,
      alpha: alpha !== null ? parseFloat(alpha.toFixed(2)) : null,
      volatility: volatility !== null ? parseFloat(volatility.toFixed(2)) : null,
      maxDrawdown: maxDrawdown !== null ? parseFloat(maxDrawdown.toFixed(2)) : null,
    };
  }

  const perfMetrics = calculatePerformanceMetrics(performanceData);
  // Calculate totalROI, and totalROIPercent after allInvestments is defined
  const totalValueFinal = allInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalROI = totalValueFinal - totalInvested;
  const totalROIPercent = (totalROI / (totalInvested || 1)) * 100;
  return {
    investments: allInvestments.map(inv => ({
      id: inv._id,
      fundId: inv.fundId,
      fundName: inv.fundName,
      planName: inv.planName,
      initialAmount: inv.amount,
      currentValue: inv.currentValue,
      roi: calculateInvestmentROI(inv),
      startDate: inv.startDate,
      endDate: inv.endDate,
      status: inv.status,
      roiWithdrawn: inv.roiWithdrawn || false
    })),
    summary: {
      totalInvested: totalInvested,
      totalValue: totalValue,
      totalROI: totalROI,
      totalROIPercent: totalROIPercent,
      activeInvestments: investments.filter(inv => inv.status === 'active').length,
      sharpeRatio: perfMetrics.sharpeRatio,
      alpha: perfMetrics.alpha,
      volatility: perfMetrics.volatility,
      maxDrawdown: perfMetrics.maxDrawdown,
    },
    userInfo: {
      name: userDoc?.name || 'Investor',
      tier: userDoc?.tier || 'Starter',
      performancePercentile,
      depositBalance,
      availableBalance,
      lockedBalance: userDoc?.lockedBalance || 0
    },
    performanceData,
    allocationData,
    recentActivity,
    userGainLogs,
    debug: "portfolio-v2-response"
  };
}

// Get portfolio data
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await getPortfolioData(userId);
    // Debug log for availableBalance and related values
    if (data && data.userInfo) {
      console.log('[DEBUG] Portfolio API:', {
        userId,
        depositBalance: data.userInfo.depositBalance,
        availableBalance: data.userInfo.availableBalance,
        lockedBalance: data.userInfo.lockedBalance
      });
    }
    res.json(data);
  } catch (err) {
    console.error('Portfolio API error:', err.message, err.stack);
    res.status(500).send('Server Error: ' + err.message);
  }
});

// Invest in a plan
router.post('/invest', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan, amount, roi } = req.body;
    if (!plan || !amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid plan or amount.' });
    }
    // Plan config (should match frontend)
    const PLAN_CONFIG = {
      Silver: { min: 500, max: 4999 },
      Gold: { min: 5000, max: 19999 },
      Platinum: { min: 20000, max: 49999 },
      Diamond: { min: 50000, max: 1000000 },
    };
    const config = PLAN_CONFIG[plan];
    if (!config) return res.status(400).json({ error: 'Invalid plan selected.' });
    if (amount < config.min || amount > config.max) {
      return res.status(400).json({ error: `Amount must be between $${config.min} and $${config.max}` });
    }
    // Check for existing active investment
    const active = await Investment.findOne({ user: userId, status: 'active' });
    if (active) {
      return res.status(400).json({ error: 'You can only have one active investment at a time.' });
    }
    // Check available balance
    const confirmedDeposits = await Deposit.find({ user: userId, status: 'confirmed' });
    const totalDeposited = confirmedDeposits.reduce((sum, d) => sum + d.amount, 0);
    const allInvestments = await Investment.find({ user: userId });
    const totalInvested = allInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const availableBalance = totalDeposited - totalInvested;
    if (amount > availableBalance) {
      return res.status(400).json({ error: 'Insufficient balance.' });
    }
    // Create investment
    const now = new Date();
    const durationDays = plan === 'Silver' ? 7 : plan === 'Gold' ? 10 : plan === 'Platinum' ? 15 : 21;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const newInvestment = new Investment({
      user: userId,
      fundId: plan,
      planId: plan,
      fundName: plan,
      amount,
      currentValue: amount,
      startDate: now,
      endDate,
      status: 'active',
      roi: roi || 0,
      transactions: [],
    });
    await newInvestment.save();
    // Update user tier to match the plan
    await User.findByIdAndUpdate(userId, { tier: plan });
    res.json({ message: 'Investment successful', investment: newInvestment });
  } catch (err) {
    console.error('Invest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single investment by ID (with transactions)
router.get('/investment/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id).lean();
    if (!investment) return res.status(404).json({ error: 'Investment not found' });
    res.json({ investment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper functions
function generatePerformanceData(investments) {
  // Generate daily data for the last 30 days
  const days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push({
      name: date.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    });
  }
  const results = days.map((day, idx) => {
    let totalInvested = 0;
    let totalValue = 0;
    let activeBenchmarks = [];
    investments.forEach(inv => {
      const start = new Date(inv.startDate);
      const end = inv.endDate ? new Date(inv.endDate) : null;
      if (start <= day.date && (!end || end >= day.date)) {
        totalInvested += inv.amount;
        if (end && end < day.date) {
          totalValue += inv.currentValue;
        } else {
          if (inv.transactions && inv.transactions.length > 0) {
            const roiSum = inv.transactions
              .filter(t => t.type === 'roi' && new Date(t.date) <= day.date)
              .reduce((sum, t) => sum + t.amount, 0);
            totalValue += inv.amount + roiSum;
          } else {
            totalValue += inv.currentValue;
          }
        }
        // For benchmark, use the initial amount grown by a fixed rate or the plan's ROI rate
        let planRoi = 0;
        if (inv.planName === 'Silver') planRoi = 350;
        if (inv.planName === 'Gold') planRoi = 450;
        if (inv.planName === 'Platinum') planRoi = 550;
        if (inv.planName === 'Diamond') planRoi = 650;
        const daysActive = Math.max(1, Math.floor((day.date - start) / (1000 * 60 * 60 * 24)));
        // Assume plan duration is 365 days for annualized ROI
        const benchmarkValue = inv.amount * (1 + (planRoi / 100) * (daysActive / 365));
        activeBenchmarks.push(benchmarkValue);
      }
    });
    const roiPercent = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
    const portfolioValue = parseFloat(totalValue.toFixed(2));
    const benchmark = activeBenchmarks.length > 0 ? parseFloat((activeBenchmarks.reduce((a, b) => a + b, 0) / activeBenchmarks.length).toFixed(2)) : portfolioValue;
    return {
      name: day.name,
      date: day.date,
      portfolioValue,
      benchmark,
      roiPercent: parseFloat(roiPercent.toFixed(2)),
    };
  });
  // Debug: log the latest day's calculation
  if (results.length > 0) {
    const latest = results[results.length - 1];
    console.log('[PERF DEBUG] Latest day:', latest);
    console.log('[PERF DEBUG] Investments:', investments.map(inv => ({
      amount: inv.amount,
      currentValue: inv.currentValue,
      startDate: inv.startDate,
      endDate: inv.endDate,
      transactions: inv.transactions
    })));
  }
  return results;
}

function generateAllocationData(investments) {
  // Group investments by fund type and calculate percentages
  const funds = {};
  investments.forEach(inv => {
    funds[inv.fundName] = (funds[inv.fundName] || 0) + inv.currentValue;
  });
  
  return Object.entries(funds).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }));
}

module.exports = router;
module.exports.getPortfolioData = getPortfolioData;