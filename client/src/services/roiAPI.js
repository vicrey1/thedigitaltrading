import axios from 'axios';
import { getStoredAdminToken } from '../utils/authToken';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/admin/roi-approvals',
});

API.interceptors.request.use((config) => {
  const token = getStoredAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getRoiWithdrawals = async () => {
  const res = await API.get('/');
  return res.data;
};

export const approveRoiWithdrawal = async (id) => {
  const res = await API.patch(`/${id}`, { status: 'completed', destination: 'available' });
  return res.data;
};

export const rejectRoiWithdrawal = async (id) => {
  const res = await API.patch(`/${id}`, { status: 'rejected' });
  return res.data;
};
