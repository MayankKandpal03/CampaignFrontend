/**
 * Auth API service.
 * Provides a clear contract for all authentication-related calls.
 * LoginPage called api.post("/login") directly; this wraps it consistently.
 */
import api from "../api/axios.js";

/** POST /api/v1/login */
export const login = async ({ email, password }) => {
  const res = await api.post("/login", { email, password });
  return res.data; // { success, user }
};

/** POST /api/v1/logout */
export const logout = async () => {
  await api.post("/logout");
};

/** POST /api/v1/refresh-token */
export const refreshToken = async () => {
  const res = await api.post("/refresh-token");
  return res.data; // { success, accessToken }
};

/** POST /api/v1/change-password */
export const changePassword = async ({ oldPassword, newPassword }) => {
  const res = await api.post("/change-password", { oldPassword, newPassword });
  return res.data;
};
