const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001/api';

async function run() {
  try {
    console.log('Logging in as test user...');
    const login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser@example.com',
      password: 'testpassword123'
    });

    const token = login.data.token;
    console.log('Received token:', !!token);

    const api = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${token}` }
    });

    // Perform withdrawal request for $50 USDT on ERC20
    console.log('\nPosting withdrawal request for $50 USDT (ERC20)...');
    const res = await api.post('/withdrawal', {
      amount: 50,
      currency: 'USDT',
      network: 'ERC20',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      pin: '1234'
    });

    console.log('\nResponse status:', res.status);
    console.log('Response data:', JSON.stringify(res.data, null, 2));

    if (res.data && res.data.networkFee) {
      console.log('\nNetwork fee reported:', res.data.networkFee);
    }
  } catch (err) {
    if (err.response) {
      console.error('HTTP', err.response.status, err.response.statusText, err.response.data);
    } else {
      console.error('Error during test:', err.message);
    }
  }
}

run();
