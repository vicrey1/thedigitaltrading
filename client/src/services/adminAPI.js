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

// User management functions
export const getUsers = async ({ page = 1, limit = 10, search = '', filter = 'all' } = {}) => {
  try {
    console.log('Calling getUsers API with params:', { page, limit, search, filter });
    const response = await API.get('/users', {
      params: { page, limit, search, filter }
    });
    console.log('getUsers API response:', response.data);
    
    // Ensure we have the expected data structure
    if (!response.data || !Array.isArray(response.data.users)) {
      console.error('Invalid users data structure:', response.data);
      throw new Error('Invalid response format');
    }
    
    return {
      users: response.data.users,
      total: response.data.total,
      currentPage: response.data.currentPage,
      totalPages: response.data.totalPages
    };
  } catch (error) {
    console.error('getUsers API error:', error);
    throw error.response?.data?.message || 'Failed to fetch users';
  }
};

// User Management Operations
export const updateUserTier = async (userId, tier) => {
  try {
    const response = await API.patch(`/users/${userId}/tier`, { tier });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user tier';
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await API.patch(`/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user role';
  }
};

export const updateUserKyc = async (userId, action, reason) => {
  try {
    const response = await API.post(`/users/${userId}/kyc/${action}`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user KYC status';
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await API.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete user';
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