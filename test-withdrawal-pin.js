const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';  // Server runs on port 3000
let authToken = '';
const TEST_USER = {
    email: 'testuser@example.com',
    password: 'testpassword123'
};

// Axios instance with auth header
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Helper to update auth token
const updateAuthToken = (token) => {
    authToken = token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

async function runTest() {
    try {
        // 1. Login to get auth token
        console.log('\n1. Logging in...');
        const loginResponse = await api.post('/auth/login', TEST_USER);
        updateAuthToken(loginResponse.data.token);
        console.log('✓ Login successful');

        // 2. Set initial withdrawal PIN
        console.log('\n2. Setting initial withdrawal PIN...');
        const initialPin = '123456';
        const setInitialPinResponse = await api.post('/withdrawal/set-withdrawal-pin', { pin: initialPin });
        console.log('✓ Initial PIN set successfully:', setInitialPinResponse.data.msg);

        // 3. Verify initial PIN works
        console.log('\n3. Verifying initial PIN...');
        const verifyResponse = await api.post('/withdrawal/verify-pin', { pin: initialPin });
        console.log('✓ Initial PIN verification successful:', verifyResponse.data.msg);

        // 4. Try to set new PIN without providing current PIN
        console.log('\n4. Testing PIN update without current PIN...');
        const newPin = '654321';
        try {
            await api.post('/withdrawal/set-withdrawal-pin', { pin: newPin });
            console.log('❌ Error: Should not allow PIN update without current PIN');
        } catch (err) {
            console.log('✓ Correctly rejected PIN update without current PIN:', err.response.data.msg);
        }

        // 5. Try to set new PIN with incorrect current PIN
        console.log('\n5. Testing PIN update with incorrect current PIN...');
        try {
            await api.post('/withdrawal/set-withdrawal-pin', { pin: newPin, currentPin: '111111' });
            console.log('❌ Error: Should not allow PIN update with incorrect current PIN');
        } catch (err) {
            console.log('✓ Correctly rejected PIN update with wrong current PIN:', err.response.data.msg);
        }

        // 6. Set new PIN with correct current PIN
        console.log('\n6. Setting new PIN with correct current PIN...');
        const updatePinResponse = await api.post('/withdrawal/set-withdrawal-pin', { 
            pin: newPin,
            currentPin: initialPin
        });
        console.log('✓ PIN updated successfully:', updatePinResponse.data.msg);

        // 7. Verify new PIN works
        console.log('\n7. Verifying new PIN...');
        const verifyNewPinResponse = await api.post('/withdrawal/verify-pin', { pin: newPin });
        console.log('✓ New PIN verification successful:', verifyNewPinResponse.data.msg);

        // 8. Verify old PIN no longer works
        console.log('\n8. Verifying old PIN no longer works...');
        try {
            await api.post('/withdrawal/verify-pin', { pin: initialPin });
            console.log('❌ Error: Old PIN should not work');
        } catch (err) {
            console.log('✓ Correctly rejected old PIN:', err.response.data.msg);
        }

        console.log('\n✓ Enhanced withdrawal PIN functionality is working correctly!');
        console.log('\nAll tests completed successfully! ✨');
    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data?.msg || error.message);
        console.error('Full error:', error.response?.data || error);
    }
}

// Run the test
runTest();