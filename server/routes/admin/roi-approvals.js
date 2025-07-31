// routes/admin/roi-approvals.js
const express = require('express');
const router = express.Router();
const Withdrawal = require('../../models/Withdrawal');
const auth = require('../../middleware/authAdmin');

// Get all pending ROI withdrawals
router.get('/', auth, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({
      type: 'roi',
      status: 'pending'
    })
      .sort('-createdAt')
      .populate('userId', 'email name');
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or reject ROI withdrawal
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, destination } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    if (status === 'completed' && destination === 'available') {
      withdrawal.status = 'confirmed';
      // Optionally, update user balances here if needed
    } else if (status === 'rejected') {
      withdrawal.status = 'rejected';
    }
    await withdrawal.save();
    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
