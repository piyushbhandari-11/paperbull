// src/modules/users/users.service.js
// Simple user data — profile and balance.

import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";

// -----------------------------------------------------------
// getMe(userId)
// Returns the logged-in user's profile and current balance.
// The balance is their available virtual cash (wallet).
// req.user is already set by authMiddleware, but we re-fetch
// from DB to always get the latest balance (not the JWT snapshot).
// -----------------------------------------------------------
const getMe = async (userId) => {
  const result = await pool.query(
    `SELECT id, name, email, balance, created_at
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, "User not found");
  }

  return result.rows[0];
};

export { getMe };
