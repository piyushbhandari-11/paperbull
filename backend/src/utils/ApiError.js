// src/utils/ApiError.js
// A custom error class that extends the built-in Error class.
// WHY: Instead of writing res.status(400).json({ message: "..." }) everywhere,
// we throw an ApiError and let the central error middleware handle it.
// This keeps controllers clean and consistent.

class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.success = false;
  }
}

export { ApiError };
