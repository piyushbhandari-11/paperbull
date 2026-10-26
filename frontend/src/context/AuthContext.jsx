// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("paperbull_token"));
  const [loading, setLoading] = useState(true);

  // Fetch current user details on load if token exists
  const fetchUser = async () => {
    try {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const userData = await api.get("/users/me");
      setUser(userData);
    } catch (err) {
      console.warn("Session expired or invalid:", err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    localStorage.setItem("paperbull_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    await api.post("/auth/register", { name, email, password });
    return await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("paperbull_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
