const mongoose = require('mongoose');

const MarketUpdateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MarketUpdate', MarketUpdateSchema);
