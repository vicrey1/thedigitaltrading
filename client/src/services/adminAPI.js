// src/services/adminAPI.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/admin',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUsers = async () => {
  try {
    const response = await API.get('/users');
    return response.data;
  } catch (error) {
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