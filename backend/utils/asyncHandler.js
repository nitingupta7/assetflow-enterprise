// ─── Async Handler Wrapper ───────────────────────────
// Wraps async route handlers to auto-catch errors
// and forward them to Express error handler.
// Usage: router.get("/", asyncHandler(myController))

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
