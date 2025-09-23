const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAdminAuth() {
  const adminCredentials = [
    { email: 'admin@thedigitaltrading.com', password: 'admin123' },
    { email: 'admin@admin.com', password: 'admin123' },
    { email: 'admin@luxhedge.com', password: 'admin123' },
    { email: 'admin@thedigitaltrading.com', password: 'password' },
    { email: 'admin@thedigitaltrading.com', password: 'admin' }
  ];

  for (let i = 0; i < adminCredentials.length; i++) {
    const { email, password } = adminCredentials[i];
    
    try {
      console.log(`🔐 Testing Admin Authentication Flow (Attempt ${i + 1})...\n`);

      // Step 1: Test admin login
      console.log(`1. Testing admin login with ${email}...`);
      const loginResponse = await axios.post(`${BASE_URL}/admin/auth/login`, {
        email,
        password
      });

    if (loginResponse.data.token && loginResponse.data.admin) {
      console.log('✅ Admin login successful');
      console.log(`   - Token received: ${loginResponse.data.token.substring(0, 20)}...`);
      console.log(`   - Admin name: ${loginResponse.data.admin.name}`);
      console.log(`   - Admin email: ${loginResponse.data.admin.email}`);
      console.log(`   - Admin role: ${loginResponse.data.admin.role}`);
    } else {
      console.log('❌ Admin login failed - missing token or admin data');
      return;
    }

    const token = loginResponse.data.token;

    // Step 2: Test token verification
    console.log('\n2. Testing token verification...');
    const verifyResponse = await axios.get(`${BASE_URL}/admin/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (verifyResponse.data.id && verifyResponse.data.role === 'admin') {
      console.log('✅ Token verification successful');
      console.log(`   - Admin ID: ${verifyResponse.data.id}`);
      console.log(`   - Admin name: ${verifyResponse.data.name}`);
      console.log(`   - Admin role: ${verifyResponse.data.role}`);
    } else {
      console.log('❌ Token verification failed');
      return;
    }

    // Step 3: Test protected admin endpoint (support sessions)
    console.log('\n3. Testing protected admin endpoint (support sessions)...');
    const sessionsResponse = await axios.get(`${BASE_URL}/support/admin/sessions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Protected endpoint access successful');
    console.log(`   - Sessions count: ${sessionsResponse.data.sessions ? sessionsResponse.data.sessions.length : 0}`);

    // Step 4: Test invalid token
    console.log('\n4. Testing invalid token...');
    try {
      await axios.get(`${BASE_URL}/admin/verify`, {
        headers: { Authorization: `Bearer invalid_token_123` }
      });
      console.log('❌ Invalid token test failed - should have been rejected');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Invalid token correctly rejected');
      } else {
        console.log('❌ Unexpected error with invalid token:', error.message);
      }
    }

      console.log('\n🎉 All admin authentication tests passed!');
      return; // Exit successfully

    } catch (error) {
      console.error(`❌ Admin authentication test failed for ${email}:`, error.message);
      if (error.response) {
        console.error('   - Status:', error.response.status);
        console.error('   - Data:', error.response.data);
      }
      console.log(''); // Add spacing between attempts
    }
  }
  
  console.log('❌ All admin credential attempts failed');
}

testAdminAuth();