# PaperBull 🐂

> A high-performance, concurrency-safe paper trading simulator demonstrating Operating Systems and Database Management concepts in a real-time financial market.

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-v7+-red.svg)](https://redis.io/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4-black.svg)](https://socket.io/)

---

## 📌 Overview

PaperBull simulates an active stock exchange where users receive virtual capital to place real-time BUY and SELL orders. The platform models real exchange mechanics (Price-Time Priority, Market vs. Limit orders, Order Books, Double-entry ledgers) while maintaining strict concurrency safety against race conditions and deadlocks.

---

## 🏛️ System Architecture

```
[ React + Vite UI ] ──(HTTP POST /orders)──► [ Express API Server (Producer) ]
       ▲                                                   │
       │ (WebSocket Push)                                  │ 1. INSERT 'PENDING'
       │                                                   ▼ 2. LPUSH orderId
[ Socket.IO Server ] ◄──(Redis Pub/Sub)─── [ Redis Queue (paperbull:orders) ]
                                                           │
                                                           │ BRPOP (Atomic Pop)
                                                           ▼
                                            [ Background Worker Pool (Consumers) ]
                                                           │
                                                           ▼
                                            [ Price-Time Matching Engine ]
                                                           │
                                                           │ BEGIN ... COMMIT
                                                           ▼
                                            [ PostgreSQL 15+ (Row-Level Locking) ]
```

---

## ⚙️ Core Technical Concepts

### 1. Operating Systems (OS)
* **Producer-Consumer Architecture**: The API server produces orders to an in-memory queue (`LPUSH`), and worker processes consume them asynchronously (`BRPOP`).
* **Non-busy Wait / Blocking Queue**: Workers use Redis `BRPOP 0` to sleep efficiently until jobs arrive, avoiding CPU-burning busy loops.
* **Critical Section & Race Condition Prevention**: Balance and holding mutations are serialized using database row locks (`SELECT ... FOR UPDATE`), preventing double-spending.
* **Deadlock Prevention**: Enforces a strict global alphabetical lock ordering on user UUIDs to eliminate circular-wait conditions.
* **Inter-Process Communication (IPC)**: Workers publish execution events to Redis Pub/Sub, bridging separate background processes with the Socket.IO server.

### 2. Database Management Systems (DBMS)
* **ACID Transactions**: Trade execution, financial debits/credits, holding updates, and order state transitions are wrapped in atomic transactions with automatic rollback on violation.
* **Row-Level Locking & Non-Blocking Queries**: Uses `FOR UPDATE SKIP LOCKED` during matching so parallel workers skip locked orders without blocking.
* **Double-Entry Financial Ledger**: Decouples `orders` (intentions) from `trades` (market executions) and `transactions` (account-level cash movements).
* **3NF Normalization**: Portfolios are calculated dynamically using relational SQL aggregates rather than storing redundant derived state.
* **Composite Indexing**: Optimized composite indexes on `(stock_id, side, status, price, created_at)` for sub-millisecond order book lookups.

---

## 🛠️ Tech Stack

* **Backend**: Node.js 24, Express 5, ES Modules
* **Database**: PostgreSQL 15+ (pg driver, connection pooling)
* **Cache & Message Broker**: Redis (ioredis, lists, pub/sub)
* **Real-Time Communication**: Socket.IO
* **Security & Validation**: bcrypt, jsonwebtoken (JWT), Joi
* **Frontend**: React 18, Vite, Lucide Icons

---

## 🚀 Getting Started

### Prerequisites
* Node.js v20+
* PostgreSQL 15+
* Redis v7+

### 1. Database Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE paperbull;"

# Execute schema
psql -U postgres -d paperbull -f backend/src/db/schema.sql
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env # Configure DB and Redis credentials
npm install
npm run dev
```

### 3. Worker & Bot Simulator
In separate terminal sessions:
```bash
# Start order execution worker
npm run worker

# Start simulated market bots
npm run bots
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to start trading.

---

## 📄 License
This project is licensed under the MIT License.
