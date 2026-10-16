// src/middlewares/errorMiddleware.js
// Central error handler — the final Express middleware.
// WHY: Instead of writing error responses in every route/controller,
// all errors (thrown ApiError or unhandled exceptions) bubble up here.
// Express identifies this as an error handler because it takes 4 arguments: (err, req, res, next)

import { ApiError } from "../utils/ApiError.js";

const errorMiddleware = (err, req, res, next) => {
  // If it's our own ApiError, use its status code and message
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // PostgreSQL unique violation (e.g., duplicate email)
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
    });
  }

  // Fallback for unexpected errors
  console.error("Unhandled error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export { errorMiddleware };
