const express = require('express');
const router = express.Router();
const { transporter } = require('../utils/mailer');

router.post('/api/send-test', async (req, res) => {
  const { to } = req.body;
  try {
    const info = await transporter.sendMail({
      from: `"LUXYIELD" <${process.env.EMAIL_USER}>`,
      to: to || 'your@email.com',
      subject: '✅ LUXYIELD Email Test (via Brevo)',
      html: '<h2>This email was sent using Brevo SMTP and Nodemailer!</h2>'
    });
    res.json({ message: 'Email sent ✅', info });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Failed to send email ❌', error: err.message });
  }
});

module.exports = router;
