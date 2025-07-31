const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Investment = require('../models/Investment');
const mongoose = require('mongoose');
const Plan = require('../models/Plan');
const UserGainLog = require('../models/UserGainLog');

// POST /api/portfolio/invest
router.post('/invest', auth, async (req, res) => {
  try {
    const { plan, amount } = req.body;
    if (!plan || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Fetch plan details from backend
    const planDoc = await Plan.findOne({ name: plan, isActive: true });
    if (!planDoc) {
      return res.status(400).json({ error: 'Invalid or inactive plan' });
    }
    // Use plan's percentReturn and durationDays
    const roi = planDoc.percentReturn;
    const duration = planDoc.durationDays;
    if (amount < planDoc.minInvestment || amount > planDoc.maxInvestment) {
      return res.status(400).json({ error: 'Amount out of allowed range for this plan' });
    }
    // Calculate available balance: confirmed deposits - total invested
    const Deposit = require('../models/Deposit');
    const confirmedDeposits = await Deposit.find({ user: req.user.id, status: 'confirmed' });
    const totalDeposited = confirmedDeposits.reduce((sum, d) => sum + d.amount, 0);
    const allInvestments = await Investment.find({ user: req.user.id });
    const totalInvested = allInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const availableBalance = totalDeposited - totalInvested;
    if (amount > availableBalance) {
      return res.status(400).json({ error: 'Insufficient balance.' });
    }
    // Calculate end date and set current value to invested amount (not profit)
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
    const currentValue = amount; // Start at invested amount
    // Create investment
    const investment = new Investment({
      user: req.user.id,
      fundId: planDoc.name,
      planId: planDoc._id,
      fundName: planDoc.name,
      planName: planDoc.name,
      amount,
      currentValue,
      startDate,
      endDate,
      status: 'active',
      transactions: [{ type: 'deposit', amount, date: startDate, description: `Invested in ${planDoc.name}` }]
    });
    await investment.save();

    // Add initial gain log record
    await UserGainLog.create({
      user_id: req.user.id,
      plan_id: planDoc._id,
      gain_type: 'initial',
      value: 0,
      message: `Investment created in plan ${planDoc.name}`
    });

    // --- User Tier Upgrade Logic ---
    const tierOrder = ['Starter', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const planTier = planDoc.name;
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (user) {
      const currentTierIdx = tierOrder.indexOf(user.tier);
      const newTierIdx = tierOrder.indexOf(planTier);
      if (newTierIdx > currentTierIdx) {
        user.tier = planTier;
        await user.save();
      }
    }
    // --- End Tier Upgrade Logic ---

    res.json({ success: true, investment, availableBalance });
  } catch (err) {
    console.error('Invest API error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
