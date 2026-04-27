import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://campaignbackend-production.up.railway.app/api/v1";

// Create axios instance
// NOTE: withCredentials is intentionally NOT set globally.
// On mobile networks, carrier-level proxies often strip the
// Access-Control-Allow-Credentials response header, which causes
// browsers to reject cross-origin requests even when the server
// sends the correct CORS headers.
// Since we already persist the accessToken in localStorage and
// inject it as a Bearer header (below), cookies are only needed
// for the two endpoints that set/read httpOnly cookies:
//   • /logout          (clears the refreshToken cookie on the server)
//   • /refresh-token   (reads the refreshToken cookie to issue a new pair)
// All other routes authenticate via the Authorization: Bearer header.
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Cookie-dependent routes — only these need withCredentials
const COOKIE_ROUTES = ["/logout", "/refresh-token"];

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Primary: explicit "token" key set by LoginPage after a successful login.
    // Fallback: accessToken inside the persisted Zustand auth-storage entry
    // (handles page-refresh before any new login has run).
    let token = localStorage.getItem("token");

    if (!token) {
      try {
        const stored = localStorage.getItem("auth-storage");
        if (stored) {
          token = JSON.parse(stored)?.state?.accessToken ?? null;
        }
      } catch {
        // ignore parse errors — token stays null
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only send cookies for the two endpoints that require them.
    // This is what prevents CORS preflight failures on mobile networks.
    if (COOKIE_ROUTES.some((r) => config.url?.endsWith(r))) {
      config.withCredentials = true;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — log errors clearly for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error?.response?.status;
    const message = error?.response?.data?.message;

    console.error("[API Error]", {
      url:          error?.config?.url,
      method:       error?.config?.method,
      status,
      message,
      errorMessage: error.message,
      code:         error.code,
    });

    if (status === 401) console.error("Unauthorized — token may be expired");
    if (status === 403) console.error("Forbidden");
    if (status === 500) console.error("Server error");

    return Promise.reject(error);
  },
);

export default api;