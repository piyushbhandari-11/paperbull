// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext.jsx";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, refreshUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [livePrices, setLivePrices] = useState({}); // { [stockId]: { price, changePercent, flash: 'up'|'down' } }
  const [marketFeed, setMarketFeed] = useState([]); // Last 15 executed trades
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Connect to WebSocket via Socket.IO
    const newSocket = io("/", {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("⚡ Socket.IO connected:", newSocket.id);
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    // 1. Live Price Updates (broadcasted by price engine & trades)
    newSocket.on("price_updated", (data) => {
      setLivePrices((prev) => {
        const old = prev[data.stockId]?.price || data.oldPrice || data.price;
        const flash = data.price > old ? "up" : data.price < old ? "down" : null;
        return {
          ...prev,
          [data.stockId]: {
            ...data,
            flash,
          },
        };
      });
    });

    // 2. Market Trades Stream (Ticker / Activity feed)
    newSocket.on("trade_executed", (trade) => {
      setMarketFeed((prev) => [trade, ...prev.slice(0, 14)]);
    });

    // 3. Private Targeted Order Updates (when your order is filled)
    newSocket.on("order_updated", (order) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          text: `Order ${order.status}! (${order.remaining_quantity === 0 ? "Fully filled" : `${order.remaining_quantity} shares remaining`})`,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 4),
      ]);
      // Refresh user balance & holdings
      refreshUser();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        livePrices,
        marketFeed,
        notifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
