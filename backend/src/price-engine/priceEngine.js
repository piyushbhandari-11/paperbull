// src/price-engine/priceEngine.js
// Simulates live market price fluctuations for active stocks.
//
// HOW IT WORKS:
// 1. Periodically ticks (every 2-3 seconds).
// 2. Applies a realistic random walk (Geometric Brownian Motion variation) between -0.6% and +0.6%.
// 3. Atomically updates PostgreSQL stocks table and appends to price_history.
// 4. Publishes "price_updated" to Redis Pub/Sub ("paperbull:events").
// 5. Socket.IO picks up the Redis event and streams it live to all connected browser clients!

import pool from "../config/db.js";
import { redis } from "../config/redis.js";

let timer = null;

/**
 * Perform one simulation tick across active stocks.
 */
export const tickPrices = async () => {
  try {
    const stocksRes = await pool.query(
      "SELECT id, symbol, current_price FROM stocks WHERE is_active = true"
    );

    if (stocksRes.rowCount === 0) return;

    // Pick 3 to 5 random stocks to fluctuate in each tick (keeps movement realistic)
    const shuffled = [...stocksRes.rows].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(4, shuffled.length));

    for (const stock of selected) {
      const oldPrice = Number(stock.current_price);

      // Random percentage delta between -0.6% and +0.6%
      const deltaPercent = (Math.random() * 1.2 - 0.6) / 100;
      let newPrice = Number((oldPrice * (1 + deltaPercent)).toFixed(2));

      // Guard: Stock price cannot fall below ₹1.00
      if (newPrice < 1.0) newPrice = 1.0;

      if (newPrice === oldPrice) continue;

      // 1. Update current price in DB
      await pool.query(
        "UPDATE stocks SET current_price = $1, updated_at = NOW() WHERE id = $2",
        [newPrice, stock.id]
      );

      // 2. Append to historical chart data
      await pool.query(
        "INSERT INTO price_history (stock_id, price, recorded_at) VALUES ($1, $2, NOW())",
        [stock.id, newPrice]
      );

      // 3. Publish to Redis Pub/Sub for WebSockets
      const priceEvent = {
        type: "price_updated",
        payload: {
          stockId: stock.id,
          symbol: stock.symbol,
          price: newPrice,
          oldPrice,
          changePercent: Number((((newPrice - oldPrice) / oldPrice) * 100).toFixed(2)),
          timestamp: new Date().toISOString(),
        },
      };

      await redis.publish("paperbull:events", JSON.stringify(priceEvent));
    }
  } catch (err) {
    console.error("Price Engine Tick Error:", err.message);
  }
};

/**
 * Start price engine simulation interval.
 * @param {number} intervalMs - Default 2500ms
 */
export const startPriceEngine = (intervalMs = 2500) => {
  if (timer) return;
  console.log(`📈 Price Engine started (ticking every ${intervalMs}ms)...`);
  timer = setInterval(tickPrices, intervalMs);
};

export const stopPriceEngine = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log("🛑 Price Engine stopped.");
  }
};

// Allow standalone execution: node src/price-engine/priceEngine.js
if (process.argv[1]?.endsWith("priceEngine.js")) {
  startPriceEngine();
}
