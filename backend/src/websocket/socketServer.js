// src/websocket/socketServer.js
// Socket.IO Server integrated with Redis Pub/Sub for Real-Time Trading updates.
//
// WHY REDIS PUB/SUB + SOCKET.IO? (Distributed Systems & OS IPC)
// The worker processes and price engine run independently from the web server.
// They cannot directly touch Socket.IO client connections in memory.
// Instead:
// 1. Workers / Price Engine PUBLISH events to Redis channel "paperbull:events".
// 2. This Socket.IO server SUBSCRIBES to "paperbull:events".
// 3. Socket.IO pushes the event to browser clients via WebSockets.
// 4. Supports targeted rooms: socket.join(`user:${userId}`) for private order updates!

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { subscriber } from "../config/redis.js";

let io = null;

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Allows React Vite frontend (localhost:5173) to connect
      methods: ["GET", "POST"],
    },
  });

  // Optional JWT Authentication for Socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        // Automatically join a private user room for targeted notifications
        socket.join(`user:${decoded.userId}`);
      } catch (err) {
        // If token is invalid, allow connection as public guest (can view prices/market)
        console.warn("Socket connection with invalid token — connected as guest");
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.userId;
    console.log(`🔌 Socket connected: ${socket.id} ${userId ? `(User: ${userId})` : "(Guest)"}`);

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  // --- Redis Pub/Sub Bridge ---
  subscriber.subscribe("paperbull:events", (err) => {
    if (err) {
      console.error("❌ Failed to subscribe to Redis events channel:", err.message);
    } else {
      console.log("📡 Socket.IO server subscribed to Redis channel 'paperbull:events'");
    }
  });

  subscriber.on("message", (channel, message) => {
    if (channel !== "paperbull:events") return;

    try {
      const { type, payload, userId } = JSON.parse(message);

      // If targeted to a specific user, emit to their private room
      if (userId) {
        io.to(`user:${userId}`).emit(type, payload);
      } else {
        // Broadcast publicly to all connected traders (e.g. price_updated, trade_executed)
        io.emit(type, payload);
      }
    } catch (err) {
      console.error("Error broadcasting Redis pub/sub event:", err.message);
    }
  });

  return io;
};

export const getIO = () => io;
