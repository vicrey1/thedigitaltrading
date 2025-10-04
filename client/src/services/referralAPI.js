// src/services/referralAPI.js
import axios from 'axios';
import { getStoredToken } from '../utils/authToken';

export const getReferralStats = async () => {
  const token = getStoredToken();
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(`${baseUrl}/api/user/referral-stats`, {
    headers
  });
  return res.data;
};
