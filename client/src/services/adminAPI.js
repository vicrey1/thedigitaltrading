
import axios from 'axios';
import { getStoredAdminToken } from '../utils/authToken';


// Admin: Impersonate a user (get a user JWT for mirror feature)
export const impersonateUser = async (userId) => {
  try {
    console.log('[API] Requesting impersonation for user:', userId);
    const response = await API.post(`/impersonate/${userId}`);

    if (!response.data || !response.data.token) {
      console.error('[API] No token in response:', response.data);
      throw new Error('No token returned from impersonation endpoint');
    }

    const token = response.data.token;

    // Validate token format (should be header.payload.signature)
    if (typeof token !== 'string' || token.split('.').length !== 3) {
      console.error('[API] Malformed token:', {
        type: typeof token,
        length: token?.length,
        parts: token?.split('.')?.length
      });
      throw new Error('Received malformed token from server');
    }

    console.log('[API] Successfully received valid impersonation token');
    return token;
  } catch (error) {
    console.error('[API] Impersonation error:', error);
    throw error.response?.data?.message || error.message || 'Failed to impersonate user';
  }
};

// Store the user token for mirror mode
export const setMirrorUserToken = (token) => {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    console.error('[API] Attempted to store invalid token:', token);
    throw new Error('Cannot store invalid token');
  }
  console.log('[API] Storing mirror user token');
  localStorage.setItem('mirrorUserToken', token);
};

// Remove the user token for mirror mode
export const clearMirrorUserToken = () => {
  console.log('[API] Clearing mirror user token');
  localStorage.removeItem('mirrorUserToken');
};


export const API = axios.create({
  baseURL: (process.env.REACT_APP_API_BASE_URL || '') + '/api/admin',
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = getStoredAdminToken();

  // Skip auth for login endpoint
  if (config.url && config.url.endsWith && config.url.endsWith('/login')) {
    console.log('[API] Skipping auth for login endpoint');
    return config;
  }

  console.log('[API] Request:', {
    url: config.url,
    hasToken: !!token,
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('[API] No admin token found');
    // Only redirect if not already on login page
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin/login')) {
      window.location.href = '/admin/login';
    }
    return Promise.reject(new Error('Authentication required'));
  }
  return config;
});

// Add response interceptor for debugging
API.interceptors.response.use(
  response => {
    console.log('[API] Response:', response.config.url, response.status);
    return response;
  },
  error => {
    console.error('[API] Error:', {
      url: error.config?.url,
      status: error.response?.status,
      error: error.response?.data
    });

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.warn('[API] Authentication required');
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
      return Promise.reject(new Error('Authentication required'));
    }

    // Handle forbidden errors
    if (error.response?.status === 403) {
      console.warn('[API] Access denied');
      return Promise.reject(new Error('Access denied. Admin privileges required.'));
    }

    return Promise.reject(error);
  }
);

// User management functions
export const fetchUsers = async ({ page = 1, limit = 10, search = '', status = 'all' } = {}) => {
  try {
    console.log('Calling fetchUsers API with params:', { page, limit, search, status });
    const response = await API.get('/users', {
      params: { page, limit, search, status },
      validateStatus: status => status < 500
    });
    console.log('fetchUsers API response:', response.data);
    
    // Ensure we have the expected data structure
    if (!response.data || !Array.isArray(response.data.users)) {
      console.error('Invalid users data structure:', response.data);
      throw new Error('Invalid response format');
    }
    
    return {
      users: response.data.users,
      total: response.data.total,
      currentPage: response.data.currentPage,
      totalPages: response.data.totalPages
    };
  } catch (error) {
    console.error('fetchUsers API error:', error);
    throw error.response?.data?.message || 'Failed to fetch users';
  }
};

// Export users data
export const exportUsers = async () => {
  try {
    const response = await API.get('/users/export', {
      responseType: 'blob' // Important for handling file downloads
    });
    
    // Create a download link and trigger it
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('exportUsers API error:', error);
    throw error.response?.data?.message || 'Failed to export users';
  }
};

// User Management Operations
export const updateUserTier = async (userId, tier) => {
  try {
    const response = await API.patch(`/users/${userId}/tier`, { tier });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user tier';
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const response = await API.patch(`/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user role';
  }
};

export const updateUserKyc = async (userId, action, reason) => {
  try {
    const response = await API.post(`/users/${userId}/kyc/${action}`, { reason });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user KYC status';
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await API.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete user';
  }
};

export const updateUser = async (userId, updates) => {
  try {
    const response = await API.patch(`/users/${userId}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user';
  }
};

export const approveKYC = async (userId) => {
  try {
    const response = await API.post(`/users/${userId}/kyc/approve`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to approve KYC';
  }
};

export const rejectKYC = async (userId, reason) => {
  const response = await API.post(`/users/${userId}/kyc/reject`, { reason });
  return response.data;
};

export const getUserKeys = async (userId) => {
  try {
    console.log('Fetching user keys for:', userId);
    const token = getStoredAdminToken();
    if (!token) {
      throw new Error('No admin token found. Please login again.');
    }
    const response = await API.get(`/users/${userId}/keys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('User keys response:', response.data);
    if (!response.data || !response.data.wallets) {
      console.error('Invalid wallet data format:', response.data);
      throw new Error('No wallet data available for this user');
    }
    return response.data;
  } catch (error) {
    console.error('getUserKeys error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      details: error.response?.data
    });
    if (error.response?.status === 401) {
      window.location.href = '/admin/login';
      throw new Error('Session expired. Please login again.');
    }
    throw error.response?.data?.message || error.message || 'Failed to fetch user keys';
  }
};

export const sendAdminEmail = async ({ to, subject, html }) => {
  try {
    await API.post('/send-email', { to, subject, html });
  } catch (error) {
    throw error.response?.data?.message || error.message || 'Failed to send email';
  }
};

// Fetch user activity logs for admin panel
export const getUserActivity = async (userId) => {
  try {
    const response = await API.get(`/users/${userId}/activity`);
    return response.data.activity || [];
  } catch (error) {
    throw error.response?.data?.message || error.message || 'Failed to fetch user activity';
  }
};

// Add more admin API calls as needed

// Mirror mode: modify user's available balance (add/subtract)
export const mirrorAddFunds = async ({ userId, amount, reason } = {}) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Invalid amount');
    }
    const response = await API.post(`/mirror/modify-balance/${userId}`, { amount, reason });
    return response.data;
  } catch (error) {
    console.error('mirrorAddFunds error:', error.response?.data || error.message);
    throw error.response?.data?.message || error.message || 'Failed to modify balance in mirror mode';
  }
};
