const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function initializeLocalDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/luxyield', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB successfully');

    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ email: 'admin@thedigitaltrading.com' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        email: 'admin@thedigitaltrading.com',
        password: hashedPassword,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        isEmailVerified: true
      });
      await admin.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    // Create a test user if it doesn't exist
    const testUserExists = await User.findOne({ email: 'test@example.com' });
    if (!testUserExists) {
      const hashedPassword = await bcrypt.hash('test123', 10);
      const testUser = new User({
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        isEmailVerified: true
      });
      await testUser.save();
      console.log('Test user created successfully');
    } else {
      console.log('Test user already exists');
    }

    console.log('Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeLocalDB();