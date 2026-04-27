// src/api/axios.js
// FIX: Added "/login" to COOKIE_ROUTES so mobile browsers (iOS Safari, Chrome)
// properly handle the Set-Cookie response headers during login.
// Without withCredentials:true, mobile browsers silently drop the cookies.

import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://campaignbackend-production.up.railway.app/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// FIX: Added "/login" so the server's Set-Cookie headers are processed on mobile
const COOKIE_ROUTES = ['/login', '/logout', '/refresh-token'];

api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token');

    if (!token) {
      try {
        const stored = localStorage.getItem('auth-storage');
        if (stored) token = JSON.parse(stored)?.state?.accessToken ?? null;
      } catch {
        // ignore
      }
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (COOKIE_ROUTES.some(r => config.url?.endsWith(r))) {
      config.withCredentials = true;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error?.response?.status;
    const message = error?.response?.data?.message;
    console.error('[API Error]', { url: error?.config?.url, status, message });
    if (status === 401) console.error('Unauthorized — token may be expired');
    if (status === 403) console.error('Forbidden');
    if (status === 500) console.error('Server error');
    return Promise.reject(error);
  },
);

export default api;