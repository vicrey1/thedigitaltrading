import axios from 'axios';
import { getStoredToken } from '../utils/authToken';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// Create axios instance for fee API
const feeAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/fees`,
});

// Add auth token to requests
feeAPI.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get user's fee status
export const getFeeStatus = async () => {
  try {
    const response = await feeAPI.get('/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching fee status:', error);
    throw error;
  }
};

// Pay activation fee
export const payActivationFee = async (transactionId) => {
  try {
    const response = await feeAPI.post('/pay-activation', { transactionId });
    return response.data;
  } catch (error) {
    console.error('Error paying activation fee:', error);
    throw error;
  }
};

// Pay tax clearance fee
export const payTaxClearanceFee = async (transactionId) => {
  try {
    const response = await feeAPI.post('/pay-tax-clearance', { transactionId });
    return response.data;
  } catch (error) {
    console.error('Error paying tax clearance fee:', error);
    throw error;
  }
};

// Pay network fee
export const payNetworkFee = async (transactionId) => {
  try {
    const response = await feeAPI.post('/pay-network', { transactionId });
    return response.data;
  } catch (error) {
    console.error('Error paying network fee:', error);
    throw error;
  }
};

// Reset all fees (for testing)
export const resetFees = async () => {
  try {
    const response = await feeAPI.post('/reset');
    return response.data;
  } catch (error) {
    console.error('Error resetting fees:', error);
    throw error;
  }
};

export default {
  getFeeStatus,
  payActivationFee,
  payTaxClearanceFee,
  payNetworkFee,
  resetFees
};