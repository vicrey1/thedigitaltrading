const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const logger = require("../utils/logger");

function parseRawAuth(rawAuth) {
  console.log('[AUTH] Parsing auth header:', {
    headerValue: rawAuth ? (rawAuth.length > 50 ? rawAuth.substring(0, 50) + '...' : rawAuth) : null,
    headerType: typeof rawAuth
  });

  if (!rawAuth) return { token: null, source: null };
  if (typeof rawAuth !== "string") return { token: null, source: null };

  let token;
  let source = "header";

  if (rawAuth.startsWith("Bearer ")) {
    token = rawAuth.split(" ")[1];
    source = "authorization";
  } else {
    token = rawAuth;
  }

  // Validate token format
  if (token && typeof token === 'string' && token.split('.').length === 3) {
    console.log('[AUTH] Valid token format found:', {
      tokenPrefix: token.substring(0, 20) + '...',
      tokenLength: token.length,
      source
    });
    return { token, source };
  }

  console.error('[AUTH] Invalid token format:', {
    tokenLength: token?.length,
    tokenParts: token?.split('.')?.length
  });
  return { token: null, source: null };
}

function verifyToken(rawAuthOrToken) {
  const { token, source } = parseRawAuth(rawAuthOrToken);
  
  if (!token) {
    logger.error("[AUTH] No token provided");
    const e = new Error("No token provided");
    e.code = "NO_TOKEN";
    throw e;
  }

  if (!JWT_SECRET) {
    logger.error("[AUTH] JWT_SECRET not configured");
    const e = new Error("Server configuration error");
    e.code = "CONFIG_ERROR";
    throw e;
  }

  // Debug log for JWT verification
  logger.debug('[AUTH] Verifying token:', {
    tokenStart: token.substring(0, 20) + '...',
    tokenLength: token?.length,
    secretStart: JWT_SECRET?.substring(0, 5) + '...',
    secretLength: JWT_SECRET?.length,
  });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ensure required fields exist
    if (!decoded.id && !decoded._id) {
      throw new Error('Token missing user ID');
    }

    const id = decoded.id || decoded._id;
    const role = decoded.role;
    
    // Handle impersonation tokens
    const isImpersonated = decoded.impersonation === true;
    if (isImpersonated) {
      logger.info("[AUTH] Processing impersonation token", { 
        userId: id,
        role,
        impersonatedBy: decoded.impersonatedBy 
      });
    }
    
    logger.debug("[AUTH] Token verified successfully", { 
      id, 
      role, 
      source,
      isImpersonated 
    });
    
    return { 
      id, 
      role, 
      decoded, 
      rawToken: token, 
      source,
      isImpersonated 
    };
  } catch (err) {
    logger.error("[AUTH] Token verification failed:", err.message);
    throw err;
  }
}

function middleware(req, res, next) {
  try {
    const rawAuth = req.headers["authorization"];
    const info = verifyToken(rawAuth);
    req.user = {
      id: info.id,
      role: info.role,
      source: info.source,
      decoded: info.decoded,
      token: info.rawToken
    };
    logger.debug("[AUTH] User set in request:", req.user);
    next();
  } catch (err) {
    logger.error("[AUTH] Authentication failed:", err.message);
    res.status(401).json({ message: "Authentication required" });
  }
}

module.exports = middleware;
module.exports.verifyToken = verifyToken;
