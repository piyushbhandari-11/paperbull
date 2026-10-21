// src/modules/watchlist/watchlist.routes.js
// Protected user watchlist routes.

import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import * as watchlistController from "./watchlist.controller.js";

const router = Router();

router.use(authMiddleware);

// GET    /api/watchlist           — user's watched stocks
router.get("/", watchlistController.getWatchlist);

// POST   /api/watchlist           — add stock to watchlist by symbol { "symbol": "TCS" }
router.post("/", watchlistController.addToWatchlist);

// DELETE /api/watchlist/:stockId  — remove stock from watchlist
router.delete("/:stockId", watchlistController.removeFromWatchlist);

export default router;
