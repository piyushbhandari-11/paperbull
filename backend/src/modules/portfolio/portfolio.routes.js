// src/modules/portfolio/portfolio.routes.js
// Routes for user portfolio overview and P&L.

import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import * as portfolioController from "./portfolio.controller.js";

const router = Router();

// GET /api/portfolio  — Authenticated user's portfolio overview & unrealized P&L
router.get("/", authMiddleware, portfolioController.getPortfolio);

export default router;
