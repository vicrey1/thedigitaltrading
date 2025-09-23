
import axios from 'axios';

// Set base URL globally for all axios requests
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || '';

// Global Axios interceptor for 401 errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Check if this is a genuine authentication failure that should trigger logout
      const errorMessage = error.response.data?.error || error.response.data?.message || '';
      const isAuthFailure = errorMessage.includes('Invalid token') || 
                           errorMessage.includes('No token provided') || 
                           errorMessage.includes('Token expired') ||
                           errorMessage.includes('Unauthorized') ||
                           error.config?.url?.includes('/verify') ||
                           error.config?.url?.includes('/auth/');
      
      // Only trigger logout for genuine authentication failures
      if (isAuthFailure) {
        // Check if the request was made with an admin token
        const authHeader = error.config?.headers?.Authorization;
        const adminToken = localStorage.getItem('adminToken');
        const userToken = localStorage.getItem('token');
        
        // If the request used admin token, handle admin logout
        if (adminToken && authHeader === `Bearer ${adminToken}`) {
          console.log('[AUTH] Admin token invalid, logging out:', errorMessage);
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin'); // Also remove admin info
          window.location.href = '/admin/login';
        } 
        // If the request used user token, handle user logout
        else if (userToken && authHeader === `Bearer ${userToken}`) {
          console.log('[AUTH] User token invalid, logging out:', errorMessage);
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        // Fallback: if we can't determine token type, check current path
        else {
          const isAdminPath = window.location.pathname.startsWith('/admin');
          if (isAdminPath) {
            console.log('[AUTH] Admin path with auth failure, logging out:', errorMessage);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('admin');
            window.location.href = '/admin/login';
          } else {
            console.log('[AUTH] User path with auth failure, logging out:', errorMessage);
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
      } else {
        // This is a 401 error but not an authentication failure (e.g., access denied, permission error)
        console.log('[AUTH] 401 error but not auth failure, not logging out:', errorMessage);
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
