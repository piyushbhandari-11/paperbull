// src/pages/Orders.jsx
import React, { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { Clock, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

export const Orders = () => {
  const [subTab, setSubTab] = useState("orders"); // orders, trades, transactions
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [orderList, tradeList, txList] = await Promise.all([
        api.get("/orders"),
        api.get("/trades"),
        api.get("/transactions"),
      ]);
      setOrders(orderList);
      setTrades(tradeList);
      setTransactions(txList);
    } catch (err) {
      console.error("Orders load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCancel = async (orderId) => {
    try {
      await api.delete(`/orders/${orderId}`);
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px" }}>
      {/* Header & Sub-tab navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Orders & Activity</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Your intentions, executed trades, and financial transactions
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={loadAll}
            disabled={loading}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
            }}
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
          </button>

          <div style={{ display: "flex", backgroundColor: "var(--bg-card)", padding: 4, borderRadius: 8, border: "1px solid var(--border)" }}>
            <button
              onClick={() => setSubTab("orders")}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: subTab === "orders" ? "var(--bg-card-hover)" : "transparent",
                color: subTab === "orders" ? "var(--text-main)" : "var(--text-muted)",
              }}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setSubTab("trades")}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: subTab === "trades" ? "var(--bg-card-hover)" : "transparent",
                color: subTab === "trades" ? "var(--text-main)" : "var(--text-muted)",
              }}
            >
              Trades ({trades.length})
            </button>
            <button
              onClick={() => setSubTab("transactions")}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: subTab === "transactions" ? "var(--bg-card-hover)" : "transparent",
                color: subTab === "transactions" ? "var(--text-main)" : "var(--text-muted)",
              }}
            >
              Ledger ({transactions.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}>
        {/* SUBTAB 1: ORDERS */}
        {subTab === "orders" && (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 100px 100px 100px 120px 140px 100px",
              padding: "12px 20px",
              borderBottom: "1px solid var(--border)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-subtle)",
              textTransform: "uppercase",
            }}>
              <span>Instrument</span>
              <span>Side</span>
              <span>Type</span>
              <span style={{ textAlign: "right" }}>Quantity</span>
              <span style={{ textAlign: "right" }}>Order Price</span>
              <span style={{ textAlign: "center" }}>Status</span>
              <span style={{ textAlign: "right" }}>Action</span>
            </div>

            {orders.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                No orders placed yet.
              </div>
            ) : (
              orders.map((o) => (
                <div
                  key={o.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 100px 100px 100px 120px 140px 100px",
                    padding: "14px 20px",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{o.symbol}</div>
                    <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>
                      {new Date(o.created_at).toLocaleTimeString()}
                    </div>
                  </div>

                  <div>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: o.side === "BUY" ? "var(--green-bg)" : "var(--red-bg)",
                      color: o.side === "BUY" ? "var(--green)" : "var(--red)",
                    }}>
                      {o.side}
                    </span>
                  </div>

                  <div style={{ color: "var(--text-muted)" }}>{o.order_type}</div>

                  <div style={{ textAlign: "right", fontWeight: 600 }}>
                    {o.quantity - o.remaining_quantity} / {o.quantity}
                  </div>

                  <div style={{ textAlign: "right", color: "var(--text-muted)" }}>
                    {o.price ? `₹${Number(o.price).toFixed(2)}` : "MARKET"}
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor:
                        o.status === "FILLED"
                          ? "var(--green-bg)"
                          : o.status === "PENDING"
                          ? "var(--blue-bg)"
                          : "rgba(255,255,255,0.06)",
                      color:
                        o.status === "FILLED"
                          ? "var(--green)"
                          : o.status === "PENDING"
                          ? "var(--blue)"
                          : "var(--text-subtle)",
                    }}>
                      {o.status === "FILLED" && <CheckCircle2 size={12} />}
                      {o.status === "PENDING" && <Clock size={12} />}
                      {o.status === "CANCELLED" && <XCircle size={12} />}
                      {o.status}
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    {o.status === "PENDING" && (
                      <button
                        onClick={() => handleCancel(o.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontSize: 11,
                          backgroundColor: "var(--red-bg)",
                          color: "var(--red)",
                          fontWeight: 600,
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUBTAB 2: TRADES (Actual executions) */}
        {subTab === "trades" && (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 100px 120px 120px 140px 160px",
              padding: "12px 20px",
              borderBottom: "1px solid var(--border)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-subtle)",
              textTransform: "uppercase",
            }}>
              <span>Instrument</span>
              <span>Side</span>
              <span style={{ textAlign: "right" }}>Shares</span>
              <span style={{ textAlign: "right" }}>Exec Price</span>
              <span style={{ textAlign: "right" }}>Total Value</span>
              <span style={{ textAlign: "right" }}>Executed At</span>
            </div>

            {trades.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                No executed trades yet.
              </div>
            ) : (
              trades.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 100px 120px 120px 140px 160px",
                    padding: "14px 20px",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.symbol}</div>
                    <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>{t.company_name}</div>
                  </div>

                  <div>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: t.side === "BUY" ? "var(--green-bg)" : "var(--red-bg)",
                      color: t.side === "BUY" ? "var(--green)" : "var(--red)",
                    }}>
                      {t.side}
                    </span>
                  </div>

                  <div style={{ textAlign: "right", fontWeight: 600 }}>{t.quantity}</div>

                  <div style={{ textAlign: "right", fontWeight: 600 }}>₹{Number(t.price).toFixed(2)}</div>

                  <div style={{ textAlign: "right", fontWeight: 700 }}>
                    ₹{Number(t.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>

                  <div style={{ textAlign: "right", color: "var(--text-subtle)", fontSize: 12 }}>
                    {new Date(t.executed_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUBTAB 3: TRANSACTIONS (Financial Ledger) */}
        {subTab === "transactions" && (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 120px 150px 1fr 180px",
              padding: "12px 20px",
              borderBottom: "1px solid var(--border)",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-subtle)",
              textTransform: "uppercase",
            }}>
              <span>Stock</span>
              <span>Ledger Type</span>
              <span style={{ textAlign: "right" }}>Amount</span>
              <span style={{ textAlign: "right" }}>Executed Shares</span>
              <span style={{ textAlign: "right" }}>Timestamp</span>
            </div>

            {transactions.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                No wallet transactions yet.
              </div>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 120px 150px 1fr 180px",
                    padding: "14px 20px",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{tx.symbol}</div>

                  <div>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: tx.type === "CREDIT" ? "var(--green-bg)" : "var(--red-bg)",
                      color: tx.type === "CREDIT" ? "var(--green)" : "var(--red)",
                    }}>
                      {tx.type}
                    </span>
                  </div>

                  <div style={{
                    textAlign: "right",
                    fontWeight: 700,
                    color: tx.type === "CREDIT" ? "var(--green)" : "var(--red)",
                  }}>
                    {tx.type === "CREDIT" ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>

                  <div style={{ textAlign: "right", color: "var(--text-muted)" }}>
                    {tx.trade_quantity} @ ₹{Number(tx.trade_price).toFixed(2)}
                  </div>

                  <div style={{ textAlign: "right", color: "var(--text-subtle)", fontSize: 12 }}>
                    {new Date(tx.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
