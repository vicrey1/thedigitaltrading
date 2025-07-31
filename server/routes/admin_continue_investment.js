const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin');
// Admin: Continue (re-activate) a user's most recent completed investment
router.post('/users/:id/continue-completed-investment', authAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const Investment = require('../models/Investment');
    // Find the most recent completed investment for the user
    const completedInvestment = await Investment.findOne({ user: userId, status: 'completed' }).sort('-endDate');
    if (!completedInvestment) {
      return res.status(404).json({ error: 'No completed investment found for this user.' });
    }
    // Set status back to active and update endDate to a new future date
    completedInvestment.status = 'active';
    // Optionally, extend the endDate by the plan duration
    const PLAN_CONFIG = {
      Silver: { duration: 7 },
      Gold: { duration: 10 },
      Platinum: { duration: 15 },
      Diamond: { duration: 21 },
    };
    const plan = PLAN_CONFIG[completedInvestment.planName];
    if (plan) {
      const now = new Date();
      completedInvestment.startDate = now;
      completedInvestment.endDate = new Date(now.getTime() + plan.duration * 24 * 60 * 60 * 1000);
    }
    await completedInvestment.save();
    res.json({ success: true, investment: completedInvestment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
