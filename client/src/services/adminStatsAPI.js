// src/services/adminStatsAPI.js
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/admin',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAdminStats = async () => {
  const res = await API.get('/stats');
  return res.data;
};

export const getRecentActivities = async (limit = 10) => {
  const res = await API.get(`/recent-activities?limit=${limit}`);
  return res.data.activities || [];
};
