const SibApiV3Sdk = require('@getbrevo/brevo');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const client = SibApiV3Sdk.ApiClient.instance;

// Configure API key authorization
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

// Create TransactionalEmailsApi instance
const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Send an email using Brevo API
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlContent - HTML content of the email
 * @returns {Promise<void>}
 */
async function sendVerificationEmail(to, subject, htmlContent) {
  try {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { 
      email: process.env.EMAIL_FROM || 'noreply@thedigitaltrading.com', 
      name: 'THE DIGITAL TRADING' 
    };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    const result = await tranEmailApi.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent via Brevo API to:', to);
    return result;
  } catch (error) {
    console.error('❌ Brevo API email error:', error.response?.body || error.message);
    throw error;
  }
}

module.exports = { sendVerificationEmail };
