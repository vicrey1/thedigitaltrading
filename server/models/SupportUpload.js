const mongoose = require('mongoose');

const SupportUploadSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  originalName: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportUpload', SupportUploadSchema);
