const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

async function setupTestData() {
  try {
    // Connect to MongoDB using the same URI as the server
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/luxyield';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);
    
    // Update test user to require fees
    const testEmail = 'testuser@example.com';
    let user = await User.findOne({ email: testEmail });
    
    if (user) {
      console.log(`Updating test user ${testEmail} to require all fees...`);
      user.activationFee.required = true;
      user.activationFee.amount = 500;
      user.taxClearanceFee.required = true;
      user.taxClearanceFee.amount = 300;
      user.networkFee.required = true;
      user.networkFee.amount = 100;
      user.withdrawalPin = '1234';
      user.availableBalance = 2000;
      user.lockedBalance = 500;
      await user.save();
      console.log(`✅ Updated test user ${testEmail} to require all fees`);
    } else {
      console.log(`❌ Test user ${testEmail} not found`);
    }
    
    // Create admin user for testing
    const adminEmail = 'admin@example.com';
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      console.log(`Creating admin user ${adminEmail}...`);
      const hashedPassword = await bcrypt.hash('adminpassword123', 10);
      
      adminUser = new User({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        username: 'admin123',
        phone: '+1234567891',
        country: 'United States',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'Red',
        referralCode: 'ADMIN' + Date.now(),
        role: 'admin',
        isEmailVerified: true
      });
      
      await adminUser.save();
      console.log(`✅ Admin user ${adminEmail} created`);
    } else {
      console.log(`ℹ️ Admin user ${adminEmail} already exists`);
    }
    
    console.log('\n📊 Test Data Summary:');
    console.log(`Regular User: ${testEmail} (password: testpassword123)`);
    console.log(`Admin User: ${adminEmail} (password: adminpassword123)`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

setupTestData();