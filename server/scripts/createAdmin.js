// createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'admin@thedigitaltrading.com',
      password: await bcrypt.hash('Admin@123', 10),
      role: 'admin',
      status: 'active'
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email:', adminData.email);
      console.log('Password: Admin@123');
    } else {
      const admin = new User(adminData);
      await admin.save();
      console.log('Admin user created successfully');
      console.log('Email:', adminData.email);
      console.log('Password: Admin@123');
    }

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();