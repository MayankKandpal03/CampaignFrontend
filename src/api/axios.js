import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://campaignbackend-production.up.railway.app/api/v1";

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // increased from 10000 — Railway free tier can be slow to wake
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor — attach token from localStorage (needed on mobile where cookies are blocked)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — log errors clearly for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    // Log full error for debugging — remove after fixing
    console.error("[API Error]", {
      url: error?.config?.url,
      method: error?.config?.method,
      status,
      message,
      errorMessage: error.message, // "Network Error", "timeout", etc.
      code: error.code,            // "ECONNABORTED" = timeout, "ERR_NETWORK" = CORS/offline
    });

    if (status === 401) console.error("Unauthorized — token may be expired");
    if (status === 403) console.error("Forbidden");
    if (status === 500) console.error("Server error");

    return Promise.reject(error);
  },
);

export default api;