const axios = require('axios');

// Simple test script to verify impersonation flow
// Usage: node scripts/test-impersonation.js <userId>

const BASE = process.env.BASE_URL || 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@thedigitaltrading.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

async function run(providedUserId) {
  try {
    console.log('Logging in as admin...');
    const loginResp = await axios.post(`${BASE}/admin/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (!loginResp.data || !loginResp.data.token) {
      console.error('Admin login did not return a token:', loginResp.data);
      process.exit(2);
    }

    const adminToken = loginResp.data.token;
    console.log('Admin token length:', adminToken.length);

    let userId = providedUserId;
    if (!userId) {
      console.log('No userId provided. Fetching users list to pick a non-admin user...');
      const usersResp = await axios.get(`${BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { page: 1, limit: 20 }
      });

      const users = usersResp.data?.users || [];
      const candidate = users.find(u => u.role !== 'admin');
      if (!candidate) {
        console.error('No non-admin users found in admin users list. Response:', usersResp.data);
        process.exit(3);
      }
      userId = candidate._id || candidate.id;
      console.log('Selected user for impersonation:', { email: candidate.email, id: userId });
    }

    console.log('Calling impersonation endpoint for userId:', userId);
    const impResp = await axios.post(`${BASE}/admin/impersonate/${userId}`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    console.log('Impersonation response status:', impResp.status);
    if (!impResp.data || !impResp.data.token) {
      console.error('No token in impersonation response:', impResp.data);
      process.exit(4);
    }

    const userToken = impResp.data.token;
    console.log('Received impersonation token length:', userToken.length, 'startsWith:', userToken.substring(0, 10));

    console.log('Making a test user request (GET /user/dashboard)...');
    const meResp = await axios.get(`${BASE}/user/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    console.log('User /me response status:', meResp.status);
    console.log('User /me response data:', JSON.stringify(meResp.data, null, 2));

    console.log('\nAll steps completed successfully');
  } catch (err) {
    console.error('Error during test:', err.response?.status, err.response?.data || err.message);
    process.exit(5);
  }
}

const userId = process.argv[2];
run(userId);
