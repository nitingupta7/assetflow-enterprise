// ─── Role-Based Access Control Middleware ────────────
// Factory function that returns middleware checking
// if the authenticated user's role is in the allowed list.
//
// Usage in routes:
//   router.post("/", auth, authorize("ADMIN", "ASSET_MANAGER"), controller)

const ApiError = require("../utils/apiError");

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = authorize;
