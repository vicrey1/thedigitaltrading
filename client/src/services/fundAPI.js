// src/services/fundAPI.js
import axios from 'axios';
import { getStoredAdminToken } from '../utils/authToken';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/admin/funds',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = getStoredAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getFunds = async () => {
  try {
    const response = await API.get('/');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch funds';
  }
};

export const getFundById = async (id) => {
  try {
    const response = await API.get(`/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch fund';
  }
};

export const createFund = async (fundData) => {
  try {
    const response = await API.post('/', fundData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create fund';
  }
};

export const updateFund = async (id, fundData) => {
  try {
    const response = await API.put(`/${id}`, fundData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update fund';
  }
};

export const deleteFund = async (id) => {
  try {
    await API.delete(`/${id}`);
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete fund';
  }
};