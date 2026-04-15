/**
 * useNotifStore — global notification state.
 *
 * FIX: Wrapped with Zustand `persist` middleware so notifications survive
 * page refresh. Previously used plain `create`, which reset state on reload.
 *
 * Notes:
 *  - Stores max 50 notifications to avoid unbounded localStorage growth.
 *  - `time` is stored as ISO string (not Date object) so it serialises cleanly.
 *  - `unread` count is also persisted so the bell badge is correct after reload.
 */
import { create }  from "zustand";
import { persist } from "zustand/middleware";

const useNotifStore = create(
  persist(
    (set) => ({
      // ── State ───────────────────────────────────────────────────────────────
      notifications: [],
      unread:        0,

      // ── Actions ─────────────────────────────────────────────────────────────
      addNotification: (message) =>
        set((state) => ({
          notifications: [
            {
              id:      Date.now(),
              message,
              read:    false,
              time:    new Date().toISOString(), // ISO string survives serialisation
            },
            ...state.notifications,
          ].slice(0, 50), // cap at 50 entries
          unread: state.unread + 1,
        })),

      markRead: () =>
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unread:        0,
        })),

      clearNotifs: () => set({ notifications: [], unread: 0 }),
    }),
    {
      name:       "campaign-notifications",
      partialize: state => ({
        notifications: state.notifications,
        unread:        state.unread,
      }),
    },
  ),
);

export default useNotifStore;