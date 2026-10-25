// src/redis/orderQueue.js
// Redis Queue implementation for Order Processing (Producer-Consumer pattern).
//
// PRODUCER (API Server):
// Calls enqueueOrder(orderId) -> LPUSH paperbull:orders <orderId>
//
// CONSUMER (Workers):
// Calls dequeueOrder() -> BRPOP paperbull:orders 0 (blocking atomic pop)

import { redis } from "../config/redis.js";

export const ORDER_QUEUE_KEY = "paperbull:orders";

/**
 * Enqueue an order ID for asynchronous matching and execution.
 * @param {string} orderId - UUID of the order in PostgreSQL
 * @returns {Promise<number>} - New length of the queue
 */
export const enqueueOrder = async (orderId) => {
  return await redis.lpush(ORDER_QUEUE_KEY, orderId);
};

/**
 * Check current backlog size of the order queue.
 * @returns {Promise<number>}
 */
export const getQueueLength = async () => {
  return await redis.llen(ORDER_QUEUE_KEY);
};
