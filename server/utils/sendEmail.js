const transporter = require('../config/mailer');

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"LUXYIELD" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html
    });
    console.log("✅ Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email failed:", error.message);
    return false;
  }
};

module.exports = sendEmail;
