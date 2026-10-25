// src/workers/orderWorker.js
// Order Execution Worker (Consumer in OS Producer-Consumer Model).
//
// CONCURRENCY & OS CONCEPTS DEMONSTRATED:
// 1. Process / Thread model:
//    Multiple instances of this script can run concurrently on different terminal windows
//    or CPU cores (e.g. Worker-1, Worker-2).
// 2. Atomic Pop (Queue synchronization):
//    Redis BRPOP is atomic. Even with 10 workers, exactly one worker gets each order.
// 3. Blocking Wait:
//    Instead of burning CPU in a busy-wait loop (while(true)), the worker blocks until an order arrives.

import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

import { matchOrder } from "../matching-engine/matchingEngine.js";
import { ORDER_QUEUE_KEY } from "../redis/orderQueue.js";

const workerId = process.argv[2] || `Worker-${process.pid}`;

// Dedicated Redis client for this worker process
// WHY: BRPOP is a blocking command — it blocks the client connection until data arrives.
const workerRedis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
});

let isRunning = true;

const startWorker = async () => {
  console.log(`🚀 [${workerId}] Order Consumer started. Listening on '${ORDER_QUEUE_KEY}'...`);

  while (isRunning) {
    try {
      // BRPOP returns [queueName, value] or null if timeout
      // timeout = 0 means wait indefinitely until an item arrives
      const result = await workerRedis.brpop(ORDER_QUEUE_KEY, 0);

      if (!result) continue;

      const [_, orderId] = result;
      console.log(`\n⚡ [${workerId}] Dequeued order: ${orderId}`);

      const startTime = Date.now();
      const executedTrades = await matchOrder(orderId);
      const elapsedMs = Date.now() - startTime;

      if (executedTrades.length > 0) {
        console.log(
          `✅ [${workerId}] Executed ${executedTrades.length} trade(s) in ${elapsedMs}ms for order: ${orderId}`
        );
      } else {
        console.log(
          `⏳ [${workerId}] Order ${orderId} resting in order book (no matching counter-order found) [${elapsedMs}ms]`
        );
      }
    } catch (err) {
      if (!isRunning) break;
      console.error(`❌ [${workerId}] Error processing order:`, err.message);
      // Brief sleep before retrying to prevent rapid error loops
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`🛑 [${workerId}] Shut down gracefully.`);
  await workerRedis.quit();
  process.exit(0);
};

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log(`\n⚠️  [${workerId}] Stopping worker...`);
  isRunning = false;
});

process.on("SIGTERM", () => {
  isRunning = false;
});

startWorker();
