const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testAdminCarEndpoint() {
  try {
    console.log('🔐 Testing Admin Car Retrieval Endpoint...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@thedigitaltrading.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Get all cars to find a valid ID
    console.log('\n2. Getting all cars to find a valid ID...');
    const carsResponse = await axios.get(`${BASE_URL}/cars/admin/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const cars = carsResponse.data.cars;
    if (cars.length === 0) {
      console.log('❌ No cars found in database');
      return;
    }

    const testCarId = cars[0]._id;
    console.log(`✅ Found ${cars.length} cars. Testing with ID: ${testCarId}`);

    // Step 3: Test the new admin car retrieval endpoint
    console.log('\n3. Testing admin car retrieval endpoint...');
    const carResponse = await axios.get(`${BASE_URL}/cars/admin/${testCarId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Admin car retrieval successful!');
    console.log('📋 Car details:');
    console.log(`   - Make: ${carResponse.data.make}`);
    console.log(`   - Model: ${carResponse.data.model}`);
    console.log(`   - Year: ${carResponse.data.year}`);
    console.log(`   - Price: $${carResponse.data.price?.toLocaleString()}`);
    console.log(`   - Status: ${carResponse.data.status}`);
    console.log(`   - Images: ${carResponse.data.images?.length || 0}`);
    console.log(`   - Created by: ${carResponse.data.createdBy?.username || 'N/A'}`);
    console.log(`   - Updated by: ${carResponse.data.updatedBy?.username || 'N/A'}`);

    // Step 4: Test with invalid ID format
    console.log('\n4. Testing with invalid ID format...');
    try {
      await axios.get(`${BASE_URL}/cars/admin/invalid-id`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have failed with invalid ID');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly returned 400 for invalid ID format');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

    // Step 5: Test with non-existent ID
    console.log('\n5. Testing with non-existent ID...');
    try {
      await axios.get(`${BASE_URL}/cars/admin/507f1f77bcf86cd799439011`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Should have failed with non-existent ID');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent ID');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`);
      }
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAdminCarEndpoint();