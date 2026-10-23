// src/modules/trades/trades.routes.js
// Routes for viewing execution and trade history.

import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import * as tradesController from "./trades.controller.js";

const router = Router();

// GET /api/trades/market   — Recent trades across the exchange (public)
router.get("/market", tradesController.getMarketTrades);

// GET /api/trades          — Authenticated user's executed trade history
router.get("/", authMiddleware, tradesController.getUserTrades);

export default router;
