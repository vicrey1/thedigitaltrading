// Normalizes tokens retrieved from localStorage and returns null for invalid values
export function getStoredToken(preferMirror = false) {
  const mirror = localStorage.getItem('mirrorUserToken');
  const primary = localStorage.getItem('token');
  // preferMirror not currently used differently - keep API for future
  const raw = preferMirror ? (mirror || primary) : (mirror || primary);

  const isValid = (t) => typeof t === 'string' && t.length > 0 && t !== 'null' && t !== 'undefined' && t.split && t.split('.').length === 3;
  if (isValid(raw)) return raw;
  // Cleanup invalid stored values
  if (mirror && !isValid(mirror)) localStorage.removeItem('mirrorUserToken');
  if (primary && !isValid(primary)) localStorage.removeItem('token');
  return null;
}

export default getStoredToken;

// Generic helper to validate any stored token key (e.g., adminToken)
export function getStoredTokenByKey(key) {
  if (!key || typeof key !== 'string') return null;
  const raw = localStorage.getItem(key);
  const isValid = (t) => typeof t === 'string' && t.length > 0 && t !== 'null' && t !== 'undefined' && t.split && t.split('.').length === 3;
  if (isValid(raw)) return raw;
  if (raw && !isValid(raw)) localStorage.removeItem(key);
  return null;
}

export const getStoredAdminToken = () => getStoredTokenByKey('adminToken');
