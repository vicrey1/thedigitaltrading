// src/services/carAPI.js
import axios from 'axios';
import { getStoredToken } from '../utils/authToken';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/cars',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Admin API for car management
const AdminAPI = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL + '/api/cars/admin',
});

AdminAPI.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken && typeof adminToken === 'string' && adminToken.split && adminToken.split('.').length === 3) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }
  return config;
});

// PUBLIC CAR OPERATIONS
export const getCars = async (filters = {}) => {
  try {
    const response = await API.get('/', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch cars';
  }
};

export const getCarById = async (id) => {
  try {
    const response = await API.get(`/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch car';
  }
};

export const getFilterOptions = async () => {
  try {
    const response = await API.get('/filters/options');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch filter options';
  }
};

// ADMIN CAR OPERATIONS
export const getAdminCars = async (filters = {}) => {
  try {
    const response = await AdminAPI.get('/all', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch admin cars';
  }
};

export const createCar = async (carData) => {
  try {
    const formData = new FormData();
    
    // Add car data fields
    Object.keys(carData).forEach(key => {
      if (key === 'images') {
        // Handle file uploads
        if (carData.images && carData.images.length > 0) {
          carData.images.forEach(file => {
            formData.append('images', file);
          });
        }
      } else if (key === 'features') {
        // Handle features array as comma-separated string
        const featuresStr = Array.isArray(carData[key]) ? carData[key].join(',') : carData[key];
        formData.append(key, featuresStr);
      } else if (key === 'location') {
        // Handle location as individual fields
        if (carData.location) {
          formData.append('location[city]', carData.location.city || '');
          formData.append('location[state]', carData.location.state || '');
          formData.append('location[zipCode]', carData.location.zipCode || '');
        }
      } else if (key === 'contactInfo') {
        // Handle contactInfo as individual fields
        if (carData.contactInfo) {
          formData.append('contactInfo[phone]', carData.contactInfo.phone || '');
          formData.append('contactInfo[email]', carData.contactInfo.email || '');
          formData.append('contactInfo[dealerName]', carData.contactInfo.dealerName || '');
        }
      } else {
        formData.append(key, carData[key]);
      }
    });
    
    // Let axios handle the Content-Type header automatically for FormData
    const response = await AdminAPI.post('/', formData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create car';
  }
};

export const updateCar = async (id, carData) => {
  try {
    const formData = new FormData();
    
    // Add car data fields
    Object.keys(carData).forEach(key => {
      if (key === 'images') {
        // Handle file uploads
        if (carData.images && carData.images.length > 0) {
          carData.images.forEach(file => {
            formData.append('images', file);
          });
        }
      } else if (key === 'features') {
        // Handle features array as comma-separated string
        const featuresStr = Array.isArray(carData[key]) ? carData[key].join(',') : carData[key];
        formData.append(key, featuresStr);
      } else if (key === 'location') {
        // Handle location as individual fields
        if (carData.location) {
          formData.append('location[city]', carData.location.city || '');
          formData.append('location[state]', carData.location.state || '');
          formData.append('location[zipCode]', carData.location.zipCode || '');
        }
      } else if (key === 'contactInfo') {
        // Handle contactInfo as individual fields
        if (carData.contactInfo) {
          formData.append('contactInfo[phone]', carData.contactInfo.phone || '');
          formData.append('contactInfo[email]', carData.contactInfo.email || '');
          formData.append('contactInfo[dealerName]', carData.contactInfo.dealerName || '');
        }
      } else {
        formData.append(key, carData[key]);
      }
    });
    
    // Let axios handle the Content-Type header automatically for FormData
    const response = await AdminAPI.put(`/${id}`, formData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update car';
  }
};

export const deleteCar = async (id) => {
  try {
    await AdminAPI.delete(`/${id}`);
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete car';
  }
};

export const getCarStats = async () => {
  try {
    const response = await AdminAPI.get('/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch car statistics';
  }
};