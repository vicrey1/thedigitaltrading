
import axios from 'axios';

// Set base URL globally for all axios requests
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || '';

// Global Axios interceptor for 401 errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Remove token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axios;
