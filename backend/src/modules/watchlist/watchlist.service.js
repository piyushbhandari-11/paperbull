// src/modules/watchlist/watchlist.service.js
// Business logic for user stock watchlists (M:N relationship).

import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";

const getWatchlist = async (userId) => {
  const result = await pool.query(
    `SELECT
       s.id AS stock_id,
       s.symbol,
       s.company_name,
       s.current_price,
       w.created_at AS added_at
     FROM watchlist w
     JOIN stocks s ON s.id = w.stock_id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return result.rows;
};

const addToWatchlist = async (userId, symbol) => {
  const upperSymbol = symbol.toUpperCase();

  const stockRes = await pool.query(
    "SELECT id, symbol, company_name, current_price FROM stocks WHERE symbol = $1 AND is_active = true",
    [upperSymbol]
  );

  if (stockRes.rowCount === 0) {
    throw new ApiError(404, `Stock '${upperSymbol}' not found`);
  }

  const stock = stockRes.rows[0];

  await pool.query(
    `INSERT INTO watchlist (user_id, stock_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, stock_id) DO NOTHING`,
    [userId, stock.id]
  );

  return stock;
};

const removeFromWatchlist = async (userId, stockId) => {
  const result = await pool.query(
    "DELETE FROM watchlist WHERE user_id = $1 AND stock_id = $2 RETURNING stock_id",
    [userId, stockId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, "Stock not found in your watchlist");
  }

  return { stockId };
};

export { getWatchlist, addToWatchlist, removeFromWatchlist };
