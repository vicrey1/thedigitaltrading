const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Simple authentication middleware
module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.user && decoded.user.id ? decoded.user.id : decoded.id || decoded._id,
      role: decoded.user && decoded.user.role ? decoded.user.role : decoded.role
    };
    if (!req.user.id) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
