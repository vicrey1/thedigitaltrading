// server/routes/admin/userInvestments.js
const express = require('express');
const router = express.Router();
const Investment = require('../../models/Investment');
const User = require('../../models/User');
const authAdmin = require('../../middleware/authAdmin');

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
