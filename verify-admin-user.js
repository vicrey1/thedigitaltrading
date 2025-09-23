const mongoose = require('mongoose');
const User = require('./server/models/User');

async function verifyAdminUser() {
  try {
    // Connect to MongoDB
    const mongoUri = 'mongodb://localhost:27017/luxyield';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);
    
    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log('  ID:', adminUser._id);
      console.log('  Email:', adminUser.email);
      console.log('  Role:', adminUser.role);
      console.log('  Name:', adminUser.name);
    } else {
      console.log('❌ Admin user not found');
    }
    
    // Find regular user for comparison
    const regularUser = await User.findOne({ email: 'testuser@example.com' });
    if (regularUser) {
      console.log('\n✅ Regular user found:');
      console.log('  ID:', regularUser._id);
      console.log('  Email:', regularUser.email);
      console.log('  Role:', regularUser.role);
      console.log('  Name:', regularUser.name);
    } else {
      console.log('❌ Regular user not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyAdminUser();