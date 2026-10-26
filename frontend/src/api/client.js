// src/api/client.js
// Standard HTTP fetch client with automated JWT Authorization headers.

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("paperbull_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = json.message || "An unexpected error occurred";
    throw new Error(errorMsg);
  }

  return json.data;
};

export const api = {
  get: (url) => request(url, { method: "GET" }),
  post: (url, body) => request(url, { method: "POST", body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: "DELETE" }),
};
