const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Withdrawal = require('../models/Withdrawal');

// Get all withdrawals for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawals = await Withdrawal.find({ userId }).sort('-createdAt');
    res.json({ success: true, withdrawals });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
