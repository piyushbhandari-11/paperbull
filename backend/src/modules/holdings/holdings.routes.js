// src/modules/holdings/holdings.routes.js
// Protected — user must be logged in to see their holdings.

import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import * as holdingsController from "./holdings.controller.js";

const router = Router();

// GET /api/holdings   — get logged-in user's stock holdings + P&L
router.get("/", authMiddleware, holdingsController.getHoldings);

export default router;
