// src/pages/Market.jsx
import React, { useState, useEffect } from "react";
import { api } from "../api/client.js";
import { useSocket } from "../context/SocketContext.jsx";
import { PriceChart } from "../components/PriceChart.jsx";
import { Star, Search, TrendingUp, TrendingDown } from "lucide-react";

export const Market = ({ onSelectStock }) => {
  const { livePrices } = useSocket();
  const [stocks, setStocks] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL, WATCHLIST

  const fetchStocks = async () => {
    try {
      const [allStocks, userWatchlist] = await Promise.all([
        api.get("/stocks"),
        api.get("/watchlist").catch(() => []),
      ]);
      setStocks(allStocks);
      setWatchlistIds(new Set(userWatchlist.map((w) => w.stock_id)));
    } catch (err) {
      console.error("Error loading market data:", err.message);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const toggleWatchlist = async (stock, e) => {
    e.stopPropagation();
    try {
      if (watchlistIds.has(stock.id)) {
        await api.delete(`/watchlist/${stock.id}`);
        setWatchlistIds((prev) => {
          const next = new Set(prev);
          next.delete(stock.id);
          return next;
        });
      } else {
        await api.post("/watchlist", { symbol: stock.symbol });
        setWatchlistIds((prev) => new Set([...prev, stock.id]));
      }
    } catch (err) {
      console.error("Watchlist error:", err.message);
    }
  };

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
      stock.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || (filter === "WATCHLIST" && watchlistIds.has(stock.id));
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px" }}>
      {/* Search & Filter Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Market Overview</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Simulated live prices ticking via WebSockets
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Watchlist Filter Buttons */}
          <div style={{ display: "flex", backgroundColor: "var(--bg-card)", padding: 4, borderRadius: 8, border: "1px solid var(--border)" }}>
            <button
              onClick={() => setFilter("ALL")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: filter === "ALL" ? "var(--bg-card-hover)" : "transparent",
                color: filter === "ALL" ? "var(--text-main)" : "var(--text-muted)",
              }}
            >
              All Stocks
            </button>
            <button
              onClick={() => setFilter("WATCHLIST")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: filter === "WATCHLIST" ? "var(--bg-card-hover)" : "transparent",
                color: filter === "WATCHLIST" ? "var(--text-main)" : "var(--text-muted)",
              }}
            >
              Watchlist ({watchlistIds.size})
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search TCS, INFY..."
              style={{
                padding: "8px 14px 8px 34px",
                borderRadius: 8,
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-main)",
                fontSize: 13,
                width: 200,
              }}
            />
          </div>
        </div>
      </div>

      {/* Stocks Table */}
      <div style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "40px 1.8fr 1.2fr 1fr 140px",
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--text-subtle)",
          textTransform: "uppercase",
        }}>
          <span></span>
          <span>Instrument</span>
          <span style={{ textAlign: "right" }}>Current Price</span>
          <span style={{ textAlign: "right" }}>24h / Live Tick</span>
          <span style={{ textAlign: "right" }}>Action</span>
        </div>

        <div>
          {filteredStocks.map((stock) => {
            const live = livePrices[stock.id];
            const currentPrice = live?.price || Number(stock.current_price);
            const changePercent = live?.changePercent || 0;
            const flash = live?.flash;
            const isWatched = watchlistIds.has(stock.id);

            return (
              <div
                key={stock.id}
                onClick={() => onSelectStock(stock)}
                className={flash ? `flash-${flash}` : ""}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1.8fr 1.2fr 1fr 140px",
                  padding: "16px 20px",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                {/* Watchlist Star */}
                <button
                  type="button"
                  onClick={(e) => toggleWatchlist(stock, e)}
                  style={{ background: "transparent", color: isWatched ? "#eab308" : "var(--text-subtle)", padding: 4 }}
                >
                  <Star size={16} fill={isWatched ? "#eab308" : "none"} />
                </button>

                {/* Symbol & Name */}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{stock.symbol}</div>
                  <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 2 }}>
                    {stock.company_name}
                  </div>
                </div>

                {/* Live Price */}
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    ₹{Number(currentPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {/* Percentage Change indicator */}
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: changePercent >= 0 ? "var(--green-bg)" : "var(--red-bg)",
                    color: changePercent >= 0 ? "var(--green)" : "var(--red)",
                  }}>
                    {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
                  </span>
                </div>

                {/* Quick Trade Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelectStock(stock); }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: "var(--green)",
                      color: "#fff",
                    }}
                  >
                    Buy / Sell
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
