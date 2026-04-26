import { create }  from "zustand";
import { persist } from "zustand/middleware";
import api          from "../api/axios.js";

/**
 * useAuthStore — global authentication state.
 *
 * CHANGES:
 *  - Added `accessToken` field — persisted so useSocket can use it for the
 *    Socket.IO handshake auth option across page refreshes.
 *  - logout() and clearAuth() now also call localStorage.removeItem("token")
 *    so the axios interceptor doesn't keep sending a stale token after logout.
 */
const authStore = set => ({
  // ── State ────────────────────────────────────────────────────────────────────
  user:        null,
  userId:      null,
  role:        null,
  teamId:      null,
  managerId:   null,
  accessToken: null,  // stored for socket handshake auth only
  isAuth:      false,

  // ── Actions ──────────────────────────────────────────────────────────────────
  setUser: (userData, accessToken = null) =>
    set({
      user:        userData.username,
      userId:      userData._id    ?? null,
      role:        userData.role   ?? null,
      teamId:      userData.teams?.[0]?.toString() ?? null,
      managerId:   userData.managerId?.toString()  ?? null,
      accessToken,
      isAuth:      Boolean(userData),
    }),

  logout: async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear localStorage token so the axios interceptor stops sending it.
      localStorage.removeItem("token");
      set({
        user: null, userId: null, role: null,
        teamId: null, managerId: null, accessToken: null, isAuth: false,
      });
    }
  },

  clearAuth: () => {
    localStorage.removeItem("token");
    set({
      user: null, userId: null, role: null,
      teamId: null, managerId: null, accessToken: null, isAuth: false,
    });
  },
});

const useAuthStore = create(
  persist(authStore, {
    name: "auth-storage",
    partialize: state => ({
      user:        state.user,
      userId:      state.userId,
      role:        state.role,
      teamId:      state.teamId,
      managerId:   state.managerId,
      accessToken: state.accessToken, // persisted so socket auth survives page refresh
      isAuth:      state.isAuth,
    }),
  }),
);

export default useAuthStore;