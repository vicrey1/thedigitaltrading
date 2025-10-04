// server/routes/withdrawal.js
console.log('Withdrawal route loaded');

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const { sendMail } = require('../utils/mailer'); // Use mailer.js utility
const { getCryptoUSDPrices } = require('../utils/cryptoRates');

// Router-level logger to trace incoming requests to this router
router.use((req, res, next) => {
  console.log('[WITHDRAWAL ROUTER] Incoming:', req.method, req.originalUrl);
  next();
});

// Address validation helper
function validateAddress(address, network) {
  // Basic validation patterns
  const patterns = {
    'ERC20': /^0x[a-fA-F0-9]{40}$/,
    'BEP20': /^0x[a-fA-F0-9]{40}$/,
    'TRC20': /^T[A-Za-z1-9]{33}$/,
    'BTC': /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[ac-hj-np-z02-9]{11,71}$/
  };
  
  return patterns[network]?.test(address) || false;
}

// Simulate withdrawal request
router.post('/', auth, async (req, res) => {
  try {
    console.log('[WITHDRAWAL API] Incoming request:', req.body);
    const { amount, currency, network, address, pin } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!amount || !currency || !network || !address || !pin) {
      return res.status(400).json({ msg: 'Please provide all required fields including PIN' });
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ msg: 'Invalid withdrawal amount' });
    }

    // Validate network based on currency
    const validNetworks = {
      'USDT': ['ERC20', 'TRC20', 'BEP20'],
      'BTC': ['BTC'],
      'ETH': ['ERC20']
    };
    if (!validNetworks[currency]?.includes(network)) {
      return res.status(400).json({ msg: 'Invalid network for selected currency' });
    }

    // Validate address format based on network
    if (!validateAddress(address, network)) {
      return res.status(400).json({ msg: 'Invalid wallet address for selected network' });
    }

    const user = await User.findById(userId).select('+withdrawalPin +balance');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check user balance
    if (user.balance < Number(amount)) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Deduct amount from user's available balance
    if (user.availableBalance < Number(amount)) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Calculate network fee once at the start
    const networkFeeAmount = Number(amount) * 0.2;
    
    // Update user's available balance
    if (user.availableBalance < Number(amount)) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }
    user.availableBalance -= Number(amount);
    await user.save();

    if (!user.withdrawalPin || user.withdrawalPin !== pin) {
      return res.status(400).json({ msg: 'Invalid withdrawal PIN' });
    }

    // Always return what the user entered and what will be sent
    const requestedAmount = Number(amount);
    const requestedCurrency = 'USD';
    let cryptoCurrency = currency;
    let cryptoAmount = Number(amount);
    let conversionRate = 1;

    // Create withdrawal record with pending status first
    const withdrawal = new Withdrawal({
      userId: userId,
      amount: requestedAmount,
      currency: cryptoCurrency,
      network,
      walletAddress: address,
      status: 'processing',
      networkFee: {
        required: true,
        amount: networkFeeAmount,
        paid: false,
        reason: `Network fee for withdrawal of $${requestedAmount.toFixed(2)} to ${address}`,
        walletAddress: '0x1234567890AbCdEf1234567890aBcDeF12345678'
      },
      createdAt: new Date()
    });

    await withdrawal.save();

    // Fetch live rates
    const rates = await getCryptoUSDPrices();

    // Robust currency selection with network fees
    if (currency === 'USDT') {
      // USDT is pegged to USD
      conversionRate = 1;
      cryptoAmount = Number(amount);
      cryptoCurrency = 'USDT';
      
      // Calculate 20% network fee
      const networkFee = Number(amount) * 0.2; // 20% of withdrawal amount
      
      // Return response with network fee requirement
      return res.json({
        success: true,
        withdrawalDetails: {
          amount: cryptoAmount,
          currency: cryptoCurrency,
          network,
          address,
          conversionRate
        },
        networkFee: {
          required: true,
          amount: networkFee,
          reason: 'A network fee of 20% of the withdrawal amount is required to process this withdrawal. This fee must be deposited separately.',
          paymentRequired: true
        }
      });
    } else if (currency === 'BTC' || network === 'BTC') {
      conversionRate = rates.BTC;
      cryptoAmount = Number(amount) / conversionRate;
      cryptoCurrency = 'BTC';
    } else if (currency === 'ETH' || network === 'ERC20') {
      conversionRate = rates.ETH;
      cryptoAmount = Number(amount) / conversionRate;
      cryptoCurrency = 'ETH';
    } else if (currency === 'BNB' || network === 'BEP20') {
      conversionRate = rates.BNB;
      cryptoAmount = Number(amount) / conversionRate;
      cryptoCurrency = 'BNB';
    } else if (currency === 'USDT' || network === 'USDT') {
      conversionRate = rates.USDT;
      cryptoAmount = Number(amount) / conversionRate;
      cryptoCurrency = 'USDT';
    } else {
      return res.status(400).json({ msg: 'Unsupported currency or network.' });
    }

    // Check user balance (in USD)
    if (user.depositBalance < requestedAmount) {
      return res.status(400).json({ msg: 'Insufficient balance for withdrawal.' });
    }

    user.depositBalance -= requestedAmount;
    await user.save();

    // Update withdrawal currency but keep status as pending until network fee is paid
    withdrawal.currency = cryptoCurrency;
    await withdrawal.save();

    // Format cryptoAmount to 8 decimals for display
    const cryptoAmountDisplay = cryptoAmount ? cryptoAmount.toFixed(8) : '0';

    console.log('[WITHDRAWAL API] Returning:', {
      requestedAmount,
      requestedCurrency,
      cryptoAmount: cryptoAmountDisplay,
      cryptoCurrency,
      conversionRate
    });
    res.json({
      success: true,
      msg: 'Withdrawal request submitted',
      withdrawal: withdrawal,
      requestedAmount,
      requestedCurrency,
      cryptoAmount: cryptoAmountDisplay,
      cryptoCurrency,
      conversionRate,
      networkFee: {
        required: true,
        amount: networkFeeAmount,
        message: `A network fee of ${networkFeeAmount.toFixed(2)} USD (20% of withdrawal amount) is required to process this withdrawal.`
      }
    });
  } catch (err) {
    console.error('[WITHDRAWAL API] Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Set or update withdrawal PIN
router.post('/set-withdrawal-pin', auth, async (req, res) => {
  try {
    const { pin, currentPin } = req.body;
    if (!/^[0-9]{6}$/.test(pin)) {
      return res.status(400).json({ msg: 'PIN must be exactly 6 digits.' });
    }
    const user = await User.findById(req.user.id).select('+withdrawalPin');
    if (!user) {
      console.error('User not found for PIN set:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // If user already has a PIN, verify the current PIN
    if (user.withdrawalPin) {
      if (!currentPin) {
        return res.status(400).json({ msg: 'Current PIN is required to set a new PIN' });
      }
      if (user.withdrawalPin !== currentPin) {
        return res.status(400).json({ msg: 'Current PIN is incorrect' });
      }
    }
    
    user.withdrawalPin = pin;
    await user.save();
    res.json({ success: true, msg: 'Withdrawal PIN set successfully.' });
  } catch (err) {
    console.error('Error setting withdrawal PIN:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Request PIN reset (send email code)
router.post('/request-pin-reset', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.pinResetCode = code;
    user.pinResetExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    await sendMail({
      to: user.email,
      subject: 'Withdrawal PIN Reset Code',
      text: `Your withdrawal PIN reset code is: ${code}`
    });
    res.json({ success: true, msg: 'PIN reset code sent to your email.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Reset PIN with code
router.post('/reset-pin', auth, async (req, res) => {
  try {
    const { code, newPin } = req.body;
    if (!/^[0-9]{6}$/.test(newPin)) {
      return res.status(400).json({ msg: 'PIN must be exactly 6 digits.' });
    }
    const user = await User.findById(req.user.id).select('+pinResetCode +pinResetExpiry');
    if (!user || !user.pinResetCode || !user.pinResetExpiry) {
      return res.status(400).json({ msg: 'No reset request found.' });
    }
    if (user.pinResetCode !== code || user.pinResetExpiry < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired code.' });
    }
    user.withdrawalPin = newPin;
    user.pinResetCode = undefined;
    user.pinResetExpiry = undefined;
    await user.save();
    res.json({ success: true, msg: 'Withdrawal PIN reset successfully.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Verify withdrawal PIN endpoint
router.post('/verify-pin', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!/^[0-9]{6}$/.test(pin)) {
      return res.status(400).json({ msg: 'PIN must be exactly 6 digits.' });
    }
    const user = await User.findById(req.user.id).select('+withdrawalPin');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (!user.withdrawalPin || user.withdrawalPin !== pin) {
      return res.status(400).json({ msg: 'Invalid withdrawal PIN' });
    }
    res.json({ success: true, msg: 'PIN is valid.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Pay network fee for a withdrawal
router.post('/:id/pay-network-fee', auth, async (req, res) => {
  try {
    console.log('[WITHDRAWAL API] Processing network fee payment:', {
      withdrawalId: req.params.id,
      userId: req.user.id
    });

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('[WITHDRAWAL API] Invalid withdrawal ID format');
      return res.status(400).json({ msg: 'Invalid withdrawal ID format' });
    }
    // Look up the withdrawal regardless of its current status so we can
    // return a helpful error if the user is trying to pay a fee for a
    // withdrawal that's already processing/completed/etc.
    const withdrawal = await Withdrawal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!withdrawal) {
      console.log('[WITHDRAWAL API] Withdrawal not found for user:', {
        withdrawalId: req.params.id,
        userId: req.user.id
      });
      return res.status(404).json({ msg: 'Withdrawal not found' });
    }

    // If network fee already submitted/verified, return a useful message
    const feeStatus = withdrawal.networkFee?.status || 'unpaid';
    if (feeStatus !== 'unpaid') {
      console.log('[WITHDRAWAL API] Network fee already submitted/processed:', {
        withdrawalId: withdrawal._id,
        feeStatus
      });
      return res.status(400).json({ msg: `Network fee already ${feeStatus}` });
    }

    // Optional: ensure withdrawal is still in a state where paying a fee makes sense
    if (['completed', 'failed', 'rejected'].includes(withdrawal.status)) {
      return res.status(400).json({ msg: `Cannot pay network fee for a withdrawal with status: ${withdrawal.status}` });
    }

    // After network fee payment, change status to pending for admin review
    withdrawal.status = 'pending';
    withdrawal.networkFee = withdrawal.networkFee || {};
    withdrawal.networkFee.status = 'pending_verification';
    withdrawal.networkFee.submittedAt = new Date();
    withdrawal.networkFee.paid = false; // actual on-chain/payment verification is done by admin
    await withdrawal.save();

    console.log('[WITHDRAWAL API] Network fee submission recorded:', {
      withdrawalId: withdrawal._id,
      feeAmount: withdrawal.networkFee.amount,
      networkFeeStatus: withdrawal.networkFee.status,
      topLevelStatus: withdrawal.status
    });

    return res.json({
      success: true,
      msg: 'Network fee submission recorded. Awaiting admin verification.',
      withdrawal
    });
  } catch (err) {
    console.error('[WITHDRAWAL API] Error processing network fee payment:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// Get network fee info for a specific withdrawal
router.get('/:id/network-fee', auth, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!withdrawal) {
      return res.status(404).json({ msg: 'Withdrawal not found' });
    }

    // Return network fee info if not paid
    if (withdrawal.networkFee && !withdrawal.networkFee.paid) {
      return res.json({
        success: true,
        withdrawalId: withdrawal._id,
        withdrawalDetails: {
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          network: withdrawal.network,
          address: withdrawal.walletAddress,
          status: withdrawal.status
        },
        networkFee: {
          required: true,
          amount: withdrawal.networkFee.amount,
          reason: 'A network fee of 20% of the withdrawal amount is required to process this withdrawal. This fee must be deposited separately.',
          paymentRequired: true,
          walletAddress: withdrawal.networkFee.walletAddress
        }
      });
    }

    return res.json({
      success: true,
      withdrawalDetails: {
        amount: withdrawal.amount,
        currency: withdrawal.currency,
        network: withdrawal.network,
        address: withdrawal.walletAddress,
        status: withdrawal.status
      }
    });
  } catch (err) {
    console.error('Error getting network fee info:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Admin endpoint to verify network fee payment
router.post('/:id/verify-network-fee', auth, async (req, res) => {
  try {
    const { action, notes } = req.body;

    if (!['verify', 'reject'].includes(action)) {
      return res.status(400).json({ msg: 'Invalid action. Must be either verify or reject.' });
    }

    const withdrawal = await Withdrawal.findOne({
      _id: req.params.id,
      'networkFee.status': 'pending_verification'
    });

    if (!withdrawal) {
      return res.status(404).json({ msg: 'No withdrawal found with pending network fee verification' });
    }

    // Update network fee status
    withdrawal.networkFee.status = action === 'verify' ? 'verified' : 'rejected';
    withdrawal.networkFee.verifiedAt = new Date();
    withdrawal.networkFee.verifiedBy = req.user.id;
    withdrawal.networkFee.adminNotes = notes;

    // Update withdrawal status based on admin action
    if (action === 'verify') {
      withdrawal.status = 'confirmed';
    } else {
      withdrawal.status = 'pending';
    }

    await withdrawal.save();

    console.log(`[WITHDRAWAL API] Network fee ${action}ed for withdrawal:`, {
      withdrawalId: withdrawal._id,
      status: withdrawal.status,
      networkFeeStatus: withdrawal.networkFee.status
    });

    res.json({
      success: true,
      msg: `Network fee ${action}ed successfully`,
      withdrawal: withdrawal
    });
  } catch (err) {
    console.error('[WITHDRAWAL API] Error verifying network fee:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;