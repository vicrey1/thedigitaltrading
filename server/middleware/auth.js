const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function parseRawAuth(rawAuth) {
  if (!rawAuth) return { token: null, source: null };
  if (typeof rawAuth !== 'string') return { token: null, source: null };
  if (rawAuth.startsWith('Bearer ')) {
    return { token: rawAuth.split(' ')[1], source: 'authorization' };
  }
  return { token: rawAuth, source: 'header' };
}

function verifyToken(rawAuthOrToken) {
  // Accept either a raw Authorization header ("Bearer xxx") or a raw token string
  const { token, source } = parseRawAuth(rawAuthOrToken);
  if (!token) {
    const e = new Error('No token provided');
    e.code = 'NO_TOKEN';
    throw e;
  }
  const decoded = jwt.verify(token, JWT_SECRET);
  const id = decoded && decoded.user && decoded.user.id ? decoded.user.id : decoded.id || decoded._id;
  const role = decoded && decoded.user && decoded.user.role ? decoded.user.role : decoded.role;
  return { id, role, decoded, rawToken: token, source };
}

function isAdminToken(rawAuthOrToken) {
  const info = verifyToken(rawAuthOrToken);
  if (info.role === 'admin' || info.role === 'administrator') return info;
  const e = new Error('Not an admin token');
  e.code = 'NOT_ADMIN';
  throw e;
}

// Simple authentication middleware (keeps previous behavior)
function middleware(req, res, next) {
  // Support multiple header shapes and query/body tokens for flexibility
  const rawAuth = req.headers['authorization'] || req.headers['Authorization'] || req.headers['x-access-token'] || req.headers['token'] || (req.query && req.query.token) || (req.body && req.body.token);

  let token = null;
  let source = null;
  if (rawAuth && typeof rawAuth === 'string') {
    if (rawAuth.startsWith('Bearer ')) {
      token = rawAuth.split(' ')[1];
      source = 'authorization';
    } else {
      // Could be a raw token in x-access-token or token header
      token = rawAuth;
      source = 'header';
    }
  }

  if (!token) {
    console.log(`[AUTH] No token provided for ${req.method} ${req.originalUrl}. Available headers: ${Object.keys(req.headers).join(', ')}`);
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Mask token for logs
    const masked = token.length > 10 ? token.slice(0, 6) + '...' + token.slice(-4) : token;
    console.log(`[AUTH] Token verified (source=${source}). token=${masked} route=${req.method} ${req.originalUrl}`);

    req.user = {
      id: decoded.user && decoded.user.id ? decoded.user.id : decoded.id || decoded._id,
      role: decoded.user && decoded.user.role ? decoded.user.role : decoded.role
    };
    console.log('[AUTH] req.user:', req.user);
    if (!req.user.id) {
      console.log('[AUTH] Invalid token payload:', decoded);
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    next();
  } catch (err) {
    console.log('[AUTH] Invalid token:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Export middleware as default and helper functions as properties so both require styles work
module.exports = middleware;
module.exports.verifyToken = verifyToken;
module.exports.isAdminToken = isAdminToken;
