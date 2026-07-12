// ─── Helper Utilities ────────────────────────────────
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 12;

// ─── Password Helpers ────────────────────────────────

const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

// ─── JWT Helpers ─────────────────────────────────────
const env = require("../config/env");

const signToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

// ─── Response Helpers ────────────────────────────────

const sendSuccess = (res, data = {}, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

const sendError = (res, message = "Something went wrong", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// ─── Exclude fields from Prisma result ───────────────

const excludeFields = (obj, keys) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key))
  );
};

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  sendSuccess,
  sendError,
  excludeFields,
};
