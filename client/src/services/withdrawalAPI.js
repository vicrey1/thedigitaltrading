// src/services/withdrawalAPI.js
import axios from 'axios';
import { getStoredToken } from '../utils/authToken';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/admin/withdrawals',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const { getStoredAdminToken } = require('../utils/authToken');
  const token = getStoredAdminToken();
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
  baseURL: '/api/withdrawal', // Uses Vite's proxy in dev mode
});
userAPI.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add setWithdrawalPin API
export const setWithdrawalPin = async (pin, currentPin = null) => {
  const data = { pin };
  if (currentPin) {
    data.currentPin = currentPin;
  }
  const response = await userAPI.post('/set-withdrawal-pin', data);
  return response.data;
};

export const submitWithdrawal = async (data) => {
  console.log('Sending withdrawal request:', { ...data, pin: '******' });
  try {
    const response = await userAPI.post('/', data);
    console.log('Withdrawal API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Withdrawal API error:', error.response?.data || error.message);
    throw error;
  }
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

export const payNetworkFee = async (withdrawalId) => {
  const response = await userAPI.post(`/${withdrawalId}/pay-network-fee`);
  return response.data;
};