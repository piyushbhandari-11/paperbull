// src/modules/auth/auth.controller.js
// Handles HTTP for auth routes. Calls service functions.
// Keeps it thin — no business logic here.

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as authService from "./auth.service.js";

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json(new ApiResponse(201, "Registration successful", user));
});

const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);
  res.status(200).json(new ApiResponse(200, "Login successful", { user, token }));
});

const logout = asyncHandler(async (req, res) => {
  // JWT is stateless — logout is handled client-side by discarding the token.
  // For production, you'd use a token blocklist in Redis.
  res.status(200).json(new ApiResponse(200, "Logged out successfully"));
});

export { register, login, logout };
