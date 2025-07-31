// routes/admin/withdrawals.js
const express = require('express');
const router = express.Router();
const Withdrawal = require('../../models/Withdrawal');
const auth = require('../../middleware/adminAuth');

// Get withdrawals with filters
router.get('/', auth, async (req, res) => {
  try {
    const { status, currency, dateRange } = req.query;
    
    // Build query
    const query = {};
    if (status && status !== 'all') query.status = status;
    if (currency && currency !== 'all') query.currency = currency;
    
    // Date range filter
    if (dateRange) {
      const days = parseInt(dateRange.replace('days', ''));
      if (!isNaN(days)) {
        query.createdAt = { 
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        };
      }
    }
    
    // Populate user info for each withdrawal
    const withdrawals = await Withdrawal.find(query)
      .sort('-createdAt')
      .limit(100)
      .populate('userId', 'email name');
    
    // Map to include userEmail and userName fields for frontend
    const mapped = withdrawals.map(w => ({
      id: w._id.toString(),
      userId: w.userId?._id?.toString() || w.userId?.toString() || '',
      userEmail: w.userId?.email || '',
      userName: w.userId?.name || '',
      amount: w.amount,
      currency: w.currency,
      network: w.network,
      walletAddress: w.walletAddress,
      status: w.status,
      adminNotes: w.adminNotes,
      createdAt: w.createdAt,
      processedAt: w.processedAt,
      processedBy: w.processedBy,
    }));
    
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update withdrawal status
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    
    // Validate status transition
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending withdrawals can be modified' });
    }
    
    withdrawal.status = status;
    withdrawal.adminNotes = adminNotes;
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.admin.id;
    
    await withdrawal.save();
    
    // In a real app, you would:
    // 1. For approved withdrawals: process the blockchain transaction
    // 2. Send email notification to user
    // 3. Update user balance if rejected
    
    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk update withdrawals
router.patch('/bulk', auth, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    
    // Validate updates
    if (!updates.status || !['completed', 'rejected'].includes(updates.status)) {
      return res.status(400).json({ message: 'Invalid status update' });
    }
    
    const result = await Withdrawal.updateMany(
      { _id: { $in: ids }, status: 'pending' },
      { 
        status: updates.status,
        adminNotes: updates.adminNotes,
        processedAt: new Date(),
        processedBy: req.admin.id
      }
    );
    
    res.json({ updatedCount: result.nModified });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;