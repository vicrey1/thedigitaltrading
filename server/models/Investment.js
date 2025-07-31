// server/models/Investment.js
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdrawal', 'roi', 'gain', 'loss']
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  }
});

const InvestmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fundId: {
    type: String,
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currentValue: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  mature_at: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  fundName: {
    type: String,
    required: false,
    default: ''
  },
  planName: {
    type: String,
    required: false,
    default: ''
  },
  roiWithdrawn: {
    type: Boolean,
    default: false
  },
  transactions: [TransactionSchema]
}, {
  timestamps: true
});

const Investment = mongoose.model('Investment', InvestmentSchema);

// Auto-fix: Set planName to fundName if planName is empty on every find
const originalToObject = Investment.schema.methods.toObject || function() { return this; };
Investment.schema.methods.toObject = function(...args) {
  const obj = originalToObject.apply(this, args);
  if (!obj.planName && obj.fundName) {
    obj.planName = obj.fundName;
  }
  return obj;
};

module.exports = Investment;