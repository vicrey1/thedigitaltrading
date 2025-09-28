const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;
