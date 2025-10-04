const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5001/api';

async function testJWTTokens() {
  console.log('🔍 Testing JWT Token Contents...\n');

  try {
    // 1. Login as regular user
    console.log('1. Logging in as regular user...');
    const userResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser@example.com',
      password: 'testpassword123'
    });
    
    const userToken = userResponse.data.token;
    console.log('✅ User login successful');
    
    // Decode user token
    const userDecoded = jwt.decode(userToken);
    console.log('👤 User token payload:', JSON.stringify(userDecoded, null, 2));
    
    // 2. Login as admin
    console.log('\n2. Logging in as admin...');
    const adminResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'adminpassword123'
    });
    
    const adminToken = adminResponse.data.token;
    console.log('✅ Admin login successful');
    
    // Decode admin token
    const adminDecoded = jwt.decode(adminToken);
    console.log('👑 Admin token payload:', JSON.stringify(adminDecoded, null, 2));
    
    // Compare tokens
    console.log('\n🔍 Token Comparison:');
    console.log('User ID:', userDecoded.id);
    console.log('Admin ID:', adminDecoded.id);
    console.log('User Role:', userDecoded.role);
    console.log('Admin Role:', adminDecoded.role);
    console.log('Same ID?', userDecoded.id === adminDecoded.id);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testJWTTokens();