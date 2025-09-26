// Centralized API utility for using the backend base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export function apiFetch(path, options = {}) {
  let url = path.startsWith('http') ? path : `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  return fetch(url, options);
}
