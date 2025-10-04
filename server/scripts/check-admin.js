require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const adminUsers = await User.find({ role: 'admin' });
    console.log('Admin users found:', adminUsers.length);
    
    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating default admin...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = new User({
        name: 'Admin',
        email: 'admin@thedigitaltrading.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await newAdmin.save();
      console.log('Default admin user created with:');
      console.log('Email: admin@thedigitaltrading.com');
      console.log('Password: admin123');
    } else {
      console.log('Admin users:');
      adminUsers.forEach(admin => {
        console.log(`- ${admin.email} (${admin.name})`);
      });
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();