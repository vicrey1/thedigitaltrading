// server/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendMail({ to, subject, text, html }) {
  const mailOptions = {
    from: `"LUXYIELD" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };
  console.log('Sending email with options:', mailOptions);
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info);
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
}

module.exports = { sendMail, transporter };
