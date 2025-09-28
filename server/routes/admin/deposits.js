const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const authAdmin = require('../../middleware/authAdmin');
const Deposit = require('../../models/Deposit');
const User = require('../../models/User');

// GET all deposits (admin)
router.get('/', auth, authAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find().populate('user', 'name email').sort('-createdAt');
    res.json(deposits);
  } catch (err) {
    console.error('Admin get deposits error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET a single deposit by ID (admin)
router.get('/:id', auth, authAdmin, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id).populate('user', 'name email');
    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' });
    }
    res.json(deposit);
  } catch (err) {
    console.error('Admin get deposit by ID error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH to update a deposit status (admin)
router.patch('/:id', auth, authAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' });
    }

    const oldStatus = deposit.status;
    deposit.status = status;

    // If confirming a deposit, credit the user's balance
    if (status === 'confirmed' && oldStatus !== 'confirmed') {
      const user = await User.findById(deposit.user);
      if (user) {
        user.depositBalance = (user.depositBalance || 0) + deposit.amount;
        await user.save();
      }
      deposit.confirmedAt = new Date();
    }

    await deposit.save();
    res.json(deposit);
  } catch (err) {
    console.error('Admin update deposit error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
