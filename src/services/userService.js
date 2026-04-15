/**
 * User API service.
 * Extracts user management calls that were inlined inside
 * ManagerDashboard and PMDashboard handlers.
 */
import api from "../api/axios.js";

/** POST /api/v1/user/create */
export const createUser = async (userData) => {
  const res = await api.post("/user/create", userData);
  return res.data;
};

/** POST /api/v1/user/delete */
export const deleteUser = async (id) => {
  const res = await api.post("/user/delete", { id });
  return res.data;
};

/**
 * GET /api/v1/user/list (best-effort — endpoint may not exist).
 * Returns null if the endpoint is absent so callers can fall back gracefully.
 */
export const fetchUsers = async () => {
  const res = await api.get("/user/list").catch(() => null);
  return res?.data?.data ?? null;
};
