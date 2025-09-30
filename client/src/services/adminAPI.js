// admin API client for admin pages
import axios from 'axios';

export const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/admin',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  console.log('API Request:', config.url);
  console.log('Admin token exists:', !!token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No admin token found');
  }
  return config;
});

// Add response interceptor for debugging
API.interceptors.response.use(
  response => {
    console.log('API Response:', response.config.url, response.status);
    return response;
  },
  error => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const getUsers = async () => {
  try {
    console.log('Calling getUsers API...');
    const response = await API.get('/users');
    console.log('getUsers API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('getUsers API error:', error);
    throw error.response?.data?.message || 'Failed to fetch users';
  }
};

export const updateUser = async (userId, updates) => {
  try {
    const response = await API.patch(`/users/${userId}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user';
  }
};

export const approveKYC = async (userId) => {
  try {
    const response = await API.post(`/users/${userId}/kyc/approve`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to approve KYC';
  }
};

export const rejectKYC = async (userId, reason) => {
  const response = await API.post(`/users/${userId}/kyc/reject`, { reason });
  return response.data;
};

export const updateUserTier = async (userId, tier) => {
  const response = await API.patch(`/users/${userId}/tier`, { tier });
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await API.patch(`/users/${userId}/role`, { role });
  return response.data;
};

export const getUserKeys = async (userId) => {
  try {
    const response = await API.get(`/users/${userId}/keys`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch user keys';
  }
};

export const sendAdminEmail = async ({ to, subject, html }) => {
  try {
    await API.post('/send-email', { to, subject, html });
  } catch (error) {
    throw error.response?.data?.message || error.message || 'Failed to send email';
  }
};

// Add more admin API calls as needed