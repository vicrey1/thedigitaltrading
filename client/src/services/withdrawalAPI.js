// src/services/withdrawalAPI.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api/admin/withdrawals',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getWithdrawals = async (filters = {}) => {
  try {
    const response = await API.get('/', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch withdrawals';
  }
};

export const getWithdrawalById = async (id) => {
  try {
    const response = await API.get(`/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch withdrawal';
  }
};

export const updateWithdrawal = async (id, updates) => {
  try {
    const response = await API.patch(`/${id}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update withdrawal';
  }
};

export const bulkUpdateWithdrawals = async (ids, updates) => {
  try {
    const response = await API.patch('/bulk', { ids, updates });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to bulk update withdrawals';
  }
};

// User withdrawal endpoints (not admin)
const userAPI = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/withdrawal',
});
userAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add setWithdrawalPin API
export const setWithdrawalPin = async (pin) => {
  const response = await userAPI.post('/set-withdrawal-pin', { pin });
  return response.data;
};

export const submitWithdrawal = async (data) => {
  const response = await userAPI.post('/', data);
  return response.data;
};

export const requestPinReset = async () => {
  const response = await userAPI.post('/request-pin-reset');
  return response.data;
};

export const resetPin = async (code, newPin) => {
  const response = await userAPI.post('/reset-pin', { code, newPin });
  return response.data;
};

export const verifyWithdrawalPin = async (pin) => {
  const response = await userAPI.post('/verify-pin', { pin });
  return response.data;
};