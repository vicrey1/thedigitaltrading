// server/models/MarketEvent.js
const mongoose = require('mongoose');

const MarketEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: true
  },
  impact: {
    type: {
      type: String,
      enum: ['fund_specific', 'global'],
      required: true
    }
  },
  affectedFunds: [{
    type: String,
    enum: ['Spot Market', 'Derivatives', 'Yield Farming', 'NFT Fund', 'Arbitrage']
  }],
  intensity: {
    type: Number,
    min: 0.1,
    max: 2.0,
    required: true
  },
  durationDays: {
    type: Number,
    default: 7
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true
  }
});

MarketEventSchema.pre('save', function(next) {
  // Set end date based on duration
  if (!this.endDate) {
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.endDate.getDate() + this.durationDays);
  }
  
  next();
});

module.exports = mongoose.model('MarketEvent', MarketEventSchema);