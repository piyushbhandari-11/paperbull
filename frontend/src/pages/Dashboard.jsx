// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, Award } from "lucide-react";

export const Dashboard = ({ onSelectStock, setActiveTab }) => {
  const { user } = useAuth();
  const { livePrices, marketFeed } = useSocket();
  const [portfolio, setPortfolio] = useState(null);
  const [topStocks, setTopStocks] = useState([]);
  const [watchlist, setWatchlist] = useState([]);

  const loadData = async () => {
    try {
      const [portData, topData, watchData] = await Promise.all([
        api.get("/portfolio"),
        api.get("/stocks/top-traded?limit=4"),
        api.get("/watchlist"),
      ]);
      setPortfolio(portData);
      setTopStocks(topData);
      setWatchlist(watchData);
    } catch (err) {
      console.error("Dashboard load error:", err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const isProfitable = (portfolio?.unrealized_pnl || 0) >= 0;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px" }}>
      {/* Welcome Banner */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Hello, {user?.name || "Trader"} 👋</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
            Here is your live paper trading overview and market activity.
          </p>
        </div>
        <button
          onClick={() => setActiveTab("market")}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            backgroundColor: "var(--green)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          Explore Market <ArrowUpRight size={15} />
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 28 }}>
        {/* Total Portfolio Value */}
        <div style={{ padding: 20, borderRadius: 12, backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "var(--text-subtle)", textTransform: "uppercase", fontWeight: 600 }}>Total Portfolio</div>
          <div style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 4px" }}>
            ₹{Number(portfolio?.total_portfolio_value || user?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Cash + Current Stock Value</div>
        </div>

        {/* Unrealized P&L */}
        <div style={{ padding: 20, borderRadius: 12, backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "var(--text-subtle)", textTransform: "uppercase", fontWeight: 600 }}>Unrealized P&L</div>
          <div style={{
            fontSize: 24,
            fontWeight: 700,
            margin: "8px 0 4px",
            color: isProfitable ? "var(--green)" : "var(--red)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            {isProfitable ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
            ₹{Math.abs(portfolio?.unrealized_pnl || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: isProfitable ? "var(--green)" : "var(--red)" }}>
            {isProfitable ? "+" : ""}{portfolio?.unrealized_pnl_percent || 0}% overall return
          </div>
        </div>

        {/* Invested Capital */}
        <div style={{ padding: 20, borderRadius: 12, backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "var(--text-subtle)", textTransform: "uppercase", fontWeight: 600 }}>Invested Capital</div>
          <div style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 4px" }}>
            ₹{Number(portfolio?.total_invested || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Across {portfolio?.holdings_count || 0} stocks</div>
        </div>

        {/* Available Virtual Cash */}
        <div style={{ padding: 20, borderRadius: 12, backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "var(--text-subtle)", textTransform: "uppercase", fontWeight: 600 }}>Liquid Virtual Cash</div>
          <div style={{ fontSize: 24, fontWeight: 700, margin: "8px 0 4px", color: "var(--blue)" }}>
            ₹{Number(user?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Instant buying power</div>
        </div>
      </div>

      {/* Main Grid: Top Traded + Live Market Ticker */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        {/* Top Traded Stocks (DBMS Volume Aggregation) */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={18} color="var(--green)" />
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Top Traded Stocks</h2>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>By Executed Volume</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topStocks.map((stock) => {
              const livePrice = livePrices[stock.id]?.price || stock.current_price;
              const flash = livePrices[stock.id]?.flash;
              return (
                <div
                  key={stock.id}
                  onClick={() => onSelectStock(stock)}
                  className={flash ? `flash-${flash}` : ""}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: 8,
                    backgroundColor: "var(--bg-dark)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{stock.symbol}</div>
                    <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>
                      {stock.total_traded_volume} shares traded ({stock.total_trades_count} trades)
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      ₹{Number(livePrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectStock(stock); }}
                      style={{
                        marginTop: 4,
                        padding: "3px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: "var(--green-bg)",
                        color: "var(--green)",
                        borderRadius: 4,
                      }}
                    >
                      Trade
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Market Executions Stream (Socket.IO + Bots) */}
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={18} color="var(--blue)" />
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Live Trade Stream</h2>
            </div>
            <span style={{ fontSize: 11, color: "var(--green)", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--green)" }} />
              Streaming
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
            {marketFeed.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-subtle)", fontSize: 13 }}>
                Waiting for market trades (run <code>npm run bots</code> in terminal!)
              </div>
            ) : (
              marketFeed.map((trade, idx) => (
                <div
                  key={trade.id || idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: 6,
                    backgroundColor: "var(--bg-dark)",
                    fontSize: 12,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                      {trade.quantity} shares
                    </span>
                    <span style={{ color: "var(--text-subtle)", marginLeft: 6 }}>
                      {trade.executed_at ? new Date(trade.executed_at).toLocaleTimeString() : "Just now"}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--green)" }}>
                    @ ₹{Number(trade.price).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
