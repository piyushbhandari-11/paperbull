// src/components/OrderModal.jsx
// Order Placement Modal (Buy/Sell interface).

import React, { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { X, AlertCircle } from "lucide-react";

export const OrderModal = ({ stock, onClose, onOrderPlaced }) => {
  const { user } = useAuth();
  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("MARKET");
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState(stock?.current_price || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [holdingQty, setHoldingQty] = useState(0);

  // Fetch current shares owned for this stock
  useEffect(() => {
    if (!stock) return;
    setLimitPrice(stock.current_price);
    api.get("/holdings").then((holdings) => {
      const current = holdings.find((h) => h.stock_id === stock.id);
      setHoldingQty(current ? current.quantity : 0);
    }).catch(() => {});
  }, [stock]);

  if (!stock) return null;

  const currentPrice = Number(stock.current_price);
  const executionPrice = orderType === "LIMIT" ? Number(limitPrice || 0) : currentPrice;
  const estimatedTotal = Number((quantity * executionPrice).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        symbol: stock.symbol,
        side,
        order_type: orderType,
        quantity: parseInt(quantity, 10),
      };

      if (orderType === "LIMIT") {
        payload.price = parseFloat(limitPrice);
      }

      const res = await api.post("/orders", payload);
      setSuccess(`Order placed successfully! (${res.status})`);
      if (onOrderPlaced) onOrderPlaced();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isBuy = side === "BUY";

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        width: "100%",
        maxWidth: 420,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{stock.symbol}</div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)" }}>{stock.company_name}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>
                ₹{Number(stock.current_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-subtle)" }}>Market Price</div>
            </div>
            <button onClick={onClose} style={{ background: "transparent", color: "var(--text-subtle)", padding: 4 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Side Selector Tabs (BUY / SELL) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={() => setSide("BUY")}
            style={{
              padding: "12px",
              fontWeight: 600,
              fontSize: 14,
              backgroundColor: isBuy ? "var(--green-bg)" : "transparent",
              color: isBuy ? "var(--green)" : "var(--text-subtle)",
              borderBottom: isBuy ? "2px solid var(--green)" : "none",
            }}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setSide("SELL")}
            style={{
              padding: "12px",
              fontWeight: 600,
              fontSize: 14,
              backgroundColor: !isBuy ? "var(--red-bg)" : "transparent",
              color: !isBuy ? "var(--red)" : "var(--text-subtle)",
              borderBottom: !isBuy ? "2px solid var(--red)" : "none",
            }}
          >
            SELL
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          {/* Order Type Toggle */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>
              Order Type
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {["MARKET", "LIMIT"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  style={{
                    padding: "8px",
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    backgroundColor: orderType === type ? "var(--bg-card-hover)" : "var(--bg-dark)",
                    border: `1px solid ${orderType === type ? "var(--blue)" : "var(--border)"}`,
                    color: orderType === type ? "var(--text-main)" : "var(--text-muted)",
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Input */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Quantity (Shares)</label>
              <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>
                {isBuy ? `Max budget: ₹${Number(user?.balance || 0).toLocaleString("en-IN")}` : `Owned: ${holdingQty} shares`}
              </span>
            </div>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                backgroundColor: "var(--bg-dark)",
                border: "1px solid var(--border)",
                color: "var(--text-main)",
                fontSize: 15,
                fontWeight: 600,
              }}
              required
            />
          </div>

          {/* Limit Price Input (only if LIMIT) */}
          {orderType === "LIMIT" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6, display: "block" }}>
                Limit Price (₹)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.05"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  backgroundColor: "var(--bg-dark)",
                  border: "1px solid var(--border)",
                  color: "var(--text-main)",
                  fontSize: 15,
                  fontWeight: 600,
                }}
                required
              />
            </div>
          )}

          {/* Cost Summary Box */}
          <div style={{
            padding: "12px 14px",
            borderRadius: 8,
            backgroundColor: "var(--bg-dark)",
            border: "1px solid var(--border)",
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Estimated Value</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: isBuy ? "var(--green)" : "var(--red)" }}>
              ₹{estimatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Error / Success Alerts */}
          {error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px",
              borderRadius: 6,
              backgroundColor: "var(--red-bg)",
              color: "var(--red)",
              fontSize: 13,
              marginBottom: 14,
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              padding: "10px",
              borderRadius: 6,
              backgroundColor: "var(--green-bg)",
              color: "var(--green)",
              fontSize: 13,
              marginBottom: 14,
              textAlign: "center",
              fontWeight: 500,
            }}>
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: isBuy ? "var(--green)" : "var(--red)",
              color: "#fff",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Placing Order..." : `${side} ${stock.symbol}`}
          </button>
        </form>
      </div>
    </div>
  );
};
