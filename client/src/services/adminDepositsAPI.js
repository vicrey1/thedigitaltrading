// src/services/adminDepositsAPI.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api/admin/deposits',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  console.log('adminToken in localStorage (deposits):', token); // Debug log
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Authorization header set (deposits):', config.headers.Authorization); // Debug log
  } else {
    console.warn('No adminToken found in localStorage (deposits)'); // Debug log
  }
  return config;
});

export const getAdminDeposits = async () => {
  try {
    const response = await API.get('/');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch deposits';
  }
};

export const updateAdminDeposit = async (id, data) => {
  try {
    const response = await API.patch(`/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update deposit';
  }
};
