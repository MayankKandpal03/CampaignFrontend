/**
 * useLogout — wraps the logout store action + navigate redirect.
 *
 * EXTRACTED FROM: PPCDashboard, ManagerDashboard, PMDashboard.
 * All three had an identical one-liner:
 *
 *   const handleLogout = useCallback(async () => {
 *     await logout();
 *     navigate("/login");
 *   }, [logout, navigate]);
 *
 * ITDashboard calls `logout` directly (no navigate) because the auth store
 * already clears state, relying on ProtectedRoute to redirect — that pattern
 * also works but is inconsistent. This hook standardises the approach.
 *
 * @returns {Function} handleLogout — stable async function, safe to pass as onClick
 *
 * @example
 *   const handleLogout = useLogout();
 *   <button onClick={handleLogout}>Sign Out</button>
 */
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore.js";

export const useLogout = () => {
  const logout   = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  return useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);
};
