const mongoose = require('mongoose');

const DepositSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 300 },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  method: { type: String, default: 'manual' },
  txId: { type: String, default: '' },
  adminNotes: { type: String, default: '' },
  confirmedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Deposit', DepositSchema);
