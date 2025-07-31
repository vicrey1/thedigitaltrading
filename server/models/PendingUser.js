const mongoose = require('mongoose');

const PendingUserSchema = new mongoose.Schema({
  registrationData: { type: Object, required: true },
  email: { type: String, required: true, unique: true },
  emailVerificationToken: { type: String, required: true },
  emailVerificationTokenExpiry: { type: Number, required: true },
  emailOtp: {
    type: String,
    default: ''
  },
  emailOtpExpiry: {
    type: Number,
    default: 0
  },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // auto-delete after 24h
});

module.exports = mongoose.model('PendingUser', PendingUserSchema);
