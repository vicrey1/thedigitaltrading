
// server/routes/admin/userInvestments.js
const express = require('express');
const router = express.Router();
const Investment = require('../../models/Investment');
const User = require('../../models/User');
const authAdmin = require('../../middleware/authAdmin');

// Get user info (name) for a list of user IDs
router.post('/user-info', authAdmin, async (req, res) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds) || !userIds.length) return res.json({});
  const users = await User.find({ _id: { $in: userIds } }, { name: 1 });
  const userMap = {};
  users.forEach(u => { userMap[u._id] = { name: u.name }; });
  res.json(userMap);
});

// Search investments by userId, username, or name
router.get('/search', authAdmin, async (req, res) => {
  const { userId, username, name } = req.query;
  let userQuery = null;
  if (userId) {
    userQuery = { _id: userId };
  } else if (username) {
    // Only search users with a username field
    userQuery = { username: { $exists: true, $ne: null, $regex: username, $options: 'i' } };
  } else if (name) {
    // Only search users with a name field
    userQuery = { name: { $exists: true, $ne: null, $regex: name, $options: 'i' } };
  } else {
    return res.status(400).json({ error: 'No search parameter provided' });
  }
  try {
    const users = await User.find(userQuery).limit(10);
    if (!users.length) return res.json([]);
    // For autocomplete, return user info if searching by username or name and multiple users found
    if ((username || name) && users.length > 1) {
      return res.json(users.map(u => ({ _id: u._id, username: u.username, name: u.name })));
    }
    // If only one user, return their investments
    const user = users[0];
    const investments = await Investment.find({ user: user._id });
    res.json(investments);
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get all investments for a user
router.get('/:userId', authAdmin, async (req, res) => {
  const investments = await Investment.find({ user: req.params.userId });
  res.json(investments);
});

// Update an investment (admin can change any field)
router.put('/:investmentId', authAdmin, async (req, res) => {
  const investment = await Investment.findByIdAndUpdate(req.params.investmentId, req.body, { new: true });
  res.json(investment);
});

// Manually add to a user's investment portfolio value
router.post('/:investmentId/add', authAdmin, async (req, res) => {
  const { amount } = req.body;
  const investment = await Investment.findById(req.params.investmentId);
  if (!investment) return res.status(404).json({ msg: 'Investment not found' });
  investment.currentValue += parseFloat(amount);
  investment.transactions.push({
    type: 'roi',
    amount: parseFloat(amount),
    date: new Date(),
    description: 'Manual admin adjustment'
  });
  await investment.save();
  res.json(investment);
});

// Admin can force-complete an investment
router.post('/:investmentId/complete', authAdmin, async (req, res) => {
  const investment = await Investment.findById(req.params.investmentId);
  if (!investment) return res.status(404).json({ msg: 'Investment not found' });
  investment.status = 'completed';
  await investment.save();
  res.json(investment);
});

module.exports = router;
