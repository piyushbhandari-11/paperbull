// src/config/redis.js
// Redis client using ioredis.
//
// WHY ioredis over the official `redis` package?
// ioredis has better support for pub/sub with separate subscriber clients,
// built-in retry logic, and cleaner promise-based API.
//
// IMPORTANT: For Redis pub/sub, you CANNOT use the same connection for
// both publishing and subscribing. Once a client subscribes, it can only
// receive messages — it can't issue other commands.
// That's why we export two separate clients: one for commands (main),
// one dedicated to subscriptions (subscriber).

import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  retryStrategy: (times) => {
    // Retry up to 5 times with increasing delay
    if (times > 5) return null; // stop retrying
    return Math.min(times * 200, 2000);
  },
};

// Main client: used for LPUSH (producing to queue), GET, SET, PUBLISH
const redis = new Redis(redisConfig);

// Subscriber client: dedicated to SUBSCRIBE / PSUBSCRIBE
// WHY separate? Subscribing blocks the connection from running other commands.
const subscriber = new Redis(redisConfig);

redis.on("connect", () => console.log("✅ Redis: main client connected"));
redis.on("error", (err) => console.error("❌ Redis main error:", err.message));

subscriber.on("connect", () => console.log("✅ Redis: subscriber client connected"));
subscriber.on("error", (err) => console.error("❌ Redis subscriber error:", err.message));

export { redis, subscriber };
