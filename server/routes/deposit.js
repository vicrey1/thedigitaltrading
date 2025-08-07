const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Deposit = require('../models/Deposit');
const User = require('../models/User');

// POST /api/deposit, Create a new deposit
router.post('/', auth, async (req, res) => {
  try {
    const { amount, method } = req.body;
    if (!amount || isNaN(amount) || amount < 300) {
      return res.status(400).json({ error: 'Minimum deposit is $300' });
    }
    const deposit = new Deposit({
      user: req.user.id,
      amount,
      method: method || 'manual',
      status: 'pending'
    });
    await deposit.save();
    res.json({ success: true, deposit });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/deposit/history, Get user's deposit history
router.get('/history', auth, async (req, res) => {
  try {
    const deposits = await Deposit.find({ user: req.user.id }).sort('-createdAt');
    res.json({ deposits });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/deposit/confirm, Simulate confirming a deposit for testing
router.post('/confirm', auth, async (req, res) => {
  try {
    const { depositId } = req.body;
    const deposit = await Deposit.findById(depositId);
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' });
    if (deposit.status === 'confirmed') return res.json({ message: 'Already confirmed' });
    deposit.status = 'confirmed';
    deposit.confirmedAt = new Date();
    await deposit.save();
    // Credit user's depositBalance
    const user = await User.findById(deposit.user);
    if (user) {
      user.depositBalance = (user.depositBalance || 0) + deposit.amount;
      await user.save();
    }
    res.json({ success: true, deposit });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
