// src/modules/orders/orders.controller.js
// Handles HTTP request/response for orders.

import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as ordersService from "./orders.service.js";

const placeOrder = asyncHandler(async (req, res) => {
  const { symbol, side, order_type, quantity, price } = req.body;
  const order = await ordersService.createOrder({
    userId: req.user.id,
    symbol,
    side,
    order_type,
    quantity,
    price,
  });

  res.status(201).json(new ApiResponse(201, "Order placed successfully", order));
});

const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await ordersService.getUserOrders(req.user.id);
  res.status(200).json(new ApiResponse(200, "Orders fetched", orders));
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await ordersService.getOrderById(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, "Order fetched", order));
});

const cancelOrder = asyncHandler(async (req, res) => {
  const cancelledOrder = await ordersService.cancelOrder(req.params.id, req.user.id);
  res.status(200).json(new ApiResponse(200, "Order cancelled successfully", cancelledOrder));
});

export { placeOrder, getUserOrders, getOrderById, cancelOrder };
