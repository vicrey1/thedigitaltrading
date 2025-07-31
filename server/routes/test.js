const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');

router.get('/send-otp', async (req, res) => {
  const to = req.query.email || 'your@email.com';
  const sent = await sendEmail(
    to,
    "LUXYIELD OTP Verification",
    `
    <div style="font-family:sans-serif;padding:20px;background:#111;color:#fff;border-radius:12px;text-align:center;">
      <h2 style="color:#FFD700;">Verify Your Email</h2>
      <p>Your OTP is:</p>
      <h1 style="letter-spacing:10px;">449577</h1>
      <p>This code expires in 10 minutes.</p>
    </div>
    `
  );
  res.status(sent ? 200 : 500).json({
    message: sent ? `✅ OTP sent to ${to}` : "❌ Failed to send"
  });
});

module.exports = router;
