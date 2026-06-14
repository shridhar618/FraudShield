// src/api.js

async function request(method, path, body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(path, options);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  predict: (payload) => request("POST", "/predict", payload),
  getMetrics: () => request("GET", "/metrics"),
  getHistory: () => request("GET", "/history"),
  clearHistory: () => request("DELETE", "/history"),
  getOptions: () => request("GET", "/options"),
  getDemo: () => request("GET", "/demo"),
  getStats: () => request("GET", "/stats"),
  getHealth: () => request("GET", "/health"),
};