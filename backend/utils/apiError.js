// ─── Custom API Error Class ──────────────────────────
// Usage: throw new ApiError(404, "Resource not found")

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
