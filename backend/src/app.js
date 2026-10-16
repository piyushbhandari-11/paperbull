// src/app.js
// Creates and configures the Express application.
// WHY separate from server.js?
// app.js = the Express app (routes, middleware)
// server.js = the HTTP/WS server that actually listens on a port
// This makes testing easier — you can import app without starting a server.

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import { errorMiddleware } from "./middlewares/errorMiddleware.js";

// --- Route imports (add more as modules are built) ---
import authRoutes from "./modules/auth/auth.routes.js";
import stockRoutes from "./modules/stocks/stocks.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import holdingRoutes from "./modules/holdings/holdings.routes.js";
import orderRoutes from "./modules/orders/orders.routes.js";
import tradeRoutes from "./modules/trades/trades.routes.js";
import portfolioRoutes from "./modules/portfolio/portfolio.routes.js";
import watchlistRoutes from "./modules/watchlist/watchlist.routes.js";
import transactionRoutes from "./modules/transactions/transactions.routes.js";

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Health check ---
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "PaperBull API" });
});

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/users", userRoutes);
app.use("/api/holdings", holdingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/transactions", transactionRoutes);

// --- Central error handler (MUST be last) ---
app.use(errorMiddleware);

export default app;
