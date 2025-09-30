const logger = require('../utils/logger');

// OTP validation middleware
const validateOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      logger.error('[OTP] Missing email or OTP in request', { email, hasOtp: !!otp });
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Log the OTP verification attempt
    logger.info('[OTP] Verification attempt', { email, otpLength: otp.length });

    // Add your OTP verification logic here
    // This could be checking against a database or cache

    next();
  } catch (err) {
    logger.error('[OTP] Validation error:', err);
    res.status(500).json({
      success: false,
      message: 'Error validating OTP',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// OTP generation middleware
const generateOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      logger.error('[OTP] Missing email in request');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    
    // Store the OTP (implement your storage logic)
    // For example: await storeOtp(email, otp);

    // Log OTP generation (but not the OTP itself in production)
    logger.info('[OTP] Generated for email', { email, otpLength: 6 });
    
    // Add the OTP to the request for the next middleware
    req.generatedOtp = otp;
    
    next();
  } catch (err) {
    logger.error('[OTP] Generation error:', err);
    res.status(500).json({
      success: false,
      message: 'Error generating OTP',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  validateOtp,
  generateOtp
};