// src/modules/auth/auth.service.js
// Business logic for authentication.
// WHY separate from controller?
// Controller handles HTTP (req/res). Service handles logic (DB, hashing, tokens).
// This separation means the same service could be used by a CLI or test later.

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";

const SALT_ROUNDS = 10;

// Register a new user and give them virtual money
const register = async ({ name, email, password }) => {
  // Check if email already exists
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount > 0) {
    throw new ApiError(409, "Email already registered");
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // INITIAL_BALANCE comes from env — defaults to ₹1,00,000
  const initialBalance = Number(process.env.INITIAL_BALANCE) || 100000;

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, balance)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, balance, created_at`,
    [name, email, password_hash, initialBalance]
  );

  return result.rows[0];
};

// Verify credentials and issue a JWT
const login = async ({ email, password }) => {
  const result = await pool.query(
    "SELECT id, name, email, password_hash, balance FROM users WHERE email = $1",
    [email]
  );

  if (result.rowCount === 0) {
    throw new ApiError(401, "Invalid email or password");
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
};

export { register, login };
