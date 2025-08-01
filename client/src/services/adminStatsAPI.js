// src/services/adminStatsAPI.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/admin',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  console.log('adminToken in localStorage (stats):', token); // Debug log
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Authorization header set (stats):', config.headers.Authorization); // Debug log
  } else {
    console.warn('No adminToken found in localStorage (stats)'); // Debug log
  }
  return config;
});

export const getAdminStats = async () => {
  const res = await API.get('/stats');
  return res.data;
};
