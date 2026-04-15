import { create }  from "zustand";
import { persist } from "zustand/middleware";
import api          from "../api/axios.js";

/**
 * useAuthStore — global authentication state.
 *
 * FIX: now stores `userId`, `teamId` (first team from the `teams` array),
 * and `managerId` returned by the updated login endpoint.
 *
 * This eliminates the need for PPC users to manually enter their Team ID
 * in the campaign creation form.
 */
const authStore = set => ({
  // ── State ────────────────────────────────────────────────────────────────────
  user:      null,   // username string
  userId:    null,   // MongoDB _id string
  role:      null,
  teamId:    null,   // first team from user.teams (used by PPC + Manager)
  managerId: null,   // user's manager _id (used by PPC)
  isAuth:    false,

  // ── Actions ──────────────────────────────────────────────────────────────────
  setUser: userData =>
    set({
      user:      userData.username,
      userId:    userData._id    ?? null,
      role:      userData.role   ?? null,
      // teams is an array of ObjectIds — take the first entry for quick access
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
      set({ user: null, userId: null, role: null, teamId: null, managerId: null, isAuth: false });
    }
  },

  clearAuth: () => {
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