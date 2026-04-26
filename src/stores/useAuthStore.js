import { create }  from "zustand";
import { persist } from "zustand/middleware";
import api          from "../api/axios.js";

const authStore = set => ({
  // ── State ────────────────────────────────────────────────────────────────────
  user:      null,
  userId:    null,
  role:      null,
  teamId:    null,
  managerId: null,
  isAuth:    false,

  // ── Actions ──────────────────────────────────────────────────────────────────
  setUser: userData =>
    set({
      user:      userData.username,
      userId:    userData._id    ?? null,
      role:      userData.role   ?? null,
      teamId:    userData.teams?.[0]?.toString() ?? null,
      managerId: userData.managerId?.toString()  ?? null,
      isAuth:    Boolean(userData),
    }),

  logout: async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token"); // ← clear token for mobile
      set({ user: null, userId: null, role: null, teamId: null, managerId: null, isAuth: false });
    }
  },

  clearAuth: () => {
    localStorage.removeItem("token"); // ← clear token for mobile
    set({ user: null, userId: null, role: null, teamId: null, managerId: null, isAuth: false });
  },
});

const useAuthStore = create(
  persist(authStore, {
    name: "auth-storage",
    partialize: state => ({
      user:      state.user,
      userId:    state.userId,
      role:      state.role,
      teamId:    state.teamId,
      managerId: state.managerId,
      isAuth:    state.isAuth,
    }),
  }),
);

export default useAuthStore;