// src/modules/trades/trades.service.js
// Business logic for viewing execution/trade history.
//
// TRADE VS ORDER (Core Concept):
// An ORDER represents the intention (e.g. BUY 100 TCS).
// A TRADE represents the actual execution (e.g. 40 shares @ ₹4000, 60 shares @ ₹4010).
// 1 Order can produce multiple Trades.

import pool from "../../config/db.js";

// -----------------------------------------------------------
// getUserTrades(userId)
// Fetches all executed trades where the user was either the buyer OR seller.
// -----------------------------------------------------------
const getUserTrades = async (userId) => {
  const result = await pool.query(
    `SELECT
       t.id,
       t.stock_id,
       s.symbol,
       s.company_name,
       t.quantity,
       t.price,
       ROUND(t.quantity * t.price, 2) AS total_amount,
       CASE WHEN t.buyer_id = $1 THEN 'BUY' ELSE 'SELL' END AS side,
       t.executed_at,
       t.buy_order_id,
       t.sell_order_id
     FROM trades t
     JOIN stocks s ON s.id = t.stock_id
     WHERE t.buyer_id = $1 OR t.seller_id = $1
     ORDER BY t.executed_at DESC`,
    [userId]
  );

  return result.rows;
};

// -----------------------------------------------------------
// getMarketTrades(limit = 50)
// Fetches recent executions across the entire exchange.
// Used for the live market trade ticker.
// -----------------------------------------------------------
const getMarketTrades = async (limit = 50) => {
  const result = await pool.query(
    `SELECT
       t.id,
       s.symbol,
       s.company_name,
       t.quantity,
       t.price,
       ROUND(t.quantity * t.price, 2) AS total_amount,
       t.executed_at
     FROM trades t
     JOIN stocks s ON s.id = t.stock_id
     ORDER BY t.executed_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows;
};

export { getUserTrades, getMarketTrades };
