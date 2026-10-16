// src/utils/asyncHandler.js
// A higher-order function that wraps async route handlers.
// WHY: Without this, every async controller needs try/catch.
// asyncHandler catches any thrown error (including ApiError) and
// passes it to Express's next() so the error middleware handles it.

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { asyncHandler };
