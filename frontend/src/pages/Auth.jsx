// src/pages/Auth.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { TrendingUp, ShieldCheck, Zap } from "lucide-react";

export const Auth = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("piyush@test.com");
  const [password, setPassword] = useState("test1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      backgroundColor: "var(--bg-dark)",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "32px 28px",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🐂</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.5px" }}>
            Paper<span style={{ color: "var(--green)" }}>Bull</span>
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Concurrency-Safe Real-Time Paper Trading
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          backgroundColor: "var(--bg-dark)",
          padding: 4,
          borderRadius: 8,
          marginBottom: 24,
        }}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(""); }}
            style={{
              padding: "8px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: isLogin ? "var(--bg-card)" : "transparent",
              color: isLogin ? "var(--text-main)" : "var(--text-muted)",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(""); }}
            style={{
              padding: "8px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              backgroundColor: !isLogin ? "var(--bg-card)" : "transparent",
              color: !isLogin ? "var(--text-main)" : "var(--text-muted)",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: "10px 14px",
            borderRadius: 6,
            backgroundColor: "var(--red-bg)",
            color: "var(--red)",
            fontSize: 13,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Piyush Bhandari"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  backgroundColor: "var(--bg-dark)",
                  border: "1px solid var(--border)",
                  color: "var(--text-main)",
                  fontSize: 14,
                }}
                required={!isLogin}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                backgroundColor: "var(--bg-dark)",
                border: "1px solid var(--border)",
                color: "var(--text-main)",
                fontSize: 14,
              }}
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                backgroundColor: "var(--bg-dark)",
                border: "1px solid var(--border)",
                color: "var(--text-main)",
                fontSize: 14,
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: "var(--green)",
              color: "#fff",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In & Trade" : "Claim ₹1,00,000 & Register"}
          </button>
        </form>

        {/* Feature Badges */}
        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-around",
          fontSize: 11,
          color: "var(--text-subtle)",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={13} color="var(--green)" /> Zero Risk
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <ShieldCheck size={13} color="var(--blue)" /> ACID Transactions
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <TrendingUp size={13} color="var(--green)" /> Live Order Book
          </span>
        </div>
      </div>
    </div>
  );
};
