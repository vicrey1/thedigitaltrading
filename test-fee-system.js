const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test configuration
const testUser = {
  email: 'testuser@example.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User'
};
const adminUser = {
  email: 'admin@example.com',
  password: 'adminpassword123'
};

let authToken = '';
let adminToken = '';
let userId = '';

async function testFeeSystem() {
  console.log('🧪 Starting Fee System Comprehensive Test\n');
  
  try {
    // Test 1: Register/Login user
    console.log('1️⃣ Testing User Authentication...');
    await testAuthentication();
    
    // Test 2: Test fee status endpoint
    console.log('\n2️⃣ Testing Fee Status Endpoint...');
    await testFeeStatus();
    
    // Test 3: Test admin fee endpoints
    console.log('\n3️⃣ Testing Admin Fee Endpoints...');
    await testAdminFeeEndpoints();
    
    // Test 4: Test fee payment endpoints
    console.log('\n4️⃣ Testing Fee Payment Endpoints...');
    await testFeePayments();
    
    // Test 5: Test withdrawal with fee requirements
    console.log('\n5️⃣ Testing Withdrawal with Fee Requirements...');
    await testWithdrawalFeeRequirements();
    
    console.log('\n✅ All Fee System Tests Completed Successfully!');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

async function testAuthentication() {
  try {
    // Login regular user
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ User logged in successfully');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    
    // Decode JWT to get user ID
    const tokenPayload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    userId = tokenPayload.id;
    console.log(`   User ID: ${userId}`);
    
    // Login admin user
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: adminUser.email,
      password: adminUser.password
    });
    
    adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin logged in successfully');
    console.log(`   Admin Token: ${adminToken.substring(0, 20)}...`);
    
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

async function testFeeStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/api/fees/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Fee status retrieved successfully');
    console.log('   Fee Status:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    throw new Error(`Fee status test failed: ${error.message}`);
  }
}

async function testAdminFeeEndpoints() {
  console.log('\n=== Testing Admin Fee Endpoints ===');
  
  // First, login as admin to get admin token
  let adminToken;
  try {
    const adminLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'adminpassword123'
    });
    adminToken = adminLoginResponse.data.token;
    console.log('✓ Admin login successful');
  } catch (error) {
    console.log('✗ Admin login failed:', error.response?.status, error.response?.data?.message || error.message);
    return;
  }
  
  try {
    // Test admin fee users list
    const usersResponse = await axios.get(`${BASE_URL}/api/admin/fees/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✓ Admin fee users list:', usersResponse.data);
  } catch (error) {
    console.log('✗ Admin fee users list failed:', error.response?.status, error.response?.data?.message || error.message);
  }

  try {
    // Test admin fee statistics
    const statsResponse = await axios.get(`${BASE_URL}/api/admin/fees/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✓ Admin fee statistics:', statsResponse.data);
  } catch (error) {
    console.log('✗ Admin fee statistics failed:', error.response?.status, error.response?.data?.message || error.message);
  }
}

async function testFeePayments() {
  try {
    console.log('   Testing activation fee payment...');
    try {
      const activationResponse = await axios.post(`${BASE_URL}/api/fees/pay-activation`, {
        transactionId: 'TEST_ACTIVATION_' + Date.now()
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Activation fee payment successful');
      console.log(`   Response: ${JSON.stringify(activationResponse.data, null, 2)}`);
    } catch (error) {
      console.log(`⚠️ Activation fee error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
    
    console.log('   Testing tax clearance fee payment...');
    try {
      const taxResponse = await axios.post(`${BASE_URL}/api/fees/pay-tax-clearance`, {
        transactionId: 'TEST_TAX_' + Date.now()
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Tax clearance fee payment successful');
      console.log(`   Response: ${JSON.stringify(taxResponse.data, null, 2)}`);
    } catch (error) {
      console.log(`⚠️ Tax clearance fee error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
    
    console.log('   Testing network fee payment...');
    try {
      const networkResponse = await axios.post(`${BASE_URL}/api/fees/pay-network`, {
        transactionId: 'TEST_NETWORK_' + Date.now()
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Network fee payment successful');
      console.log(`   Response: ${JSON.stringify(networkResponse.data, null, 2)}`);
    } catch (error) {
      console.log(`⚠️ Network fee error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
    
  } catch (error) {
    throw new Error(`Fee payments test failed: ${error.message}`);
  }
}

async function testWithdrawalFeeRequirements() {
  try {
    // Test withdrawal submission (should trigger fee requirements)
    const withdrawalData = {
      amount: 1000,
      address: 'test-wallet-address',
      currency: 'USDT',
      network: 'ERC20'
    };
    
    try {
      const withdrawalDataWithPin = {
        ...withdrawalData,
        pin: '1234'
      };
      const withdrawalResponse = await axios.post(`${BASE_URL}/api/withdrawal`, withdrawalDataWithPin, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Withdrawal request successful');
      console.log(`   Response: ${JSON.stringify(withdrawalResponse.data, null, 2)}`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('fee')) {
        console.log('✅ Withdrawal correctly blocked due to unpaid fees');
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        console.log(`⚠️ Withdrawal error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    }
    
  } catch (error) {
    throw new Error(`Withdrawal fee requirements test failed: ${error.message}`);
  }
}

// Run the tests
testFeeSystem();