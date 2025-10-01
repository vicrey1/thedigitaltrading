const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Investment = require('../models/Investment');
const Deposit = require('../models/Deposit');
const Withdrawal = require('../models/Withdrawal');

// Get admin dashboard stats
router.get('/stats', authAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      investments,
      deposits,
      withdrawals,
      pendingWithdrawals
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ isVerified: true }),
      Investment.find({}),
      Deposit.find({ status: 'completed' }),
      Withdrawal.find({ status: 'completed' }),
      Withdrawal.find({ status: 'pending' })
    ]);

    const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalDeposits = deposits.reduce((sum, dep) => sum + dep.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, wit) => sum + wit.amount, 0);
    const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, wit) => sum + wit.amount, 0);

    // Calculate monthly stats
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyInvestments = investments.filter(inv => new Date(inv.createdAt) >= monthStart);
    const monthlyGrowth = monthlyInvestments.reduce((sum, inv) => sum + inv.amount, 0);

    const stats = {
      totalUsers,
      activeUsers,
      verifiedUsers,
      totalInvestments,
      totalDeposits,
      totalWithdrawals,
      pendingWithdrawalCount: pendingWithdrawals.length,
      pendingWithdrawalAmount,
      monthlyGrowth,
      averageInvestment: totalInvestments / (investments.length || 1),
      successfulDeposits: deposits.length,
      successfulWithdrawals: withdrawals.length,
      activeInvestments: investments.filter(inv => inv.status === 'active').length,
      totalRevenue: totalDeposits - totalWithdrawals
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});