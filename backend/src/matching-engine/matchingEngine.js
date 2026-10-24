// src/matching-engine/matchingEngine.js
// Core Order Matching and Execution Engine for PaperBull.
//
// DEMONSTRATES:
// 1. OS Concept: Critical Section & Deadlock Prevention
//    - Row locks are acquired in a consistent order (users sorted by ID) to prevent circular wait deadlocks.
// 2. OS Concept: Race Conditions
//    - Uses SELECT ... FOR UPDATE so concurrent workers cannot double-spend cash or double-sell shares.
// 3. DBMS Concept: ACID Transactions
//    - Entire execution (cash transfer, holdings, trades, transactions, order state) occurs inside BEGIN ... COMMIT.
//    - If any constraint is violated (e.g. balance < 0), ROLLBACK restores exact state.
// 4. Financial Concept: Price-Time Priority
//    - BUY matches lowest price first, earliest time first.
//    - SELL matches highest price first, earliest time first.

import pool from "../config/db.js";
import { redis } from "../config/redis.js";

/**
 * Executes a trade between a buy order and a sell order atomically.
 * Must be executed with a dedicated pool client inside a BEGIN ... COMMIT block.
 */
const executeTrade = async (client, { buyOrder, sellOrder, quantity, price, stockId }) => {
  const tradeAmount = Number((quantity * price).toFixed(2));

  // --- DEADLOCK PREVENTION (OS Concept) ---
  // If User A buys from User B while User B buys from User A simultaneously,
  // locking buyer then seller could cause a circular wait deadlock.
  // Rule: Always lock users in alphabetical order of their UUIDs!
  const [firstUserId, secondUserId] = [buyOrder.user_id, sellOrder.user_id].sort();

  // 1. Lock both user rows
  await client.query("SELECT id, balance FROM users WHERE id = $1 FOR UPDATE", [firstUserId]);
  await client.query("SELECT id, balance FROM users WHERE id = $1 FOR UPDATE", [secondUserId]);

  // 2. Verify Buyer balance
  const buyerRes = await client.query("SELECT balance FROM users WHERE id = $1", [buyOrder.user_id]);
  const buyerBalance = Number(buyerRes.rows[0].balance);
  if (buyerBalance < tradeAmount) {
    throw new Error(`Buyer insufficient funds. Required: ₹${tradeAmount}, Available: ₹${buyerBalance}`);
  }

  // 3. Verify Seller shares (lock holding row)
  const sellerHoldingRes = await client.query(
    "SELECT quantity FROM holdings WHERE user_id = $1 AND stock_id = $2 FOR UPDATE",
    [sellOrder.user_id, stockId]
  );
  const sellerShares = sellerHoldingRes.rows[0]?.quantity || 0;
  if (sellerShares < quantity) {
    throw new Error(`Seller insufficient shares. Required: ${quantity}, Available: ${sellerShares}`);
  }

  // 4. Update Cash Balances
  // Deduct buyer cash
  await client.query("UPDATE users SET balance = balance - $1, updated_at = NOW() WHERE id = $2", [
    tradeAmount,
    buyOrder.user_id,
  ]);
  // Credit seller cash
  await client.query("UPDATE users SET balance = balance + $1, updated_at = NOW() WHERE id = $2", [
    tradeAmount,
    sellOrder.user_id,
  ]);

  // 5. Update Seller Holdings (decrease shares)
  await client.query(
    `UPDATE holdings
     SET quantity = quantity - $1, updated_at = NOW()
     WHERE user_id = $2 AND stock_id = $3`,
    [quantity, sellOrder.user_id, stockId]
  );

  // 6. Update Buyer Holdings (increase shares and recalculate weighted average buy price)
  const buyerHoldingRes = await client.query(
    "SELECT quantity, average_buy_price FROM holdings WHERE user_id = $1 AND stock_id = $2 FOR UPDATE",
    [buyOrder.user_id, stockId]
  );

  if (buyerHoldingRes.rowCount === 0) {
    // First time buying this stock
    await client.query(
      `INSERT INTO holdings (user_id, stock_id, quantity, average_buy_price, updated_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [buyOrder.user_id, stockId, quantity, price]
    );
  } else {
    // Existing holding: calculate new weighted average
    const currentQty = buyerHoldingRes.rows[0].quantity;
    const currentAvg = Number(buyerHoldingRes.rows[0].average_buy_price);
    const newQty = currentQty + quantity;
    const newAvg = Number((((currentQty * currentAvg) + (quantity * price)) / newQty).toFixed(2));

    await client.query(
      `UPDATE holdings
       SET quantity = $1, average_buy_price = $2, updated_at = NOW()
       WHERE user_id = $3 AND stock_id = $4`,
      [newQty, newAvg, buyOrder.user_id, stockId]
    );
  }

  // 7. Insert Trade record (Market Execution Audit)
  const tradeRes = await client.query(
    `INSERT INTO trades (stock_id, buy_order_id, sell_order_id, buyer_id, seller_id, quantity, price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, stock_id, buy_order_id, sell_order_id, buyer_id, seller_id, quantity, price, executed_at`,
    [stockId, buyOrder.id, sellOrder.id, buyOrder.user_id, sellOrder.user_id, quantity, price]
  );
  const trade = tradeRes.rows[0];

  // 8. Insert Financial Transactions (Account Audit)
  // DEBIT for buyer
  await client.query(
    `INSERT INTO transactions (user_id, trade_id, type, amount)
     VALUES ($1, $2, 'DEBIT', $3)`,
    [buyOrder.user_id, trade.id, tradeAmount]
  );
  // CREDIT for seller
  await client.query(
    `INSERT INTO transactions (user_id, trade_id, type, amount)
     VALUES ($1, $2, 'CREDIT', $3)`,
    [sellOrder.user_id, trade.id, tradeAmount]
  );

  // 9. Update Orders remaining_quantity and status
  const updateOrderStatus = async (orderId, filledQty) => {
    const res = await client.query(
      `UPDATE orders
       SET remaining_quantity = remaining_quantity - $1,
           status = CASE WHEN remaining_quantity - $1 = 0 THEN 'FILLED'::order_status ELSE 'PARTIALLY_FILLED'::order_status END,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, remaining_quantity, status`,
      [filledQty, orderId]
    );
    return res.rows[0];
  };

  const updatedBuy = await updateOrderStatus(buyOrder.id, quantity);
  const updatedSell = await updateOrderStatus(sellOrder.id, quantity);

  // 10. Update stock current_price to the last executed trade price
  await client.query(
    `UPDATE stocks SET current_price = $1, updated_at = NOW() WHERE id = $2`,
    [price, stockId]
  );

  // Record in price_history
  await client.query(
    `INSERT INTO price_history (stock_id, price, recorded_at) VALUES ($1, $2, NOW())`,
    [stockId, price]
  );

  return {
    trade,
    buyOrder: updatedBuy,
    sellOrder: updatedSell,
  };
};

/**
 * Tries to match an order against pending counter-orders in the order book.
 * Applies Price-Time priority.
 */
const matchOrder = async (orderId) => {
  const client = await pool.connect();
  const executedTrades = [];

  try {
    // Loop to support multiple partial fills against multiple counter-orders
    while (true) {
      await client.query("BEGIN");

      // 1. Fetch current order state with lock
      const currentOrderRes = await client.query(
        `SELECT id, user_id, stock_id, side, order_type, quantity, remaining_quantity, price, status
         FROM orders
         WHERE id = $1
         FOR UPDATE`,
        [orderId]
      );

      if (currentOrderRes.rowCount === 0) {
        await client.query("ROLLBACK");
        break;
      }

      const order = currentOrderRes.rows[0];
      if (order.remaining_quantity <= 0 || order.status === "FILLED" || order.status === "CANCELLED") {
        await client.query("COMMIT");
        break;
      }

      // 2. Fetch stock current price
      const stockRes = await client.query("SELECT current_price FROM stocks WHERE id = $1", [order.stock_id]);
      const currentMarketPrice = Number(stockRes.rows[0].current_price);

      let counterOrder = null;

      if (order.side === "BUY") {
        // Looking for SELL orders: Lowest price first, earliest time first
        // If LIMIT buy, seller price must be <= buy limit price
        const counterQuery = `
          SELECT id, user_id, stock_id, side, order_type, quantity, remaining_quantity, price, status, created_at
          FROM orders
          WHERE stock_id = $1
            AND side = 'SELL'
            AND status IN ('PENDING', 'PARTIALLY_FILLED')
            AND user_id != $2
            ${order.order_type === "LIMIT" ? "AND (price <= $3 OR price IS NULL)" : ""}
          ORDER BY COALESCE(price, 0) ASC, created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED;
        `;

        const params = order.order_type === "LIMIT"
          ? [order.stock_id, order.user_id, order.price]
          : [order.stock_id, order.user_id];

        const counterRes = await client.query(counterQuery, params);
        if (counterRes.rowCount > 0) {
          counterOrder = counterRes.rows[0];
        }
      } else {
        // Looking for BUY orders: Highest price first, earliest time first
        // If LIMIT sell, buyer price must be >= sell limit price
        const counterQuery = `
          SELECT id, user_id, stock_id, side, order_type, quantity, remaining_quantity, price, status, created_at
          FROM orders
          WHERE stock_id = $1
            AND side = 'BUY'
            AND status IN ('PENDING', 'PARTIALLY_FILLED')
            AND user_id != $2
            ${order.order_type === "LIMIT" ? "AND (price >= $3 OR price IS NULL)" : ""}
          ORDER BY COALESCE(price, 9999999) DESC, created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED;
        `;

        const params = order.order_type === "LIMIT"
          ? [order.stock_id, order.user_id, order.price]
          : [order.stock_id, order.user_id];

        const counterRes = await client.query(counterQuery, params);
        if (counterRes.rowCount > 0) {
          counterOrder = counterRes.rows[0];
        }
      }

      // If no compatible counter-order found, we stop matching
      if (!counterOrder) {
        await client.query("COMMIT");
        break;
      }

      // 3. Determine trade quantity and execution price
      const matchQty = Math.min(order.remaining_quantity, counterOrder.remaining_quantity);
      // Execution price: Maker price priority (the order that was already resting in book),
      // or currentMarketPrice if both are market orders.
      const matchPrice = Number(counterOrder.price || order.price || currentMarketPrice);

      const buyOrder = order.side === "BUY" ? order : counterOrder;
      const sellOrder = order.side === "SELL" ? order : counterOrder;

      // 4. Atomically execute
      const result = await executeTrade(client, {
        buyOrder,
        sellOrder,
        quantity: matchQty,
        price: matchPrice,
        stockId: order.stock_id,
      });

      await client.query("COMMIT");
      executedTrades.push(result.trade);

      // --- Inter-Process Communication via Redis Pub/Sub ---
      // Publish event AFTER commit so WebSockets only stream durable changes
      try {
        await redis.publish(
          "paperbull:events",
          JSON.stringify({
            type: "trade_executed",
            payload: result.trade,
          })
        );
        await redis.publish(
          "paperbull:events",
          JSON.stringify({
            type: "order_updated",
            userId: buyOrder.user_id,
            payload: result.buyOrder,
          })
        );
        await redis.publish(
          "paperbull:events",
          JSON.stringify({
            type: "order_updated",
            userId: sellOrder.user_id,
            payload: result.sellOrder,
          })
        );
        await redis.publish(
          "paperbull:events",
          JSON.stringify({
            type: "price_updated",
            payload: { stockId: order.stock_id, price: matchPrice },
          })
        );
      } catch (pubErr) {
        console.error("Redis publish error:", pubErr.message);
      }
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Match/Execution error:", err.message);
  } finally {
    client.release();
  }

  return executedTrades;
};

export { executeTrade, matchOrder };
