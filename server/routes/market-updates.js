const express = require('express');
const router = express.Router();
const MarketUpdate = require('../models/MarketUpdate');

// Public: Get latest market updates
router.get('/', async (req, res) => {
  try {
    const updates = await MarketUpdate.find().sort('-createdAt').limit(10);
    res.json(updates);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch market updates', error: err.message });
  }
});

module.exports = router;
