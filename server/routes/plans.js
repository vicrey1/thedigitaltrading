// server/routes/plans.js
const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');

// GET /api/plans - Get all investment plans
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

module.exports = router;
