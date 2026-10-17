// src/config/db.js
// PostgreSQL connection pool using the `pg` library.
//
// WHY a pool instead of a single connection?
// When multiple workers process orders simultaneously, each needs its own
// DB connection. A pool manages a set of pre-opened connections and hands
// them out efficiently — no overhead of opening a new TCP connection per query.
//
// Pool size matters for concurrency:
// Too small → workers queue up waiting for a free connection
// Too large  → PostgreSQL gets overwhelmed

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "paperbull",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
  max: 20, // max connections in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection on startup
pool.on("connect", () => {
  console.log("✅ PostgreSQL pool: new connection established");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err.message);
  process.exit(1);
});

export default pool;
