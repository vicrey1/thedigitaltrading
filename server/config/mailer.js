const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: '9809cb001@smtp-brevo.com',
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;
