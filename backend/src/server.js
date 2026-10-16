// src/server.js
// Entry point. Starts HTTP Server, Socket.IO WebSockets, and Price Simulation Engine.

import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import pool from "./config/db.js";
import { redis } from "./config/redis.js";
import { initSocketServer } from "./websocket/socketServer.js";
import { startPriceEngine } from "./price-engine/priceEngine.js";

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

// Initialize Socket.IO with Redis Pub/Sub support
const io = initSocketServer(server);

// Verify DB & Redis connection before starting server
async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("✅ PostgreSQL connected");

    await redis.ping();
    console.log("✅ Redis connected");

    // Start background simulated price movements
    startPriceEngine(3000);

    server.listen(PORT, () => {
      console.log(`🚀 PaperBull backend running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO server listening for real-time clients`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  }
}

start();

export { server, io };
