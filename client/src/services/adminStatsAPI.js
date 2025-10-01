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
  try {
    const res = await API.get('/stats');
    return res.data;
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    throw error.response?.data || error.message;
  }
};

export const getRecentActivities = async (limit = 10) => {
  try {
    const res = await API.get(`/recent-activities?limit=${limit}`);
    return res.data.activities || [];
  } catch (error) {
    console.error('Failed to fetch recent activities:', error);
    throw error.response?.data || error.message;
  }
};

export const getDashboardCharts = async (timeframe = '7d') => {
  try {
    const res = await API.get(`/dashboard-charts?timeframe=${timeframe}`);
    return res.data;
  } catch (error) {
    console.error('Failed to fetch dashboard charts:', error);
    throw error.response?.data || error.message;
  }
};

export const getSystemHealth = async () => {
  try {
    const res = await API.get('/system-health');
    return res.data;
  } catch (error) {
    console.error('Failed to fetch system health:', error);
    throw error.response?.data || error.message;
  }
};
