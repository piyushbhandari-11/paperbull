// src/modules/transactions/transactions.routes.js
// Routes for financial movements (Debits/Credits).

import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import * as transactionsController from "./transactions.controller.js";

const router = Router();

// GET /api/transactions  — Authenticated user's transaction ledger
router.get("/", authMiddleware, transactionsController.getUserTransactions);

export default router;
