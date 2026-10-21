// src/modules/stocks/stocks.service.js
// Business logic for the stocks module.
// All queries here are READ-ONLY — stocks are seeded via schema.sql.
// The price engine (Step 14) will update current_price periodically.

import pool from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";

// -----------------------------------------------------------
// getAllStocks()
// Returns all active stocks with their current price.
// Used on the market listing page.
//
// WHY filter is_active = true?
// We never DELETE stocks (would break historical trade/order records).
// We just mark them inactive. Active = currently tradable.
// -----------------------------------------------------------
const getAllStocks = async () => {
  const result = await pool.query(
    `SELECT id, symbol, company_name, current_price, updated_at
     FROM stocks
     WHERE is_active = true
     ORDER BY symbol ASC`
  );
  return result.rows;
};

// -----------------------------------------------------------
// getStockBySymbol(symbol)
// Returns one stock + last 50 price history points.
// Used on the stock detail page (chart + order placement).
//
// WHY 50 history points?
// Enough for a simple sparkline/chart without over-fetching.
// We'll increase this when the chart UI is built.
// -----------------------------------------------------------
const getStockBySymbol = async (symbol) => {
  // Normalize: always uppercase so 'tcs' and 'TCS' both work
  const upperSymbol = symbol.toUpperCase();

  const stockResult = await pool.query(
    `SELECT id, symbol, company_name, current_price, updated_at
     FROM stocks
     WHERE symbol = $1 AND is_active = true`,
    [upperSymbol]
  );

  if (stockResult.rowCount === 0) {
    throw new ApiError(404, `Stock '${upperSymbol}' not found`);
  }

  const stock = stockResult.rows[0];

  // Fetch recent price history for this stock
  const historyResult = await pool.query(
    `SELECT price, recorded_at
     FROM price_history
     WHERE stock_id = $1
     ORDER BY recorded_at DESC
     LIMIT 50`,
    [stock.id]
  );

  // Reverse so chart renders left (oldest) → right (newest)
  const priceHistory = historyResult.rows.reverse();

  return { ...stock, priceHistory };
};

// -----------------------------------------------------------
// getTopTradedStocks(limit = 5)
// Computes top traded stocks based on actual executed trade volume (DBMS aggregation).
// -----------------------------------------------------------
const getTopTradedStocks = async (limit = 5) => {
  const result = await pool.query(
    `SELECT
       s.id,
       s.symbol,
       s.company_name,
       s.current_price,
       COALESCE(SUM(t.quantity), 0)::INTEGER AS total_traded_volume,
       COUNT(t.id)::INTEGER AS total_trades_count
     FROM stocks s
     LEFT JOIN trades t ON t.stock_id = s.id
     WHERE s.is_active = true
     GROUP BY s.id, s.symbol, s.company_name, s.current_price
     ORDER BY total_traded_volume DESC, total_trades_count DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
};

export { getAllStocks, getStockBySymbol, getTopTradedStocks };
