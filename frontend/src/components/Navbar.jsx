// src/components/Navbar.jsx
import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { TrendingUp, Wallet, User, LogOut, Activity } from "lucide-react";

export const Navbar = ({ activeTab, setActiveTab, onOpenTrade }) => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "market", label: "Market" },
    { id: "holdings", label: "Holdings & Portfolio" },
    { id: "orders", label: "Orders & Trades" },
  ];

  return (
    <header style={{
      borderBottom: "1px solid var(--border)",
      backgroundColor: "var(--bg-card)",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 20px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div
            onClick={() => setActiveTab("dashboard")}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          >
            <span style={{ fontSize: 24 }}>🐂</span>
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Paper<span style={{ color: "var(--green)" }}>Bull</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: "flex", gap: 6 }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor: activeTab === item.id ? "var(--bg-card-hover)" : "transparent",
                  color: activeTab === item.id ? "var(--text-main)" : "var(--text-muted)",
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Section: Live Status, Cash Balance, Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* WebSocket Status */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: 12,
            backgroundColor: connected ? "var(--green-bg)" : "var(--red-bg)",
            color: connected ? "var(--green)" : "var(--red)",
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: connected ? "var(--green)" : "var(--red)",
            }} />
            {connected ? "LIVE" : "DISCONNECTED"}
          </div>

          {/* Wallet Balance */}
          {user && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: "var(--bg-dark)",
              border: "1px solid var(--border)",
            }}>
              <Wallet size={16} color="var(--green)" />
              <div>
                <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase" }}>Virtual Cash</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  ₹{Number(user.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )}

          {/* User / Logout */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "var(--text-muted)",
              }}>
                <User size={15} />
                <span>{user.name}</span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                style={{
                  padding: "6px",
                  borderRadius: 6,
                  backgroundColor: "transparent",
                  color: "var(--text-subtle)",
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
