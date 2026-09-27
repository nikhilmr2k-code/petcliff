import axios from "axios";

// Backend base URL. In dev, defaults to the Spring Boot server on :8080.
// The backend mounts routes under /api, and the app calls e.g. api.get("/products").
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "pc_token_v1";

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
}

// Restore token on load
const existing = localStorage.getItem(TOKEN_KEY);
if (existing) api.defaults.headers.common.Authorization = `Bearer ${existing}`;

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Turn any axios/backend error into a readable string for toasts.
export function formatApiError(err) {
  if (!err) return "Something went wrong.";
  const data = err.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e.message || e).join(", ");
  }
  if (err.message) return err.message;
  return "Something went wrong.";
}

export default api;
