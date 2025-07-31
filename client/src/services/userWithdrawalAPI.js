// src/services/userWithdrawalAPI.js
import axios from 'axios';

const API = axios.create({
  baseURL: '/api/user',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUserWithdrawals = async () => {
  const response = await API.get('/withdrawals');
  return response.data;
};
