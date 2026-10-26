// src/bots/tradingBots.js
// Automated Trading Bot Simulator.
//
// DEMONSTRATES:
// 1. Concurrent Multi-User Load:
//    Simulates multiple autonomous trader agents trading against each other and against human users.
// 2. High-throughput Queue pipeline:
//    Bots generate orders -> API pushes to Redis Queue -> Workers match in parallel -> Socket.IO pushes to UI.
// 3. Alive Market Experience:
//    Prices move, trades execute, volume builds continuously without waiting for human input!

import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { createOrder } from "../modules/orders/orders.service.js";

const BOTS = [
  { name: "AlphaBot", email: "alpha@bot.paperbull.com" },
  { name: "BetaTrader", email: "beta@bot.paperbull.com" },
  { name: "GammaFund", email: "gamma@bot.paperbull.com" },
  { name: "DeltaAlgo", email: "delta@bot.paperbull.com" },
];

let botUserIds = [];
let isRunning = true;

/**
 * Ensures bot accounts exist in PostgreSQL with starting cash & holdings.
 */
const initBots = async () => {
  const passwordHash = await bcrypt.hash("botsecret123", 10);
  const userIds = [];

  for (const bot of BOTS) {
    const res = await pool.query(
      `INSERT INTO users (name, email, password_hash, balance)
       VALUES ($1, $2, $3, 1000000.00)
       ON CONFLICT (email) DO UPDATE SET balance = GREATEST(users.balance, 500000.00)
       RETURNING id`,
      [bot.name, bot.email, passwordHash]
    );
    const userId = res.rows[0].id;
    userIds.push(userId);

    // Give bot starting holdings so it can place SELL orders
    const stocksRes = await pool.query("SELECT id, current_price FROM stocks");
    for (const stock of stocksRes.rows) {
      await pool.query(
        `INSERT INTO holdings (user_id, stock_id, quantity, average_buy_price)
         VALUES ($1, $2, 200, $3)
         ON CONFLICT (user_id, stock_id) DO NOTHING`,
        [userId, stock.id, stock.current_price]
      );
    }
  }

  return userIds;
};

/**
 * Main simulation loop: randomly picks a bot and places a realistic order.
 */
const runBotSimulation = async () => {
  console.log("🤖 Initializing Trading Bots...");
  botUserIds = await initBots();
  console.log(`✅ ${botUserIds.length} bots initialized and funded.`);
  console.log("🚀 Trading bots active! Generating orders into Redis Queue...");

  const stocksRes = await pool.query("SELECT symbol, current_price FROM stocks WHERE is_active = true");
  const stocks = stocksRes.rows;

  while (isRunning) {
    try {
      // Pick random bot and random stock
      const randomBotId = botUserIds[Math.floor(Math.random() * botUserIds.length)];
      const randomStock = stocks[Math.floor(Math.random() * stocks.length)];

      const side = Math.random() > 0.5 ? "BUY" : "SELL";
      const orderType = Math.random() > 0.4 ? "MARKET" : "LIMIT";
      const quantity = Math.floor(Math.random() * 15) + 1; // 1 to 15 shares

      let price = null;
      if (orderType === "LIMIT") {
        const curPrice = Number(randomStock.current_price);
        // Limit price slightly around market price (-1% to +1%)
        const spread = (Math.random() * 0.02 - 0.01) * curPrice;
        price = Number((curPrice + spread).toFixed(2));
      }

      await createOrder({
        userId: randomBotId,
        symbol: randomStock.symbol,
        side,
        order_type: orderType,
        quantity,
        price,
      });

      console.log(`🤖 [Bot] ${side} ${quantity} ${randomStock.symbol} (${orderType}${price ? ` @ ₹${price}` : ""}) queued`);

      // Random delay between 1.5s and 3.5s before next bot order
      const delay = Math.floor(Math.random() * 2000) + 1500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (err) {
      // Ignore routine sanity check rejections (e.g. bot ran out of shares temporarily)
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
};

process.on("SIGINT", () => {
  console.log("\n🛑 Stopping trading bots...");
  isRunning = false;
  process.exit(0);
});

runBotSimulation();
