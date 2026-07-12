// ─── JWT Authentication Middleware ───────────────────
// Extracts Bearer token from Authorization header,
// verifies it, and attaches user to req.user.

const prisma = require("../config/db");
const { verifyToken } = require("../utils/helpers");
const ApiError = require("../utils/apiError");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        departmentId: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "User no longer exists.");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated.");
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

module.exports = auth;
