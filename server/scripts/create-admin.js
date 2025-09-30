const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

async function createAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/luxyield';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);
    
    const adminEmail = 'admin@thedigitaltrading.com';
    const adminPassword = 'StrongPassword123';
    
    // Check if admin already exists
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      // Try finding by username if email doesn't match
      adminUser = await User.findOne({ username: 'admin' });
      if (adminUser) {
        console.log('Updating existing admin user found by username...');
        adminUser.email = adminEmail;
        adminUser.name = 'Admin User';
        adminUser.phone = '+1234567890';
        adminUser.country = 'United States';
        adminUser.securityQuestion = 'What is your favorite color?';
        adminUser.securityAnswer = 'Blue';
        adminUser.role = 'admin';
        adminUser.isEmailVerified = true;
        adminUser.referralCode = adminUser.referralCode || ('ADMIN' + Date.now());
        adminUser.password = await bcrypt.hash(adminPassword, 10);
        await adminUser.save();
        console.log('✅ Admin user updated successfully');
      } else {
        console.log('Creating new admin user...');
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        adminUser = new User({
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          username: 'admin',
          phone: '+1234567890',
          country: 'United States',
          securityQuestion: 'What is your favorite color?',
          securityAnswer: 'Blue',
          role: 'admin',
          isEmailVerified: true,
          referralCode: 'ADMIN' + Date.now()
        });
        await adminUser.save();
        console.log('✅ Admin user created successfully');
      }
    } else {
      console.log('Updating existing admin user found by email...');
      adminUser.name = 'Admin User';
      adminUser.username = 'admin';
      adminUser.phone = '+1234567890';
      adminUser.country = 'United States';
      adminUser.securityQuestion = 'What is your favorite color?';
      adminUser.securityAnswer = 'Blue';
      adminUser.role = 'admin';
      adminUser.isEmailVerified = true;
      adminUser.referralCode = adminUser.referralCode || ('ADMIN' + Date.now());
      adminUser.password = await bcrypt.hash(adminPassword, 10);
      await adminUser.save();
      console.log('✅ Admin user updated successfully');
    }
    
    console.log('\n📊 Admin Account Details:');
    console.log(`Email: ${adminEmail}`);
    console.log('Password: StrongPassword123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdmin();