const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testWithAuth() {
  console.log('🧪 Testing Support Chat with Authentication...\n');

  try {
    // Step 1: Login as a user to get a token
    console.log('1. Logging in as user...');
    const userLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'testuser@example.com',
      password: 'testpassword123'
    });
    
    const userToken = userLogin.data.token;
    console.log('✅ User login successful');

    // Step 2: Test user support endpoints with authentication
    console.log('\n2. Testing user support endpoints...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/support/tickets`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      console.log('✅ User support tickets endpoint working (status:', response.status + ')');
      console.log('📋 Tickets found:', response.data.length || 0);
    } catch (error) {
      console.log('❌ User support tickets error:', error.response?.status, error.response?.data?.error || error.message);
    }

    // Step 3: Login as admin
    console.log('\n3. Logging in as admin...');
    const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'adminpassword123'
    });
    
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful');

    // Step 4: Test admin support endpoints
    console.log('\n4. Testing admin support endpoints...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/support/tickets`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('✅ Admin support tickets endpoint working (status:', response.status + ')');
      console.log('📋 Tickets found:', response.data.length || 0);
    } catch (error) {
      console.log('❌ Admin support tickets error:', error.response?.status, error.response?.data?.error || error.message);
    }

    // Step 5: Test creating a support ticket
    console.log('\n5. Testing ticket creation...');
    
    try {
      const ticketData = {
        subject: 'Test Support Ticket',
        description: 'This is a test description for the support system that meets the minimum length requirement.',
        priority: 'medium',
        category: 'general'
      };
      
      const response = await axios.post(`${BASE_URL}/api/support/tickets`, ticketData, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      console.log('✅ Ticket creation successful (status:', response.status + ')');
      console.log('🎫 Ticket ID:', response.data.ticket._id);
      console.log('🎫 Ticket Number:', response.data.ticket.ticketId);
    } catch (error) {
      console.log('❌ Ticket creation error:', error.response?.status, error.response?.data?.error || error.message);
    }

    console.log('\n🎉 Support Chat Authentication Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testWithAuth();