const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

async function verifyTestUser() {
  try {
    // Connect to MongoDB using the same URI as the server
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/luxyield';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);
    
    const testEmail = 'testuser@example.com';
    
    // Find and verify the test user
    let user = await User.findOne({ email: testEmail });
    
    if (user) {
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        await user.save();
        console.log(`✅ Test user ${testEmail} has been verified`);
      } else {
        console.log(`ℹ️ Test user ${testEmail} is already verified`);
      }
    } else {
      // Create the test user
      console.log(`Creating test user ${testEmail}...`);
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      
      user = new User({
        name: 'Test User',
        email: testEmail,
        password: hashedPassword,
        username: 'testuser123',
        phone: '+1234567890',
        country: 'United States',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'Blue',
        referralCode: 'TEST' + Date.now(),
        isEmailVerified: true,
        activationFeeRequired: true,
        taxClearanceFeeRequired: true,
        networkFeeRequired: true
      });
      
      await user.save();
      console.log(`✅ Test user ${testEmail} created and verified`);
    }
    
    console.log('User details:');
    console.log(`  ID: ${user._id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Verified: ${user.isEmailVerified}`);
    console.log(`  Activation Fee Required: ${user.activationFeeRequired || false}`);
    console.log(`  Tax Clearance Fee Required: ${user.taxClearanceFeeRequired || false}`);
    console.log(`  Network Fee Required: ${user.networkFeeRequired || false}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

verifyTestUser();