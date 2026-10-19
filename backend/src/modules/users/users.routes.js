// src/modules/users/users.routes.js

import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import * as usersController from "./users.controller.js";

const router = Router();

// GET /api/users/me  — get logged-in user's profile + balance
router.get("/me", authMiddleware, usersController.getMe);

export default router;
