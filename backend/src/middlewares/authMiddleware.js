// src/middlewares/authMiddleware.js
// Protects routes that require a logged-in user.
// Reads the JWT from the Authorization header (Bearer token),
// verifies it, fetches the user from DB, attaches to req.user.

import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized: no token provided");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Unauthorized: invalid or expired token");
  }

  const result = await pool.query(
    "SELECT id, name, email, balance FROM users WHERE id = $1",
    [decoded.userId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(401, "Unauthorized: user not found");
  }

  req.user = result.rows[0];
  next();
});

export { authMiddleware };
