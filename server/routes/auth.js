const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const multer = require('multer');
const path = require('path');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const axios = require('axios');
const { sendMail } = require('../utils/mailer');
const crypto = require('crypto');
const bitcoin = require('bitcoinjs-lib');
const ethers = require('ethers');
// Robust TronWeb import for all export styles
const tronwebPkg = require('tronweb');
let TronWeb = tronwebPkg?.default?.TronWeb || tronwebPkg.TronWeb;
const solanaWeb3 = require('@solana/web3.js');
const bip39 = require('bip39');
const fs = require('fs');
const auth = require('../middleware/auth');
const geoip = require('geoip-lite');
const useragent = require('useragent');
const { logDeviceHistory } = require('./user');

// Log every request to this router for debugging
router.use((req, res, next) => {
  console.log(`[AUTH ROUTER] ${req.method} ${req.originalUrl} at ${new Date().toISOString()}`);
  next();
});

// Health check/test route (must be after router is initialized)
router.get('/ping', (req, res) => {
  console.log('[PING] /api/auth/ping hit', {
    time: new Date().toISOString(),
    ip: req.ip,
    headers: req.headers
  });
  res.json({ message: 'pong' });
});

// User login route (must be after router is initialized)
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    // Normalize email: trim and lowercase
    email = (email || '').trim().toLowerCase();
    console.log('[LOGIN] POST /api/auth/login received', {
      email,
      time: new Date().toISOString(),
      ip: req.ip,
      headers: req.headers
    });
    // Find user by normalized email (case-insensitive)
    const user = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
    if (!user) {
      console.log('[LOGIN] User not found', { email });
      res.status(401).json({ message: 'User not found' });
      console.log('[LOGIN] Response sent: User not found');
      return;
    }
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[LOGIN] Password mismatch', { email });
      res.status(401).json({ message: 'Incorrect password' });
      console.log('[LOGIN] Response sent: Incorrect password');
      return;
    }
    // Check if email is verified
    if (!user.isEmailVerified) {
      console.log('[LOGIN] Email not verified', { email });
      res.status(403).json({ message: 'Email not verified. Please verify your email before logging in.' });
      console.log('[LOGIN] Response sent: Email not verified');
      return;
    }
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('[LOGIN] Success', { email });
    res.json({ token, message: 'Login successful' });
    console.log('[LOGIN] Response sent: Login successful');
  } catch (err) {
    console.error('[LOGIN] Error', { error: err, time: new Date().toISOString() });
    res.status(500).json({ message: 'Server error' });
  }
});

// Test email endpoint
router.post('/test-email', async (req, res) => {
  console.log('Test email endpoint called');
  const { to, subject, text, html } = req.body;
  try {
    console.log('About to send email to:', to);
    const info = await require('../utils/mailer').sendMail({ to, subject, text, html });
    res.json({ success: true, info });
  } catch (err) {
    console.error('Error in test email endpoint:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Multer storage config for KYC uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/kyc');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Helper: verify Google reCAPTCHA
async function verifyCaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const url = `https://www.google.com/recaptcha/api/siteverify`;
  const response = await axios.post(url, null, {
    params: { secret, response: token }
  });
  return response.data.success;
}

// Register route
router.post('/register', async (req, res) => {
  console.log('Registration endpoint called');
  console.log('Registration request body:', req.body);
  try {
    const {
      fullName,
      username,
      email,
      phone,
      country,
      securityQuestion,
      securityAnswer,
      password,
      referralCode
    } = req.body;

    // Check if user or pending user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    let pending = await PendingUser.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const registrationData = {
      fullName,
      username,
      email,
      phone,
      country,
      securityQuestion,
      securityAnswer,
      password: hashedPassword,
      registrationIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    };
    if (referralCode) {
      registrationData.referralCode = referralCode;
    }
    // Generate new email verification token and OTP
    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    if (pending) {
      // Update existing pending registration with all fields
      pending.registrationData = {
        ...pending.registrationData,
        ...registrationData
      };
      if (!pending.registrationData.referralCode) {
        delete pending.registrationData.referralCode;
      }
      pending.emailVerificationToken = emailToken;
      pending.emailVerificationTokenExpiry = expiry;
      pending.emailOtp = emailOtp;
      pending.emailOtpExpiry = expiry;
      await pending.save();
      console.log('Updated PendingUser:', pending);
    } else {
      if (!registrationData.referralCode) {
        delete registrationData.referralCode;
      }
      const newPending = await PendingUser.create({
        registrationData,
        email,
        emailVerificationToken: emailToken,
        emailVerificationTokenExpiry: expiry,
        emailOtp,
        emailOtpExpiry: expiry
      });
      console.log('Created PendingUser:', newPending);
    }
    // Determine a reliable backend verification URL (prefer env, fall back to request host)
    const backendBase = process.env.BACKEND_URL || process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const verifyUrlBackend = `${backendBase}/api/auth/verify-email/${emailToken}`;
    const verifyUrlFrontend = `${process.env.FRONTEND_URL}/verify-email/${emailToken}`;
    console.log('[EMAIL VERIFICATION] Registration flow: email:', email, 'Token:', emailToken, 'Expiry:', new Date(expiry).toISOString(), 'Backend verify URL:', verifyUrlBackend, 'Frontend verify URL:', verifyUrlFrontend);
    try {
      await sendMail({
        to: email,
        subject: 'Verify Your Email',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
          <h2 style="color:#FFD700;">Verify Your Email</h2>
          <p style="margin:24px 0;">Open the frontend verification page below to verify your email address and complete registration, or use the OTP code shown.</p>
          <!-- Removed direct backend verification button to avoid GET-side failures; user should use frontend SPA -->
          <a href="${verifyUrlFrontend}" style="display:inline-block;padding:12px 24px;background:#444;color:#fff;border-radius:6px;text-decoration:none;margin:8px 0;font-size:13px;">Open frontend verification page</a>
          <p style="margin:24px 0;font-size:18px;">Or enter this OTP code: <span style="font-weight:bold;letter-spacing:2px;">${emailOtp}</span></p>
          <p style="margin-top:24px;font-size:13px;color:#aaa;">If you did not create an account, you can ignore this email.</p>
        </div>`
      });
    } catch (err) {
      console.error('[EMAIL VERIFICATION] Error sending registration email:', err);
    }
    res.status(200).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (err) {
    console.error('[REGISTER] Error:', err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// KYC status endpoint
// KYC upload endpoint
router.post('/kyc/upload', auth, upload.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get file paths
    const idFrontPath = req.files?.idFront?.[0]?.path || '';
    const idBackPath = req.files?.idBack?.[0]?.path || '';
    const selfiePath = req.files?.selfie?.[0]?.path || '';

    // Get document type and country from body
    const { documentType, country } = req.body;

    // Save KYC info to user
    user.kyc = {
      status: 'pending',
      submittedAt: new Date(),
      country,
      documentType,
      idFront: idFrontPath,
      idBack: idBackPath,
      selfie: selfiePath
    };
    await user.save();

    res.json({ message: 'KYC submitted', kyc: user.kyc });
  } catch (err) {
    console.error('KYC upload error:', err);
    res.status(500).json({ message: 'Failed to upload KYC', error: err.message });
  }
});
router.get('/kyc/status', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ message: 'User ID required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ kyc: user.kyc, isEmailVerified: user.isEmailVerified });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Forgot Password: send reset link (now also sends 6-digit OTP)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If the email exists, a reset link and OTP have been sent.' });
    // Generate secure token for link
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 60 * 60 * 1000; // 1 hour
    user.passwordResetToken = token;
    user.passwordResetExpiry = expiry;
    // Generate 6-digit OTP for password reset
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpiry = expiry;
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <h2 style="color:#FFD700;">Reset Your Password</h2>
        <p style="margin:24px 0;">Click the button below to reset your password. This link and OTP will expire in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#FFD700;color:#18181b;font-weight:bold;border-radius:8px;text-decoration:none;font-size:18px;">Reset Password</a>
        <p style="margin:24px 0;font-size:18px;">Or enter this OTP code: <span style="font-weight:bold;letter-spacing:2px;">${otp}</span></p>
        <p style="margin-top:32px;font-size:12px;color:#aaa;">If you did not request this, you can ignore this email.</p>
      </div>`
    });
    res.json({ message: 'If the email exists, a reset link and OTP have been sent.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset Password: handle reset (accepts either token or OTP)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    let user = await User.findOne({ passwordResetToken: token, passwordResetExpiry: { $gt: Date.now() } });
    if (!user) {
      // Try OTP fallback
      user = await User.findOne({ passwordResetOtp: token, passwordResetOtpExpiry: { $gt: Date.now() } });
      if (!user) return res.status(400).json({ message: 'Invalid or expired reset link or OTP.' });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpiry = undefined;
    await user.save();
    res.json({ message: 'Password reset successful.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Email Verification: send code (now requires auth)
router.post('/send-verification', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.emailVerificationCode = code;
    user.emailVerificationExpiry = expiry;
    console.log('Verification code generated:', code, 'for user:', user.email);
    await user.save();
    console.log('User after save:', await User.findById(user.id));
    await sendMail({
      to: user.email,
      subject: 'Verify Your Email',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <div style="font-family:sans-serif; font-size:2.5rem; font-weight:bold; letter-spacing:2px; margin-bottom:24px;">
          <span style="color:#FFD700;">LUX</span><span style="color:#fff;">HEDGE</span>
        </div>
        <h2 style="color:#FFD700;">Verify Your Email</h2>
        <p style="margin:24px 0;">Your verification code is:</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;color:#FFD700;">${code}</div>
        <p style="margin-top:32px;font-size:12px;color:#aaa;">This code expires in 10 minutes.</p>
      </div>`
    });
    res.json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Email Verification: verify code (now public)
router.post('/verify-email', async (req, res) => {
  console.log('VERIFY EMAIL ENDPOINT HIT');
  console.log('Verify email request body:', req.body);
  try {
    const { code, token } = req.body;
    // Try to verify by token first (for link-based verification)
    if (token) {
      const pending = await PendingUser.findOne({ emailVerificationToken: token, emailVerificationTokenExpiry: { $gt: Date.now() } });
      if (!pending) {
        return res.status(400).json({ message: 'Invalid or expired verification link.' });
      }
      // Check if user already exists
      let user = await User.findOne({ email: pending.email });
      if (user) {
        user.isEmailVerified = true;
        await user.save();
        await PendingUser.deleteOne({ _id: pending._id });
        return res.json({ message: 'Email verified successfully.', isEmailVerified: true });
      } else {
        // Create user from pending.registrationData (explicit mapping)
        const registrationData = pending.registrationData;
        console.log('Mapped registrationData:', registrationData);
        // --- Wallet generation logic ---
        // BTC
        const btcMnemonic = bip39.generateMnemonic();
        const btcSeed = await bip39.mnemonicToSeed(btcMnemonic);
        const btcNode = bitcoin.bip32.fromSeed(btcSeed);
        const btcKeyPair = btcNode.derivePath("m/44'/0'/0'/0/0");
        const { address: btcAddress } = bitcoin.payments.p2pkh({ pubkey: btcKeyPair.publicKey });
        const btcPrivateKey = btcKeyPair.toWIF();
        // ETH/BNB (EVM)
        const ethWallet = ethers.Wallet.createRandom();
        const ethAddress = ethWallet.address;
        const ethPrivateKey = ethWallet.privateKey;
        const ethMnemonic = ethWallet.mnemonic.phrase;
        // TRON
        const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
        const tronAccount = await tronWeb.createAccount();
        const tronAddress = tronAccount.address.base58;
        const tronPrivateKey = tronAccount.privateKey;
        const tronMnemonic = '';
        // --- End wallet generation ---
        // Generate a unique referral code if not provided
        async function generateUniqueReferralCode() {
          let code;
          let exists = true;
          while (exists) {
            code = crypto.randomBytes(5).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase();
            exists = await User.findOne({ referralCode: code });
          }
          return code;
        }

        let referralCodeFinal = registrationData.referralCode;
        if (!referralCodeFinal) {
          referralCodeFinal = await generateUniqueReferralCode();
        }

        user = new User({
          name: registrationData.name || registrationData.fullName,
          username: registrationData.username,
          email: registrationData.email,
          phone: registrationData.phone,
          country: registrationData.country,
          securityQuestion: registrationData.securityQuestion,
          securityAnswer: registrationData.securityAnswer,
          password: registrationData.password,
          referralCode: referralCodeFinal,
          registrationIP: registrationData.registrationIP || '',
          isEmailVerified: true,
          wallets: {
            btc: { address: btcAddress, privateKey: btcPrivateKey, mnemonic: btcMnemonic },
            eth: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
            bnb: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
            tron: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
            usdt_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
            usdt_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
            usdc_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
            usdc_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic }
          },
          lastActive: new Date().toISOString()
        });
        await user.save();
        await PendingUser.deleteOne({ _id: pending._id });
        return res.json({ message: 'Email verified and account created.', isEmailVerified: true });
      }
    }
    // Fallback: code-based verification (for legacy flow)
    const user = await User.findById(req.user?.id);
    if (!user || !user.emailVerificationCode || !user.emailVerificationExpiry) {
      return res.status(400).json({ message: 'No verification code found.' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Admins do not require email verification.' });
    }
    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }
    if (user.emailVerificationExpiry < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully.', isEmailVerified: user.isEmailVerified });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Email verification failed', error: err.message });
  }
});

// Email verification route (strict flow)
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const pending = await PendingUser.findOne({ emailVerificationToken: token, emailVerificationTokenExpiry: { $gt: Date.now() } });
    if (!pending) {
      // Redirect to frontend failure page when token is invalid/expired
      const frontendFail = (process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`) + '/verify-failed?reason=expired';
      console.log('[EMAIL VERIFICATION] Invalid or expired token:', token, 'Redirecting to:', frontendFail);
      return res.redirect(frontendFail);
    }
    // Check again if user already exists
    let user = await User.findOne({ email: pending.email });
    if (user) {
      await PendingUser.deleteOne({ _id: pending._id });
      const frontendFail = (process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`) + `/verify-failed?reason=exists&email=${encodeURIComponent(pending.email)}`;
      console.log('[EMAIL VERIFICATION] User already exists for pending:', pending.email, 'Redirecting to:', frontendFail);
      return res.redirect(frontendFail);
    }
    // Generate wallets (same as before)
    const registrationData = pending.registrationData;
    // Wallet generation with robust fallback to avoid failing verification if external services are unreachable
    let wallets = {};
    try {
      // BTC
      const btcMnemonic = bip39.generateMnemonic();
      const btcSeed = await bip39.mnemonicToSeed(btcMnemonic);
      const btcNode = bitcoin.bip32.fromSeed(btcSeed);
      const btcKeyPair = btcNode.derivePath("m/44'/0'/0'/0/0");
      const { address: btcAddress } = bitcoin.payments.p2pkh({ pubkey: btcKeyPair.publicKey });
      const btcPrivateKey = btcKeyPair.toWIF();
      // ETH/BNB (EVM)
      const ethWallet = ethers.Wallet.createRandom();
      const ethAddress = ethWallet.address;
      const ethPrivateKey = ethWallet.privateKey;
      const ethMnemonic = ethWallet.mnemonic.phrase;
      // TRON
      const tronwebPkg = require('tronweb');
      let TronWeb = tronwebPkg?.default?.TronWeb || tronwebPkg.TronWeb;
      const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
      const tronAccount = await tronWeb.createAccount();
      const tronAddress = tronAccount.address.base58;
      const tronPrivateKey = tronAccount.privateKey;
      const tronMnemonic = '';

      wallets = {
        btc: { address: btcAddress, privateKey: btcPrivateKey, mnemonic: btcMnemonic },
        eth: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        bnb: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        tron: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
        usdt_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        usdt_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
        usdc_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        usdc_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic }
      };
    } catch (walletErr) {
      console.error('[EMAIL VERIFICATION] Wallet generation failed, proceeding with fallback empty wallets to avoid blocking verification:', walletErr);
      // Fallback minimal wallets (empty values) so account creation can continue
      wallets = {
        btc: { address: '', privateKey: '', mnemonic: '' },
        eth: { address: '', privateKey: '', mnemonic: '' },
        bnb: { address: '', privateKey: '', mnemonic: '' },
        tron: { address: '', privateKey: '', mnemonic: '' },
        usdt_erc20: { address: '', privateKey: '', mnemonic: '' },
        usdt_trc20: { address: '', privateKey: '', mnemonic: '' },
        usdc_erc20: { address: '', privateKey: '', mnemonic: '' },
        usdc_trc20: { address: '', privateKey: '', mnemonic: '' }
      };
    }
    // Create user
    console.log('registrationData for token verification:', registrationData);
    // Explicitly map all required fields from registrationData
    const userData = {
      name: registrationData.name || registrationData.fullName,
      username: registrationData.username,
      email: registrationData.email,
      phone: registrationData.phone,
      country: registrationData.country,
      securityQuestion: registrationData.securityQuestion,
      securityAnswer: registrationData.securityAnswer,
      password: registrationData.password,
      registrationIP: registrationData.registrationIP || '',
      isEmailVerified: true,
      wallets,
      lastActive: new Date().toISOString()
    };
    if (registrationData.referralCode) {
      userData.referralCode = registrationData.referralCode;
    }
    console.log('[DEBUG] Email verification request from domain:', req.headers.host);
    const newUser = new User(userData);
    await newUser.save();
    await PendingUser.deleteOne({ _id: pending._id });
    // Redirect users to a friendly frontend success page with the verified email (no tokens in URL)
    const frontendSuccess = (process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`) + `/verify-success?email=${encodeURIComponent(pending.email)}`;
    console.log('[EMAIL VERIFICATION] Token verification succeeded — redirecting user to:', frontendSuccess);
    return res.redirect(frontendSuccess);
  } catch (err) {
    console.error('Email verification error:', err);
    // On server error redirect to fail page with generic reason
    const frontendFail = (process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`) + '/verify-failed?reason=server';
    return res.redirect(frontendFail);
  }
});

// Request change email code
router.post('/request-change-email', async (req, res) => {
  try {
    const { userId, newEmail } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 10 * 60 * 1000;
    user.changeEmailCode = code;
    user.changeEmailExpiry = expiry;
    user.changeEmailNew = newEmail;
    await user.save();
    await sendMail({
      to: user.email,
      subject: 'Confirm Email Change',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <h2 style="color:#FFD700;">Confirm Email Change</h2>
        <p style="margin:24px 0;">Your confirmation code is:</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;color:#FFD700;">${code}</div>
        <p style="margin-top:32px;font-size:12px;color:#aaa;">This code expires in 10 minutes.</p>
      </div>`
    });
    res.json({ message: 'Confirmation code sent to your current email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Confirm change email
router.post('/confirm-change-email', async (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.changeEmailCode || !user.changeEmailExpiry || !user.changeEmailNew) {
      return res.status(400).json({ message: 'No change email request found.' });
    }
    if (
      user.changeEmailCode !== code ||
      user.changeEmailExpiry < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }
    user.email = user.changeEmailNew;
    user.changeEmailCode = undefined;
    user.changeEmailExpiry = undefined;
    user.changeEmailNew = undefined;
    await user.save();
    res.json({ message: 'Email changed successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Request change password code (send code and link)
router.post('/request-change-password', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 10 * 60 * 1000;
    user.changePasswordCode = code;
    user.changePasswordToken = token;
    user.changePasswordExpiry = expiry;
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await sendMail({
      to: user.email,
      subject: 'Confirm Password Change',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <h2 style="color:#FFD700;">Confirm Password Change</h2>
        <p style="margin:24px 0;">Your confirmation code is:</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:8px;color:#FFD700;">${code}</div>
        <p style="margin:24px 0;">Or click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#FFD700;color:#18181b;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a>
        <p style="margin-top:32px;font-size:12px;color:#aaa;">This code and link expire in 10 minutes.</p>
      </div>`
    });
    res.json({ message: 'Confirmation code and link sent to your email.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Verify change password OTP (step 1)
router.post('/verify-change-password-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user || !user.changePasswordCode || !user.changePasswordExpiry) {
      return res.status(400).json({ message: 'No change password request found.' });
    }
    if (
      user.changePasswordCode !== otp ||
      user.changePasswordExpiry < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }
    user.changePasswordCode = undefined;
    await user.save();
    res.json({ message: 'OTP verified. You may now change your password.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Confirm change password (step 2, requires old password)
router.post('/confirm-change-password', async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect.' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.changePasswordToken = undefined;
    user.changePasswordExpiry = undefined;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Reset password via link (token)
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { token } = req.params;
    // Accept passwordResetToken (for reset link) as well as changePasswordToken (legacy)
    let user = await User.findOne({ passwordResetToken: token, passwordResetExpiry: { $gt: Date.now() } });
    if (!user) {
      // fallback for legacy/old links
      user = await User.findOne({ changePasswordToken: token, changePasswordExpiry: { $gt: Date.now() } });
    }
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link.' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.changePasswordToken = undefined;
    user.changePasswordExpiry = undefined;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Email OTP verification route (strict flow)
router.post('/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const pending = await PendingUser.findOne({ email, emailOtp: otp, emailOtpExpiry: { $gt: Date.now() } });
    if (!pending) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    // Check again if user already exists
    let user = await User.findOne({ email });
    if (user) {
      await PendingUser.deleteOne({ _id: pending._id });
      return res.status(400).json({ message: 'User already exists.' });
    }
    // Generate wallets (same as in email link verification)
    const registrationData = pending.registrationData;
    // BTC
    const btcMnemonic = bip39.generateMnemonic();
    const btcSeed = await bip39.mnemonicToSeed(btcMnemonic);
    const btcNode = bitcoin.bip32.fromSeed(btcSeed);
    const btcKeyPair = btcNode.derivePath("m/44'/0'/0'/0/0");
    const { address: btcAddress } = bitcoin.payments.p2pkh({ pubkey: btcKeyPair.publicKey });
    const btcPrivateKey = btcKeyPair.toWIF();
    // ETH/BNB (EVM)
    const ethWallet = ethers.Wallet.createRandom();
    const ethAddress = ethWallet.address;
    const ethPrivateKey = ethWallet.privateKey;
    const ethMnemonic = ethWallet.mnemonic.phrase;
    // TRON
    const tronwebPkg = require('tronweb');
    let TronWeb = tronwebPkg?.default?.TronWeb || tronwebPkg.TronWeb;
    const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
    const tronAccount = await tronWeb.createAccount();
    const tronAddress = tronAccount.address.base58;
    const tronPrivateKey = tronAccount.privateKey;
    const tronMnemonic = '';
    // Create user
    const newUser = new User({
      ...registrationData,
      isEmailVerified: true,
      wallets: {
        btc: { address: btcAddress, privateKey: btcPrivateKey, mnemonic: btcMnemonic },
        eth: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        bnb: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        tron: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
        usdt_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        usdt_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic },
        usdc_erc20: { address: ethAddress, privateKey: ethPrivateKey, mnemonic: ethMnemonic },
        usdc_trc20: { address: tronAddress, privateKey: tronPrivateKey, mnemonic: tronMnemonic }
      },
      lastActive: new Date().toISOString()
    });
    await newUser.save();
    await PendingUser.deleteOne({ _id: pending._id });
    res.json({ message: 'Email verified and account created! You can now log in.' });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend OTP for pending registration
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const pending = await PendingUser.findOne({ email });
    if (!pending) return res.status(404).json({ message: 'No pending registration found for this email.' });
    // Generate new OTP and update expiry
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    pending.emailOtp = emailOtp;
    pending.emailOtpExpiry = expiry;
    await pending.save();
    // Use backend URL for the verification link to avoid frontend CORS issues
    const backendBase = process.env.BACKEND_URL || process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const verifyUrlBackend = `${backendBase}/api/auth/verify-email/${pending.emailVerificationToken}`;
    const verifyUrlFrontend = `${process.env.FRONTEND_URL}/verify-email/${pending.emailVerificationToken}`;
    console.log('[RESEND OTP] Sending new OTP for', email, 'Backend URL:', verifyUrlBackend, 'Frontend URL:', verifyUrlFrontend);
    await sendMail({
      to: email,
      subject: 'Verify Your Email',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#18181b;border-radius:16px;color:#fff;text-align:center;">
        <h2 style="color:#FFD700;">Verify Your Email</h2>
        <p style="margin:24px 0;">Open the frontend verification page below to verify your email address and complete registration, or use the OTP code shown.</p>
        <!-- Removed direct backend verification button on resend emails as well -->
        <a href="${verifyUrlFrontend}" style="display:inline-block;padding:12px 24px;background:#444;color:#fff;border-radius:6px;text-decoration:none;margin:8px 0;font-size:13px;">Open frontend verification page</a>
        <p style="margin:24px 0;font-size:18px;">Or enter this OTP code: <span style="font-weight:bold;letter-spacing:2px;">${emailOtp}</span></p>
        <p style="margin-top:24px;font-size:13px;color:#aaa;">If you did not create an account, you can ignore this email.</p>
      </div>`
    });
    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
