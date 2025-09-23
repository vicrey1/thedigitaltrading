const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001';
const ADMIN_EMAIL = 'admin@thedigitaltrading.com';
const ADMIN_PASSWORD = 'admin123';

async function testCarCreationWithImages() {
  try {
    console.log('🔐 Authenticating as admin...');
    
    // Authenticate as admin
    const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const adminToken = authResponse.data.token;
    console.log('✅ Admin authentication successful');
    
    console.log('🚗 Creating car with image upload...');
    
    // Create FormData with car data and mock image
    const formData = new FormData();
    
    // Add car data
    formData.append('make', 'BMW');
    formData.append('model', 'X5');
    formData.append('year', '2024');
    formData.append('price', '75000');
    formData.append('mileage', '500');
    formData.append('color', 'Alpine White');
    formData.append('fuelType', 'Gasoline');
    formData.append('transmission', 'Automatic');
    formData.append('bodyType', 'SUV');
    formData.append('condition', 'New');
    formData.append('description', 'Brand new BMW X5 with premium package');
    formData.append('features', 'Navigation,Leather Seats,Sunroof,Premium Audio');
    
    // Add location as individual fields
    formData.append('location[city]', 'Los Angeles');
    formData.append('location[state]', 'CA');
    formData.append('location[zipCode]', '90210');
    
    // Add contact info as individual fields
    formData.append('contactInfo[phone]', '+1-555-987-6543');
    formData.append('contactInfo[email]', 'sales@bmwla.com');
    formData.append('contactInfo[dealerName]', 'BMW Los Angeles');
    
    formData.append('status', 'Available');
    formData.append('featured', 'true');
    
    // Create a simple test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8D, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Add test images
    formData.append('images', testImageBuffer, {
      filename: 'test-car-1.png',
      contentType: 'image/png'
    });
    
    formData.append('images', testImageBuffer, {
      filename: 'test-car-2.png',
      contentType: 'image/png'
    });
    
    console.log('📤 Sending request with images...');
    
    const response = await axios.post(`${BASE_URL}/api/cars/admin`, formData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Car created successfully with images!');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
    // Test retrieving the car
    console.log('🔍 Testing car retrieval...');
    const carId = response.data._id;
    const getResponse = await axios.get(`${BASE_URL}/api/cars/${carId}`);
    
    console.log('✅ Car retrieved successfully!');
    console.log('🖼️ Images:', getResponse.data.images);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCarCreationWithImages();