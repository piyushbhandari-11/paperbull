// src/modules/transactions/transactions.service.js
// Business logic for financial account movement (wallet debits and credits).
//
// TRANSACTION VS TRADE:
// Trade = Market event (Shares exchanged at price X).
// Transaction = Wallet/Account event (₹ Deducted or Credited).

import pool from "../../config/db.js";

const getUserTransactions = async (userId) => {
  const result = await pool.query(
    `SELECT
       tx.id,
       tx.type,
       tx.amount,
       tx.created_at,
       t.id AS trade_id,
       t.price AS trade_price,
       t.quantity AS trade_quantity,
       s.symbol,
       s.company_name
     FROM transactions tx
     JOIN trades t ON t.id = tx.trade_id
     JOIN stocks s ON s.id = t.stock_id
     WHERE tx.user_id = $1
     ORDER BY tx.created_at DESC`,
    [userId]
  );

  return result.rows;
};

export { getUserTransactions };
