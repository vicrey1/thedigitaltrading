// src/services/adminDepositsAPI.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/admin/deposits',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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
