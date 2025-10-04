import axios from 'axios';
const API = axios.create({
  baseURL: `${process.env.REACT_APP_API_BASE_URL || ''}/api/user`,
});

API.interceptors.request.use((config) => {
  const { getStoredToken } = require('../utils/authToken');
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getUserWithdrawals = async () => {
  const response = await API.get('/withdrawals');
  return response.data.withdrawals || [];
};
