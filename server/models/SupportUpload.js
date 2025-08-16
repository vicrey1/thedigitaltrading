const mongoose = require('mongoose');

const SupportUploadSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true, index: true },
  originalName: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storage: { type: String, enum: ['s3', 'disk'], default: 'disk' },
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('SupportUpload', SupportUploadSchema);
