// Usage: node scripts/test_send_email.js
const { sendMail } = require('../utils/mailer');

(async () => {
  try {
    const info = await sendMail({
      to: 'vameh09@gmail.com', // <-- Change this to your email address for testing
      subject: 'LUXYIELD Test Email',
      text: 'This is a test email from your LUXYIELD backend.',
      html: '<h2>This is a test email from your <b>LUXYIELD</b> backend.</h2>'
    });
    console.log('Test email sent:', info);
  } catch (err) {
    console.error('Test email failed:', err);
  }
})();
