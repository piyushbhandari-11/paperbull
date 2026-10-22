// src/modules/orders/orders.service.js
// Business logic for order creation, listing, and cancellation.
//
// OPTION B CONCURRENCY STRATEGY:
// 1. Sanity check: We do a fast preliminary check on balance/holding at order placement
//    to fail early with a helpful error if the user obviously doesn't have funds/shares.
// 2. Real protection: Atomic deductions and locking (SELECT FOR UPDATE) happen when the order
//    is executed by the matching engine/worker. This avoids holding DB row locks while requests wait in queue.

import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { enqueueOrder } from "../../redis/orderQueue.js";

// -----------------------------------------------------------
// createOrder({ userId, symbol, side, order_type, quantity, price })
// Validates stock, performs preliminary sanity checks, and stores PENDING order.
// -----------------------------------------------------------
const createOrder = async ({ userId, symbol, side, order_type, quantity, price }) => {
  const upperSymbol = symbol.toUpperCase();

  // 1. Fetch stock details
  const stockResult = await pool.query(
    `SELECT id, symbol, current_price, is_active
     FROM stocks
     WHERE symbol = $1`,
    [upperSymbol]
  );

  if (stockResult.rowCount === 0) {
    throw new ApiError(404, `Stock '${upperSymbol}' not found`);
  }

  const stock = stockResult.rows[0];

  if (!stock.is_active) {
    throw new ApiError(400, `Stock '${upperSymbol}' is currently not active for trading`);
  }

  // 2. Preliminary sanity check (Option B)
  if (side === "BUY") {
    // For LIMIT, check against limit price. For MARKET, estimate using current price.
    const estimatedPrice = order_type === "LIMIT" ? Number(price) : Number(stock.current_price);
    const estimatedTotal = estimatedPrice * quantity;

    const userResult = await pool.query("SELECT balance FROM users WHERE id = $1", [userId]);
    const balance = Number(userResult.rows[0]?.balance || 0);

    if (balance < estimatedTotal) {
      throw new ApiError(
        400,
        `Insufficient funds. Estimated cost: ₹${estimatedTotal.toFixed(2)}, Available balance: ₹${balance.toFixed(2)}`
      );
    }
  } else if (side === "SELL") {
    // Check if user currently holds enough shares of this stock
    const holdingResult = await pool.query(
      `SELECT quantity FROM holdings WHERE user_id = $1 AND stock_id = $2`,
      [userId, stock.id]
    );

    const holdingQty = holdingResult.rows[0]?.quantity || 0;
    if (holdingQty < quantity) {
      throw new ApiError(
        400,
        `Insufficient stock holdings to sell. Available: ${holdingQty} shares, Requested: ${quantity} shares`
      );
    }
  }

  // 3. Insert order into DB with status 'PENDING'
  // Market orders have price = null; limit orders store the requested price.
  const orderPrice = order_type === "LIMIT" ? price : null;

  const orderResult = await pool.query(
    `INSERT INTO orders (
       user_id, stock_id, side, order_type, quantity, remaining_quantity, price, status
     )
     VALUES ($1, $2, $3, $4, $5, $5, $6, 'PENDING')
     RETURNING id, user_id, stock_id, side, order_type, quantity, remaining_quantity, price, status, created_at`,
    [userId, stock.id, side, order_type, quantity, orderPrice]
  );

  const order = orderResult.rows[0];

  // 4. Producer: Enqueue order ID into Redis Queue (paperbull:orders)
  // Decoupled architecture: API server returns immediately (fast response time)
  // Background workers consume orders asynchronously with BRPOP.
  await enqueueOrder(order.id);

  return {
    ...order,
    symbol: stock.symbol,
    message: "Order placed and queued for execution",
  };
};

// -----------------------------------------------------------
// getUserOrders(userId)
// Returns all orders placed by the user, newest first.
// -----------------------------------------------------------
const getUserOrders = async (userId) => {
  const result = await pool.query(
    `SELECT
       o.id,
       o.side,
       o.order_type,
       o.quantity,
       o.remaining_quantity,
       o.price,
       o.status,
       o.created_at,
       o.updated_at,
       s.symbol,
       s.company_name,
       s.current_price AS stock_current_price
     FROM orders o
     JOIN stocks s ON s.id = o.stock_id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );

  return result.rows;
};

// -----------------------------------------------------------
// getOrderById(orderId, userId)
// Fetch single order details for the authenticated user.
// -----------------------------------------------------------
const getOrderById = async (orderId, userId) => {
  const result = await pool.query(
    `SELECT
       o.id,
       o.side,
       o.order_type,
       o.quantity,
       o.remaining_quantity,
       o.price,
       o.status,
       o.created_at,
       o.updated_at,
       s.symbol,
       s.company_name,
       s.current_price AS stock_current_price
     FROM orders o
     JOIN stocks s ON s.id = o.stock_id
     WHERE o.id = $1 AND o.user_id = $2`,
    [orderId, userId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, "Order not found");
  }

  return result.rows[0];
};

// -----------------------------------------------------------
// cancelOrder(orderId, userId)
// Cancels a PENDING order.
// -----------------------------------------------------------
const cancelOrder = async (orderId, userId) => {
  const result = await pool.query(
    `UPDATE orders
     SET status = 'CANCELLED', updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'PENDING'
     RETURNING id, side, order_type, quantity, remaining_quantity, status`,
    [orderId, userId]
  );

  if (result.rowCount === 0) {
    // Check if order exists but has another status
    const checkResult = await pool.query(
      `SELECT status FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (checkResult.rowCount === 0) {
      throw new ApiError(404, "Order not found");
    }

    const currentStatus = checkResult.rows[0].status;
    throw new ApiError(400, `Cannot cancel order with status '${currentStatus}'`);
  }

  return result.rows[0];
};

export { createOrder, getUserOrders, getOrderById, cancelOrder };
