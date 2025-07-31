const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin');
// Admin: Complete a user's active investment immediately
router.post('/users/:id/complete-active-investment', authAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const Investment = require('../models/Investment');
    // Find the active investment for the user
    const activeInvestment = await Investment.findOne({ user: userId, status: 'active' });
    if (!activeInvestment) {
      return res.status(404).json({ error: 'No active investment found for this user.' });
    }
    // Mark as completed and set currentValue to expected ROI value
    const PLAN_CONFIG = {
      Silver: { roi: 350 },
      Gold: { roi: 450 },
      Platinum: { roi: 550 },
      Diamond: { roi: 650 },
    };
    const plan = PLAN_CONFIG[activeInvestment.planName];
    if (plan) {
      const expectedValue = activeInvestment.amount + (activeInvestment.amount * plan.roi / 100);
      activeInvestment.currentValue = expectedValue;
    }
    activeInvestment.status = 'completed';
    activeInvestment.endDate = new Date();
    await activeInvestment.save();
    res.json({ success: true, investment: activeInvestment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
