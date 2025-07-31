const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authAdmin = require('../middleware/authAdmin');
const User = require('../models/User');

// GET /api/wallets - Get all wallet addresses for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('wallets');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ wallets: user.wallets });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/wallets/admin/search?q=... - Admin: Search users by email, username, or ID
router.get('/admin/search', auth, authAdmin, async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) return res.json({ users: [] });
    const users = await User.find({
      $or: [
        { email: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        { _id: q }
      ]
    }).select('email username _id');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/wallets/admin/:userId - Admin: Get all wallet details (including mnemonics) for a user
router.get('/admin/:userId', auth, authAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('wallets');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ wallets: user.wallets });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
