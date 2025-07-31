import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api/admin/roi-approvals',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
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
