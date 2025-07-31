const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const Investment = require('../models/Investment');
const auth = require('../middleware/auth');

// Get all goals for the logged-in user, with progress
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id });
    // For each goal, calculate invested and made
    const investments = await Investment.find({ user: req.user._id });
    const goalsWithProgress = goals.map(goal => {
      // For now, sum all investments for the user (can be improved to link investments to goals)
      const invested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const made = investments.reduce((sum, inv) => sum + (inv.gain || 0), 0);
      const progress = Math.min(100, invested / goal.targetAmount * 100);
      return { ...goal.toObject(), invested, made, progress };
    });
    res.json(goalsWithProgress);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Add a new goal
router.post('/', auth, async (req, res) => {
  try {
    const { title, targetAmount } = req.body;
    if (!title || !targetAmount) return res.status(400).json({ error: 'Title and target amount required' });
    const goal = new Goal({ user: req.user._id, title, targetAmount });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
  try {
    await Goal.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
