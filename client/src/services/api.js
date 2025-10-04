// src/services/api.js
import axios from 'axios';
import { getStoredToken } from '../utils/authToken';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api',
});

// Add auth token to requests (support mirror user mode for admin impersonation)
API.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle expired tokens (401)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Remove tokens and redirect to login or stop mirroring
      localStorage.removeItem('token');
      localStorage.removeItem('mirrorUserToken');
      // Optionally, show a message
      if (window.location.pathname.startsWith('/admin')) {
        window.location.reload(); // For admin, reload to reset state
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const deposit = async (fundId, planId, amount) => {
  try {
    const response = await API.post('/investments/deposit', {
      fundId,
      planId,
      amount
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Deposit failed';
  }
};

// Add other API calls as needed

// src/services/api.js
// Add to your existing API service
export const withdraw = async (amount, currency, network, address) => {
  try {
    const response = await API.post('/withdrawals', {
      amount,
      currency,
      network,
      address
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Withdrawal failed';
  }
};



// src/services/api.js
// Add to your existing API service
export const getPortfolio = async () => {
  try {
    const response = await API.get('/portfolio');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to load portfolio data';
  }
};

export default API;