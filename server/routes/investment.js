// server/routes/investment.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Investment = require('../models/Investment');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

// Simulate deposit
router.post('/deposit', auth, async (req, res) => {
  try {
    const { fundId, planId, amount } = req.body;

    // Validate input
    if (!fundId || !planId || !amount) {
      return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    // Validate plan
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({ msg: 'Invalid or inactive plan' });
    }

    // Check user balance
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ msg: 'User not found' });
    if (user.depositBalance < amount) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Subtract from available balance
    user.depositBalance -= amount;
    await user.save();

    // Create investment
    const endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
    const newInvestment = new Investment({
      user: req.user.id,
      fundId,
      planId,
      amount: parseFloat(amount),
      currentValue: parseFloat(amount),
      startDate: new Date(),
      endDate,
      status: 'active',
      fundName: '',
      planName: plan.name,
      transactions: [{
        type: 'deposit',
        amount: parseFloat(amount),
        date: new Date(),
        description: 'Initial deposit'
      }]
    });

    await newInvestment.save();

    // Referral bonus logic: credit 10% of first investment to referrer
    if (user.referredBy) {
      const previousInvestments = await Investment.find({ user: user._id });
      if (previousInvestments.length === 1) { // This is the first investment
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
          const bonus = 0.10 * parseFloat(amount);
          referrer.referralEarnings = (referrer.referralEarnings || 0) + bonus;
          await referrer.save();
          // Optionally, log the transaction
          console.log(`[REFERRAL BONUS] Credited $${bonus} to referrer ${referrer._id} for user ${user._id}'s first investment.`);
        }
      }
    }

    // Return success
    const transactionId = `TX-${Math.random().toString(36).substr(2, 10).toUpperCase()}`;
    res.json({
      success: true,
      transactionId,
      investment: {
        id: newInvestment._id,
        fundId,
        planId,
        amount,
        startDate: newInvestment.startDate,
        endDate: newInvestment.endDate
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Withdraw ROI from a completed investment
router.post('/withdraw-roi/:investmentId', auth, async (req, res) => {
  try {
    const { investmentId } = req.params;
    const userId = req.user.id;
    const investment = await Investment.findOne({ _id: investmentId, user: userId });
    if (!investment) {
      console.error('[WITHDRAW ROI] Investment not found:', investmentId, 'for user:', userId);
      return res.status(404).json({ error: 'Investment not found.' });
    }
    if (investment.status !== 'completed') {
      console.error('[WITHDRAW ROI] Investment not completed:', investmentId);
      return res.status(400).json({ error: 'ROI can only be withdrawn from completed investments.' });
    }
    // Prevent double withdrawal
    if (investment.roiWithdrawn) {
      console.error('[WITHDRAW ROI] ROI already withdrawn for investment:', investmentId);
      return res.status(400).json({ error: 'ROI already withdrawn for this investment.' });
    }
    // Calculate withdrawable ROI (currentValue - amount)
    const roi = investment.currentValue - investment.amount;
    if (roi <= 0) {
      console.error('[WITHDRAW ROI] No ROI available to withdraw for investment:', investmentId);
      return res.status(400).json({ error: 'No ROI available to withdraw.' });
    }

    // Get user for fee calculations
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if profit exceeds margin (20% of initial investment) - require activation fee
    const profitMargin = investment.amount * 0.20; // 20% margin
    if (roi > profitMargin && !user.activationFee.paid) {
      const activationFeeAmount = roi * 0.20; // 20% of ROI
      
      // Set activation fee requirement
      user.activationFee.required = true;
      user.activationFee.amount = activationFeeAmount;
      await user.save();
      
      return res.status(402).json({ 
        error: 'Activation fee required',
        message: 'Your profit has exceeded the margin. An activation fee of 20% is required before withdrawal.',
        feeType: 'activation',
        feeAmount: activationFeeAmount,
        roi: roi,
        margin: profitMargin
      });
    }

    // Get wallet info from user or use defaults
    let { walletAddress, network, currency } = req.body;
    let wallet = null;
    if (user && user.wallets && user.wallets.length > 0) {
      wallet = user.wallets[0];
    }
    walletAddress = walletAddress || wallet?.address || 'DEFAULT_ADDRESS';
    network = network || wallet?.network || 'ERC20';
    currency = currency || wallet?.currency || 'USDT';

    // Create a pending withdrawal for ROI
    const withdrawal = new Withdrawal({
      userId,
      investmentId,
      amount: roi,
      status: 'pending',
      type: 'roi',
      walletAddress,
      network,
      currency,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('[WITHDRAW ROI] About to save withdrawal:', withdrawal);
    
    // Mark ROI as withdrawn
    investment.roiWithdrawn = true;
    console.log('[WITHDRAW ROI] About to save investment:', investment);
    
    // Add ROI to lockedBalance and set tax clearance fee requirement
    user.lockedBalance = (user.lockedBalance || 0) + roi;
    
    // Set tax clearance fee requirement (18% of ROI)
    const taxClearanceFeeAmount = roi * 0.18;
    user.taxClearanceFee.required = true;
    user.taxClearanceFee.amount = taxClearanceFeeAmount;
    user.taxClearanceFee.reason = `Tax clearance fee for ROI withdrawal of $${roi.toFixed(2)}`;
    
    await withdrawal.save();
    await investment.save();
    await user.save();
    // Fetch updated locked balance
    const newLockedBalance = user.lockedBalance;
    res.json({ 
      success: true, 
      withdrawal, 
      roi, 
      newLockedBalance, 
      user,
      taxClearanceFee: {
        required: true,
        amount: taxClearanceFeeAmount,
        message: 'A tax clearance fee of 18% is required before funds can be moved to your available balance.'
      }
    });
  } catch (err) {
    console.error('[WITHDRAW ROI] Internal error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;