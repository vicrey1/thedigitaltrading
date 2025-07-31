// server/routes/withdrawal.js
console.log('Withdrawal route loaded');

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const { sendMail } = require('../utils/mailer'); // Use mailer.js utility
const { getCryptoUSDPrices } = require('../utils/cryptoRates');

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

    const user = await User.findById(userId).select('+withdrawalPin');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (!user.withdrawalPin || user.withdrawalPin !== pin) {
      return res.status(400).json({ msg: 'Invalid withdrawal PIN' });
    }

    // Always return what the user entered and what will be sent
    const requestedAmount = Number(amount);
    const requestedCurrency = 'USD';
    let cryptoCurrency = '';
    let cryptoAmount = 0;
    let conversionRate = 1;

    // Fetch live rates
    const rates = await getCryptoUSDPrices();

    // Robust currency selection
    if (currency === 'BTC' || network === 'BTC') {
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

    // Create withdrawal record
    const newWithdrawal = new Withdrawal({
      userId: userId,
      amount: requestedAmount,
      currency: cryptoCurrency,
      network,
      walletAddress: address,
      status: 'pending',
      fee: 0
    });

    await newWithdrawal.save();

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
      withdrawal: newWithdrawal,
      requestedAmount,
      requestedCurrency,
      cryptoAmount: cryptoAmountDisplay,
      cryptoCurrency,
      conversionRate
    });
  } catch (err) {
    console.error('[WITHDRAWAL API] Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Set or update withdrawal PIN
router.post('/set-withdrawal-pin', auth, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!/^[0-9]{6}$/.test(pin)) {
      return res.status(400).json({ msg: 'PIN must be exactly 6 digits.' });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      console.error('User not found for PIN set:', req.user.id);
      return res.status(404).json({ msg: 'User not found' });
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

module.exports = router;