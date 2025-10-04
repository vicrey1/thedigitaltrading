const axios = require('axios');

// Usage: node scripts/add-funds.js [userId] [amount] [reason]
// Environment:
//   BASE_URL (optional) e.g. http://localhost:3000/api
//   ADMIN_EMAIL, ADMIN_PASSWORD (optional)

const BASE = process.env.BASE_URL || 'http://localhost:3000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@thedigitaltrading.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

async function run(providedUserId, providedAmount, providedReason) {
  try {
    console.log('Admin login...');
    const loginResp = await axios.post(`${BASE}/admin/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    if (!loginResp.data || !loginResp.data.token) {
      console.error('Admin login failed:', loginResp.data);
      process.exit(2);
    }
    const adminToken = loginResp.data.token;
    console.log('Admin token ok');

    let userId = providedUserId;
    if (!userId) {
      console.log('No userId provided, fetching users list...');
      const usersResp = await axios.get(`${BASE}/admin/users`, { headers: { Authorization: `Bearer ${adminToken}` } });
      const users = usersResp.data?.users || [];
      const candidate = users.find(u => u.role !== 'admin');
      if (!candidate) {
        console.error('No non-admin user found');
        process.exit(3);
      }
      userId = candidate._id || candidate.id;
      console.log('Selected user:', candidate.email, userId);
    }

    console.log('Impersonating user:', userId);
    const imp = await axios.post(`${BASE}/admin/impersonate/${userId}`, {}, { headers: { Authorization: `Bearer ${adminToken}` } });
    if (!imp.data || !imp.data.token) {
      console.error('Impersonation failed:', imp.data);
      process.exit(4);
    }
    const mirrorToken = imp.data.token;
    console.log('Mirror token obtained');

    const amount = parseFloat(providedAmount || '10');
    if (isNaN(amount) || amount <= 0) {
      console.error('Please provide a valid amount');
      process.exit(5);
    }

    const reason = providedReason || 'Admin credit via script';
    console.log(`Adding ${amount} to user ${userId} (reason: ${reason})`);

    const addResp = await axios.post(`${BASE}/user/mirror/add-funds`, { amount, reason }, { headers: { Authorization: `Bearer ${mirrorToken}` } });
    console.log('Add funds response:', addResp.status, addResp.data);
  } catch (err) {
    console.error('Error:', err.response?.status, err.response?.data || err.message);
    process.exit(10);
  }
}

const userId = process.argv[2];
const amount = process.argv[3];
const reason = process.argv.slice(4).join(' ');
run(userId, amount, reason);
