// Car Creation Functionality Test Script
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001';
const ADMIN_EMAIL = 'admin@thedigitaltrading.com';
const ADMIN_PASSWORD = 'admin123';

// Test data
const validCarData = {
  make: 'Tesla',
  model: 'Model S',
  year: 2023,
  price: 89999,
  mileage: 1500,
  condition: 'excellent',
  transmission: 'automatic',
  fuelType: 'electric',
  bodyType: 'sedan',
  color: 'Pearl White',
  description: 'Pristine Tesla Model S with autopilot and premium interior package.',
  features: ['Autopilot', 'Premium Audio', 'Glass Roof', 'Heated Seats'],
  location: {
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102'
  },
  contactInfo: {
    phone: '+1-555-123-4567',
    email: 'dealer@luxcars.com',
    dealerName: 'Luxury Auto Sales'
  },
  status: 'available',
  featured: false
};

const invalidCarData = {
  make: 'BMW',
  model: 'X5',
  year: 2022,
  price: 75000,
  // Missing required fields: location, contactInfo
  description: 'Test car with missing required fields'
};

class CarCreationTester {
  constructor() {
    this.adminToken = null;
    this.testResults = {
      authentication: false,
      validationTests: [],
      creationTests: [],
      errors: []
    };
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async authenticateAdmin() {
    try {
      this.log('🔐 Authenticating as admin...');
      
      const response = await axios.post(`${BASE_URL}/api/admin/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });

      if (response.data && response.data.token) {
        this.adminToken = response.data.token;
        this.testResults.authentication = true;
        this.log('Admin authentication successful', 'success');
        return true;
      } else {
        throw new Error('No token received from login');
      }
    } catch (error) {
      this.log(`Admin authentication failed: ${error.message}`, 'error');
      this.testResults.errors.push(`Authentication: ${error.message}`);
      return false;
    }
  }

  async testInvalidCarCreation() {
    try {
      this.log('🧪 Testing car creation with invalid data...');
      
      const response = await axios.post(`${BASE_URL}/api/cars/admin`, invalidCarData, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      // If we get here, the validation failed to catch invalid data
      this.testResults.validationTests.push({
        test: 'Invalid data rejection',
        passed: false,
        message: 'API accepted invalid data when it should have rejected it'
      });
      this.log('❌ Validation test failed: API accepted invalid data', 'error');
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        this.testResults.validationTests.push({
          test: 'Invalid data rejection',
          passed: true,
          message: 'API correctly rejected invalid data'
        });
        this.log('✅ Validation test passed: API correctly rejected invalid data', 'success');
      } else {
        this.testResults.validationTests.push({
          test: 'Invalid data rejection',
          passed: false,
          message: `Unexpected error: ${error.message}`
        });
        this.log(`❌ Validation test error: ${error.message}`, 'error');
      }
    }
  }

  async testValidCarCreation() {
    try {
      this.log('🚗 Testing car creation with valid data...');
      
      // Prepare form data (since the API expects multipart/form-data for file uploads)
      const formData = new FormData();
      
      // Add basic car data with proper formatting
      formData.append('make', 'Tesla');
      formData.append('model', 'Model S');
      formData.append('year', '2023');
      formData.append('price', '89999');
      formData.append('mileage', '1500');
      formData.append('condition', 'Used');
      formData.append('transmission', 'Automatic');
      formData.append('fuelType', 'Electric');
      formData.append('bodyType', 'Sedan');
      formData.append('color', 'Pearl White');
      formData.append('description', 'Pristine Tesla Model S with autopilot and premium interior package.');
      formData.append('features', 'Autopilot,Premium Audio,Glass Roof,Heated Seats');
      // Send nested objects as individual fields
      formData.append('location[city]', 'San Francisco');
      formData.append('location[state]', 'CA');
      formData.append('location[zipCode]', '94102');
      formData.append('contactInfo[phone]', '+1-555-123-4567');
      formData.append('contactInfo[email]', 'dealer@luxcars.com');
      formData.append('contactInfo[dealerName]', 'Luxury Auto Sales');
      formData.append('status', 'Available');
      formData.append('featured', 'false');

      const response = await axios.post(`${BASE_URL}/api/cars/admin`, formData, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          ...formData.getHeaders()
        }
      });

      if (response.status === 201 && response.data) {
        this.testResults.creationTests.push({
          test: 'Valid car creation',
          passed: true,
          carId: response.data._id,
          message: 'Car created successfully'
        });
        this.log(`✅ Car creation successful! Car ID: ${response.data._id}`, 'success');
        return response.data;
      } else {
        throw new Error('Unexpected response format');
      }
      
    } catch (error) {
      this.testResults.creationTests.push({
        test: 'Valid car creation',
        passed: false,
        message: error.response?.data?.message || error.message
      });
      this.log(`❌ Car creation failed: ${error.response?.data?.message || error.message}`, 'error');
      return null;
    }
  }

  async testCarRetrieval(carId) {
    try {
      this.log(`🔍 Testing car retrieval for ID: ${carId}...`);
      
      // Test public endpoint
      const publicResponse = await axios.get(`${BASE_URL}/api/cars/${carId}`);
      
      if (publicResponse.status === 200 && publicResponse.data) {
        this.testResults.creationTests.push({
          test: 'Car retrieval (public)',
          passed: true,
          message: 'Car successfully retrieved from public endpoint'
        });
        this.log('✅ Car retrieval (public) successful', 'success');
      }

      // Test admin endpoint
      const adminResponse = await axios.get(`${BASE_URL}/api/cars/admin`, {
        headers: {
          'Authorization': `Bearer ${this.adminToken}`
        }
      });

      const createdCar = adminResponse.data.cars?.find(car => car._id === carId);
      if (createdCar) {
        this.testResults.creationTests.push({
          test: 'Car retrieval (admin)',
          passed: true,
          message: 'Car found in admin car list'
        });
        this.log('✅ Car retrieval (admin) successful', 'success');
      } else {
        throw new Error('Car not found in admin list');
      }
      
    } catch (error) {
      this.testResults.creationTests.push({
        test: 'Car retrieval',
        passed: false,
        message: error.message
      });
      this.log(`❌ Car retrieval failed: ${error.message}`, 'error');
    }
  }

  async testAuthenticationRequired() {
    try {
      this.log('🔒 Testing authentication requirement...');
      
      const response = await axios.post(`${BASE_URL}/api/cars/admin`, validCarData, {
        headers: {
          'Content-Type': 'application/json'
          // No Authorization header
        }
      });

      // If we get here, authentication is not working
      this.testResults.validationTests.push({
        test: 'Authentication required',
        passed: false,
        message: 'API allowed access without authentication'
      });
      this.log('❌ Authentication test failed: API allowed access without token', 'error');
      
    } catch (error) {
      if (error.response && error.response.status === 401) {
        this.testResults.validationTests.push({
          test: 'Authentication required',
          passed: true,
          message: 'API correctly rejected request without authentication'
        });
        this.log('✅ Authentication test passed: API requires authentication', 'success');
      } else {
        this.testResults.validationTests.push({
          test: 'Authentication required',
          passed: false,
          message: `Unexpected error: ${error.message}`
        });
        this.log(`❌ Authentication test error: ${error.message}`, 'error');
      }
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Car Creation Functionality Tests...');
    this.log('='.repeat(60));

    // Test 1: Authentication
    const authSuccess = await this.authenticateAdmin();
    if (!authSuccess) {
      this.log('❌ Cannot proceed without authentication', 'error');
      return this.generateReport();
    }

    // Test 2: Authentication requirement
    await this.testAuthenticationRequired();

    // Test 3: Invalid data validation
    await this.testInvalidCarCreation();

    // Test 4: Valid car creation
    const createdCar = await this.testValidCarCreation();

    // Test 5: Car retrieval (if car was created)
    if (createdCar && createdCar._id) {
      await this.testCarRetrieval(createdCar._id);
    }

    return this.generateReport();
  }

  generateReport() {
    this.log('='.repeat(60));
    this.log('📊 TEST RESULTS SUMMARY');
    this.log('='.repeat(60));

    const totalTests = this.testResults.validationTests.length + this.testResults.creationTests.length + 1; // +1 for auth
    const passedTests = [
      this.testResults.authentication,
      ...this.testResults.validationTests.map(t => t.passed),
      ...this.testResults.creationTests.map(t => t.passed)
    ].filter(Boolean).length;

    this.log(`📈 Overall: ${passedTests}/${totalTests} tests passed`);
    this.log(`🔐 Authentication: ${this.testResults.authentication ? '✅ PASS' : '❌ FAIL'}`);
    
    this.log('\n🧪 Validation Tests:');
    this.testResults.validationTests.forEach(test => {
      this.log(`   ${test.passed ? '✅' : '❌'} ${test.test}: ${test.message}`);
    });

    this.log('\n🚗 Creation Tests:');
    this.testResults.creationTests.forEach(test => {
      this.log(`   ${test.passed ? '✅' : '❌'} ${test.test}: ${test.message}`);
    });

    if (this.testResults.errors.length > 0) {
      this.log('\n❌ Errors:');
      this.testResults.errors.forEach(error => {
        this.log(`   • ${error}`);
      });
    }

    this.log('='.repeat(60));
    
    if (passedTests === totalTests) {
      this.log('🎉 ALL TESTS PASSED! Car creation functionality is working correctly.', 'success');
    } else {
      this.log(`⚠️  ${totalTests - passedTests} test(s) failed. Please review the issues above.`, 'error');
    }

    return {
      success: passedTests === totalTests,
      totalTests,
      passedTests,
      results: this.testResults
    };
  }
}

// Run the tests
async function main() {
  const tester = new CarCreationTester();
  const results = await tester.runAllTests();
  
  // Exit with appropriate code
  process.exit(results.success ? 0 : 1);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = CarCreationTester;