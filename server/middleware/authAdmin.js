const auth = require("./auth");
const logger = require("../utils/logger");

// Admin authentication middleware - chained with auth middleware
const adminAuth = [
  auth,
  (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        logger.error("[ADMIN AUTH] No user object found");
        return res.status(401).json({ 
          message: "Authentication required. Please log in.",
          error: "NO_USER"
        });
      }

      if (req.user.role !== "admin") {
        logger.error("[ADMIN AUTH] User is not admin:", { userId: req.user.id, role: req.user.role });
        return res.status(403).json({ 
          message: "Access denied. Admin privileges required.",
          error: "NOT_ADMIN"
        });
      }

      logger.info("[ADMIN AUTH] Admin access granted", { 
        userId: req.user.id,
        source: req.user.source
      });
      next();
    } catch (error) {
      logger.error("[ADMIN AUTH] Error:", error);
      res.status(500).json({ 
        message: "Internal server error in authentication",
        error: error.code || "AUTH_ERROR"
      });
    }
  }
];

module.exports = adminAuth;
