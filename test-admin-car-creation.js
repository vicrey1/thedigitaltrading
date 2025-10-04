const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:5001';

async function testAdminCarCreation() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
      email: 'admin@thedigitaltrading.com',
      password: 'admin123'
    });
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    console.log('Admin data:', loginResponse.data.admin);
    
    // Test car creation
    console.log('\n🚗 Testing car creation...');
    
    const carData = {
      make: 'Tesla',
      model: 'Model S',
      year: 2023,
      price: 89999,
      mileage: 1500,
      condition: 'Used',
      transmission: 'Automatic',
      fuelType: 'Electric',
      bodyType: 'Sedan',
      color: 'Pearl White',
      description: 'Pristine Tesla Model S with autopilot and premium interior',
      features: 'Autopilot,Premium Interior,Supercharging,Glass Roof',
      'location[city]': 'Los Angeles',
      'location[state]': 'CA',
      'location[zipCode]': '90210',
      'contactInfo[phone]': '+1-555-0123',
      'contactInfo[email]': 'dealer@thedigitaltrading.com',
      'contactInfo[dealerName]': 'The Digital Trading Motors',
      status: 'Available'
    };
    
    const formData = new FormData();
    Object.keys(carData).forEach(key => {
      formData.append(key, carData[key]);
    });
    
    const createResponse = await axios.post(`${BASE_URL}/api/cars/admin`, formData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Car creation successful!');
    console.log('Created car:', {
      id: createResponse.data._id,
      make: createResponse.data.make,
      model: createResponse.data.model,
      price: createResponse.data.price,
      status: createResponse.data.status
    });
    
    const carId = createResponse.data._id;
    
    // Test car update
    console.log('\n🔄 Testing car update...');
    
    const updateData = {
      price: 85999,
      description: 'Updated: Pristine Tesla Model S with autopilot and premium interior - PRICE REDUCED!',
      mileage: 1600
    };
    
    const updateFormData = new FormData();
    Object.keys(updateData).forEach(key => {
      updateFormData.append(key, updateData[key]);
    });
    
    const updateResponse = await axios.put(`${BASE_URL}/api/cars/admin/${carId}`, updateFormData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...updateFormData.getHeaders()
      }
    });
    
    console.log('✅ Car update successful!');
    console.log('Updated car:', {
      id: updateResponse.data._id,
      price: updateResponse.data.price,
      mileage: updateResponse.data.mileage,
      description: updateResponse.data.description.substring(0, 50) + '...'
    });
    
    // Test retrieving the car
    console.log('\n📋 Testing car retrieval...');
    
    const getResponse = await axios.get(`${BASE_URL}/api/cars/admin/${carId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('✅ Car retrieval successful!');
    console.log('Retrieved car:', {
      id: getResponse.data._id,
      make: getResponse.data.make,
      model: getResponse.data.model,
      price: getResponse.data.price,
      status: getResponse.data.status
    });
    
    console.log('\n🎉 All admin car operations completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during admin car operations:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    console.error('Full error:', error);
  }
}

testAdminCarCreation();