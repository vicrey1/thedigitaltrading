
import axios from 'axios';

// Set base URL globally for all axios requests
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || '';

// Global Axios interceptor for 401 errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Only treat it as a real auth failure when the server explicitly indicates token problems
      const errorMessage = (error.response.data?.error || error.response.data?.message || '').toLowerCase();
      const tokenErrorKeywords = ['invalid token', 'no token provided', 'token expired', 'jwt', 'unauthorized', 'invalid or expired'];

      const isExplicitTokenError = tokenErrorKeywords.some(k => errorMessage.includes(k));

      if (isExplicitTokenError) {
        // Determine which token (if any) the failing request used
        const authHeader = error.config?.headers?.Authorization || '';
        const adminToken = localStorage.getItem('adminToken');
        const userToken = localStorage.getItem('token');

        // Only logout if the failing request actually used the same token we have stored locally
        if (adminToken && authHeader === `Bearer ${adminToken}`) {
          console.log('[AUTH] Admin token invalid/expired. Logging out admin.');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin');
          // Use location replace to avoid adding to history
          window.location.replace('/admin/login');
        } else if (userToken && authHeader === `Bearer ${userToken}`) {
          console.log('[AUTH] User token invalid/expired. Logging out user.');
          localStorage.removeItem('token');
          window.location.replace('/login');
        } else {
          // If we cannot conclusively determine token ownership, be conservative and do not auto-logout.
          console.log('[AUTH] Token error detected but local token does not match failing request. Skipping auto-logout.');
        }
      } else {
        // 401 that doesn't mention token problems (e.g., permission denied) — do not log out
        console.log('[AUTH] Received 401 but server did not report token problem. Not logging out.');
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
