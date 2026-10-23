// src/modules/holdings/holdings.service.js
// Returns a user's current stock holdings with live P&L calculations.
//
// KEY CONCEPT — WHY JOIN with stocks?
// The holdings table stores: quantity, average_buy_price
// The stocks table has:      current_price
//
// To show the user their portfolio value and P&L, we need BOTH.
// Rather than making two queries (one for holdings, one for prices),
// we JOIN them in one query — cleaner and faster.
//
// UNREALIZED P&L:
// The user OWNS shares but hasn't sold yet. If they sold RIGHT NOW,
// what would they gain or lose?
//   unrealized_pnl = quantity × (current_price − average_buy_price)
// Example:
//   Bought 10 TCS @ ₹3,900 (average_buy_price)
//   Current price = ₹4,020
//   Unrealized P&L = 10 × (4020 − 3900) = +₹1,200

import pool from "../../config/db.js";

const getHoldings = async (userId) => {
  const result = await pool.query(
    `SELECT
       h.stock_id,
       s.symbol,
       s.company_name,
       s.current_price,
       h.quantity,
       h.average_buy_price,
       -- current market value of this holding
       ROUND(h.quantity * s.current_price, 2)                             AS current_value,
       -- how much gain/loss if sold right now
       ROUND(h.quantity * (s.current_price - h.average_buy_price), 2)    AS unrealized_pnl,
       -- P&L as a percentage of the invested amount
       ROUND(
         ((s.current_price - h.average_buy_price) / h.average_buy_price) * 100,
         2
       )                                                                   AS unrealized_pnl_percent,
       h.updated_at
     FROM holdings h
     JOIN stocks s ON s.id = h.stock_id
     WHERE h.user_id = $1
       AND h.quantity > 0
     ORDER BY s.symbol ASC`,
    [userId]
  );

  return result.rows;
};

export { getHoldings };
