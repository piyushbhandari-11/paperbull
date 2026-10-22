// src/modules/orders/orders.routes.js
// Order management routes (all protected).

import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validate.js";
import { placeOrderSchema } from "./orders.schema.js";
import * as ordersController from "./orders.controller.js";

const router = Router();

// Apply authMiddleware to all order routes
router.use(authMiddleware);

// POST /api/orders        — Place a new BUY/SELL order
router.post("/", validate(placeOrderSchema), ordersController.placeOrder);

// GET  /api/orders        — List authenticated user's orders
router.get("/", ordersController.getUserOrders);

// GET  /api/orders/:id    — Get details of a specific order
router.get("/:id", ordersController.getOrderById);

// DELETE /api/orders/:id  — Cancel a PENDING order
router.delete("/:id", ordersController.cancelOrder);

export default router;
