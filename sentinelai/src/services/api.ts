import axios from "axios";

// Must match the keys in authApi.ts — defined here to avoid circular imports
const TOKEN_KEY = 'sentinelai_token';
const USER_KEY = 'sentinelai_user';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Fallback based on host environment
  if (typeof window !== "undefined" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
    return "https://crimegpt-new.onrender.com";
  }
  return "http://127.0.0.1:8000";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 — clear stale token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Only redirect if not already on login page
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

