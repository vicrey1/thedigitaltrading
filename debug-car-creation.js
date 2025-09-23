const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:5001';
const ADMIN_EMAIL = 'admin@thedigitaltrading.com';
const ADMIN_PASSWORD = 'admin123';

async function debugCarCreation() {
  try {
    console.log('🔐 Authenticating as admin...');
    
    // Authenticate as admin
    const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const adminToken = authResponse.data.token;
    console.log('✅ Admin authentication successful');
    
    console.log('🚗 Creating car with minimal data...');
    
    // Create minimal car data
    const formData = new FormData();
    formData.append('make', 'Tesla');
    formData.append('model', 'Model S');
    formData.append('year', '2023');
    formData.append('price', '89999');
    formData.append('mileage', '1500');
    formData.append('color', 'Pearl White');
    formData.append('fuelType', 'Electric');
    formData.append('transmission', 'Automatic');
    formData.append('bodyType', 'Sedan');
    formData.append('condition', 'Used');
    formData.append('description', 'Test car for debugging');
    // Try sending as individual fields
    formData.append('location[city]', 'San Francisco');
    formData.append('location[state]', 'CA');
    formData.append('location[zipCode]', '94102');
    formData.append('contactInfo[phone]', '+1-555-123-4567');
    formData.append('contactInfo[email]', 'dealer@luxcars.com');
    formData.append('contactInfo[dealerName]', 'Luxury Auto Sales');
    formData.append('status', 'Available');
    formData.append('featured', 'false');
    
    console.log('📤 Sending request...');
    
    const response = await axios.post(`${BASE_URL}/api/cars/admin`, formData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Car created successfully!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

debugCarCreation();