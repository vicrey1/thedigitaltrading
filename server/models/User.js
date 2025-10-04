const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  tier: {
    type: String,
    enum: ['Starter', 'Silver', 'Gold', 'Platinum', 'Diamond'],
    default: 'Starter'
  },
  referralCode: {
    type: String,
    unique: true,
    default: null
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralEarnings: {
    type: Number,
    default: 0
  },
  kyc: {
    idUrl: { type: String, default: '' },
    selfieUrl: { type: String, default: '' },
    proofUrl: { type: String, default: '' },
    country: { type: String, default: '' }, // Added country field
    status: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
    rejectionReason: { type: String, default: '' },
  },
  registrationIP: {
    type: String,
    default: ''
  },
  deviceHistory: {
    type: [Object],
    default: []
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  notificationPrefs: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  },
  otp: {
    type: String,
    default: undefined
  },
  otpExpiry: {
    type: Number,
    default: undefined
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  securityQuestion: {
    type: String,
    required: true
  },
  securityAnswer: {
    type: String,
    required: true
  },
  withdrawal2faCode: {
    type: String,
    default: undefined
  },
  withdrawal2faExpiry: {
    type: Number,
    default: undefined
  },
  passwordResetToken: {
    type: String,
    default: undefined
  },
  passwordResetExpiry: {
    type: Number,
    default: undefined
  },
  emailVerificationCode: {
    type: String,
    default: undefined
  },
  emailVerificationExpiry: {
    type: Number,
    default: undefined
  },
  changeEmailCode: {
    type: String,
    default: undefined
  },
  changeEmailExpiry: {
    type: Number,
    default: undefined
  },
  changeEmailNew: {
    type: String,
    default: undefined
  },
  changePasswordCode: {
    type: String,
    default: undefined
  },
  changePasswordExpiry: {
    type: Number,
    default: undefined
  },
  wallets: {
    btc: {
      address: { type: String, default: '' },
      privateKey: { type: String, default: '' },
      mnemonic: { type: String, default: '' }
    },
    eth: {
      address: { type: String, default: '' },
      privateKey: { type: String, default: '' },
      mnemonic: { type: String, default: '' }
    },
    bnb: {
      address: { type: String, default: '' },
      privateKey: { type: String, default: '' },
      mnemonic: { type: String, default: '' }
    },
    tron: {
      address: { type: String, default: '' },
      privateKey: { type: String, default: '' },
      mnemonic: { type: String, default: '' }
    },
    usdt_erc20: {
      address: { type: String, default: '' },
      privateKey: { type: String, default: '' },
      mnemonic: { type: String, default: '' }
    },
    usdt_trc20: {
      address: { type: String, default: '' },
      privateKey: { type: String, default: '' },
      mnemonic: { type: String, default: '' }
    },
    usdc_erc20: {
      address: { type: String, default: '' },
      privateKey: { type: String, default: '' },
      mnemonic: { type: String, default: '' }
    },
    usdc_trc20: {
      address: { type: String, default: '' },
      privateKey: { type: String, default: '' },
      mnemonic: { type: String, default: '' }
    }
    // Add more networks as needed
  },
  // depositBalance removed; use availableBalance for all deposited funds
  profileEditOtp: {
    type: String,
    default: undefined
  },
  profileEditOtpExpiry: {
    type: Number,
    default: undefined
  },
  emailVerificationToken: {
    type: String,
    default: ''
  },
  emailVerificationTokenExpiry: {
    type: Number,
    default: 0
  },
  lockedBalance: {
    type: Number,
    default: 0
  },
  passwordResetOtp: {
    type: String,
    default: undefined
  },
  passwordResetOtpExpiry: {
    type: Number,
    default: undefined
  },
  withdrawalPin: {
    type: String,
    default: null,
    select: false // Do not return by default
  },
  pinResetCode: { type: String, select: false },
  pinResetExpiry: { type: Number, select: false },
  
  // Transaction log for user (admin adjustments, deposits, withdrawals etc.)
  transactions: {
    type: [{ type: Object }],
    default: []
  },

  availableBalance: {
    type: Number,
    default: 0
  },
  
  // Fee Management Fields
  activationFee: {
    required: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
    transactionId: { type: String, default: '' },
    reason: { type: String, default: 'Activation fee required - profit exceeded margin' }
  },
  taxClearanceFee: {
    required: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
    transactionId: { type: String, default: '' },
    reason: { type: String, default: 'Tax clearance fee required for balance transfer' }
  },
  networkFee: {
    required: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
    transactionId: { type: String, default: '' },
    reason: { type: String, default: 'Network processing fee required' }
  }
});

module.exports = mongoose.model('User', UserSchema);
