// src/components/PriceChart.jsx
// Lightweight SVG Sparkline Chart for Stock Prices (Zero external charting library overhead).

import React from "react";

export const PriceChart = ({ data = [], color = "#10b981", height = 80, width = "100%" }) => {
  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-subtle)", fontSize: 12 }}>
        Waiting for price history...
      </div>
    );
  }

  const prices = data.map((d) => Number(d.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * 300;
      const y = height - ((p - min) / range) * (height - 15) - 5;
      return `${x},${y}`;
    })
    .join(" ");

  const fillPoints = `0,${height} ${points} 300,${height}`;

  return (
    <svg viewBox={`0 0 300 ${height}`} style={{ width, height, overflow: "visible" }}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      <polygon points={fillPoints} fill={`url(#grad-${color})`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};
