// server/routes/admin/fees.js
const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const authAdmin = require('../../middleware/authAdmin');

// Get all users with fee requirements
router.get('/users', authAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', feeType = 'all' } = req.query;
    
    let query = {};
    
    // Search by username or email
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by fee type
    if (feeType !== 'all') {
      switch (feeType) {
        case 'activation':
          query['activationFee.required'] = true;
          break;
        case 'tax-clearance':
          query['taxClearanceFee.required'] = true;
          break;
        case 'network':
          query['networkFee.required'] = true;
          break;
      }
    }
    
    const users = await User.find(query)
      .select('username email activationFee taxClearanceFee networkFee createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching users with fees:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get specific user's fee details
router.get('/user/:userId', authAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username email activationFee taxClearanceFee networkFee');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user fee details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Manually set activation fee for a user
router.post('/user/:userId/set-activation-fee', authAdmin, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.activationFee = {
      required: true,
      amount: parseFloat(amount),
      paid: false,
      paidAt: null,
      transactionId: null,
      reason: reason || 'Manually set by admin'
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Activation fee set successfully',
      activationFee: user.activationFee
    });
  } catch (error) {
    console.error('Error setting activation fee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Manually set tax clearance fee for a user
router.post('/user/:userId/set-tax-clearance-fee', authAdmin, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.taxClearanceFee = {
      required: true,
      amount: parseFloat(amount),
      paid: false,
      paidAt: null,
      transactionId: null,
      reason: reason || 'Manually set by admin'
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Tax clearance fee set successfully',
      taxClearanceFee: user.taxClearanceFee
    });
  } catch (error) {
    console.error('Error setting tax clearance fee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Manually set network fee for a user
router.post('/user/:userId/set-network-fee', authAdmin, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.networkFee = {
      required: true,
      amount: parseFloat(amount),
      paid: false,
      paidAt: null,
      transactionId: null,
      reason: reason || 'Manually set by admin'
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Network fee set successfully',
      networkFee: user.networkFee
    });
  } catch (error) {
    console.error('Error setting network fee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reset all fees for a user
router.post('/user/:userId/reset-fees', authAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.activationFee = {
      required: false,
      amount: 0,
      paid: false,
      paidAt: null,
      transactionId: null,
      reason: null
    };
    
    user.taxClearanceFee = {
      required: false,
      amount: 0,
      paid: false,
      paidAt: null,
      transactionId: null,
      reason: null
    };
    
    user.networkFee = {
      required: false,
      amount: 0,
      paid: false,
      paidAt: null,
      transactionId: null,
      reason: null
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'All fees reset successfully'
    });
  } catch (error) {
    console.error('Error resetting fees:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get fee statistics
router.get('/stats', authAdmin, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activationFeeRequired: {
            $sum: { $cond: ['$activationFee.required', 1, 0] }
          },
          activationFeePaid: {
            $sum: { $cond: ['$activationFee.paid', 1, 0] }
          },
          taxClearanceFeeRequired: {
            $sum: { $cond: ['$taxClearanceFee.required', 1, 0] }
          },
          taxClearanceFeePaid: {
            $sum: { $cond: ['$taxClearanceFee.paid', 1, 0] }
          },
          networkFeeRequired: {
            $sum: { $cond: ['$networkFee.required', 1, 0] }
          },
          networkFeePaid: {
            $sum: { $cond: ['$networkFee.paid', 1, 0] }
          },
          totalActivationFeeAmount: {
            $sum: { $cond: ['$activationFee.required', '$activationFee.amount', 0] }
          },
          totalTaxClearanceFeeAmount: {
            $sum: { $cond: ['$taxClearanceFee.required', '$taxClearanceFee.amount', 0] }
          },
          totalNetworkFeeAmount: {
            $sum: { $cond: ['$networkFee.required', '$networkFee.amount', 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      stats: stats[0] || {
        totalUsers: 0,
        activationFeeRequired: 0,
        activationFeePaid: 0,
        taxClearanceFeeRequired: 0,
        taxClearanceFeePaid: 0,
        networkFeeRequired: 0,
        networkFeePaid: 0,
        totalActivationFeeAmount: 0,
        totalTaxClearanceFeeAmount: 0,
        totalNetworkFeeAmount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching fee stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;