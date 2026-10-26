// src/App.jsx
import React, { useState } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { Auth } from "./pages/Auth.jsx";
import { Navbar } from "./components/Navbar.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Market } from "./pages/Market.jsx";
import { Holdings } from "./pages/Holdings.jsx";
import { Orders } from "./pages/Orders.jsx";
import { OrderModal } from "./components/OrderModal.jsx";

export const App = () => {
  const { isAuthenticated, loading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedStock, setSelectedStock] = useState(null);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-dark)",
        color: "var(--text-muted)",
        fontSize: 16,
      }}>
        Initializing PaperBull...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-dark)" }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main>
        {activeTab === "dashboard" && (
          <Dashboard onSelectStock={setSelectedStock} setActiveTab={setActiveTab} />
        )}
        {activeTab === "market" && (
          <Market onSelectStock={setSelectedStock} />
        )}
        {activeTab === "holdings" && (
          <Holdings onSelectStock={setSelectedStock} />
        )}
        {activeTab === "orders" && (
          <Orders />
        )}
      </main>

      {/* Quick Trade / Order Placement Modal */}
      {selectedStock && (
        <OrderModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
          onOrderPlaced={refreshUser}
        />
      )}
    </div>
  );
};

export default App;
