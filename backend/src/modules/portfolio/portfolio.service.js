// src/modules/portfolio/portfolio.service.js
// Business logic for user portfolio overview and overall P&L.
//
// WHY NO SEPARATE PORTFOLIO TABLE? (DBMS Normalization)
// Portfolio value is completely derived from:
// 1. users.balance
// 2. holdings.quantity & holdings.average_buy_price
// 3. stocks.current_price
// Storing portfolio_value in a table would violate 3rd Normal Form (redundant derived data).
// Calculating it dynamically guarantees it is ALWAYS 100% accurate and up-to-date.

import pool from "../../config/db.js";
import { getHoldings } from "../holdings/holdings.service.js";

const getPortfolio = async (userId) => {
  // 1. Fetch user's cash balance
  const userRes = await pool.query("SELECT balance FROM users WHERE id = $1", [userId]);
  const cashBalance = Number(userRes.rows[0]?.balance || 0);

  // 2. Fetch all current holdings with live stock prices
  const holdings = await getHoldings(userId);

  // 3. Aggregate totals
  let totalInvested = 0;
  let totalCurrentValue = 0;

  for (const h of holdings) {
    totalInvested += Number(h.quantity) * Number(h.average_buy_price);
    totalCurrentValue += Number(h.current_value);
  }

  totalInvested = Number(totalInvested.toFixed(2));
  totalCurrentValue = Number(totalCurrentValue.toFixed(2));

  const unrealizedPnL = Number((totalCurrentValue - totalInvested).toFixed(2));
  const unrealizedPnLPercent =
    totalInvested > 0 ? Number(((unrealizedPnL / totalInvested) * 100).toFixed(2)) : 0;

  const totalPortfolioValue = Number((cashBalance + totalCurrentValue).toFixed(2));

  return {
    cash_balance: cashBalance,
    total_invested: totalInvested,
    current_holding_value: totalCurrentValue,
    total_portfolio_value: totalPortfolioValue,
    unrealized_pnl: unrealizedPnL,
    unrealized_pnl_percent: unrealizedPnLPercent,
    holdings_count: holdings.length,
    holdings,
  };
};

export { getPortfolio };
