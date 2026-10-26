// src/pages/Holdings.jsx
import React, { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { useSocket } from "../context/SocketContext.jsx";
import { ArrowUpRight, ArrowDownRight, Briefcase } from "lucide-react";

export const Holdings = ({ onSelectStock }) => {
  const { livePrices } = useSocket();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPortfolio = async () => {
    try {
      const data = await api.get("/portfolio");
      setPortfolio(data);
    } catch (err) {
      console.error("Holdings error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const holdings = portfolio?.holdings || [];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Your Holdings & Portfolio</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
          Stocks you currently own with live real-time P&L
        </p>
      </div>

      {/* Summary Banner */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        padding: 20,
        borderRadius: 12,
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        marginBottom: 24,
      }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase" }}>Invested Value</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
            ₹{Number(portfolio?.total_invested || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase" }}>Current Value</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
            ₹{Number(portfolio?.current_holding_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase" }}>Total Unrealized P&L</div>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            marginTop: 4,
            color: (portfolio?.unrealized_pnl || 0) >= 0 ? "var(--green)" : "var(--red)",
          }}>
            {(portfolio?.unrealized_pnl || 0) >= 0 ? "+" : ""}
            ₹{Number(portfolio?.unrealized_pnl || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            {" "}({portfolio?.unrealized_pnl_percent || 0}%)
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 100px",
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-subtle)",
          textTransform: "uppercase",
        }}>
          <span>Stock</span>
          <span style={{ textAlign: "right" }}>Shares Owned</span>
          <span style={{ textAlign: "right" }}>Avg Buy Price</span>
          <span style={{ textAlign: "right" }}>Current Price</span>
          <span style={{ textAlign: "right" }}>P&L (Unrealized)</span>
          <span style={{ textAlign: "right" }}>Action</span>
        </div>

        {holdings.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <Briefcase size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div>You don't own any stock holdings yet.</div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 4 }}>
              Visit the Market tab and place a BUY order to start building your portfolio!
            </div>
          </div>
        ) : (
          holdings.map((h) => {
            const livePrice = livePrices[h.stock_id]?.price || Number(h.current_price);
            const currentValue = Number((h.quantity * livePrice).toFixed(2));
            const investedValue = Number((h.quantity * Number(h.average_buy_price)).toFixed(2));
            const pnl = Number((currentValue - investedValue).toFixed(2));
            const pnlPercent = investedValue > 0 ? Number(((pnl / investedValue) * 100).toFixed(2)) : 0;
            const isProfit = pnl >= 0;

            return (
              <div
                key={h.stock_id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 100px",
                  padding: "16px 20px",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{h.symbol}</div>
                  <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>{h.company_name}</div>
                </div>

                <div style={{ textAlign: "right", fontWeight: 600 }}>{h.quantity}</div>

                <div style={{ textAlign: "right", color: "var(--text-muted)" }}>
                  ₹{Number(h.average_buy_price).toFixed(2)}
                </div>

                <div style={{ textAlign: "right", fontWeight: 600 }}>
                  ₹{Number(livePrice).toFixed(2)}
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: isProfit ? "var(--green)" : "var(--red)" }}>
                    {isProfit ? "+" : ""}₹{pnl.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, color: isProfit ? "var(--green)" : "var(--red)" }}>
                    {isProfit ? "+" : ""}{pnlPercent}%
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <button
                    onClick={() => onSelectStock({ id: h.stock_id, symbol: h.symbol, company_name: h.company_name, current_price: livePrice })}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: "var(--red-bg)",
                      color: "var(--red)",
                    }}
                  >
                    Sell
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
