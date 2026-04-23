/**
 * useSocket — establishes Socket.io connection and registers event handlers.
 *
 * ROOT CAUSE FIX — Stale Closures:
 *
 * The previous implementation captured `eventHandlers` at mount time:
 *
 *   useEffect(() => {
 *     socket.on("campaign:created", handler); // `handler` is frozen at mount
 *   }, []);
 *
 * When React re-renders (e.g., `addNotification` reference changes after a
 * Zustand store update, or `setCampaigns` in PMDashboard changes), the socket
 * still calls the OLD, stale handler. This caused:
 *   - Notifications firing into discarded closure state → no bell update
 *   - setCampaigns calling a stale reference → no table update until refresh
 *   - "Created by" always showing "unknown" until refresh
 *
 * FIX — Ref-based delegation:
 *   1. Store `eventHandlers` in a mutable ref (updated every render, no deps)
 *   2. Register ONE stable wrapper per event at mount
 *   3. Each wrapper delegates to `ref.current[event]` at call time
 *   → The socket always calls the LATEST handler, never a stale one
 */
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export const useSocket = (eventHandlers = {}) => {
  // Mutable ref — always holds the latest handlers without triggering re-renders
  const handlersRef = useRef(eventHandlers);

  // Update ref synchronously on every render so it always points to the latest
  // handlers. No deps array — this runs every render intentionally.
  useEffect(() => {
    handlersRef.current = eventHandlers;
  });

  useEffect(() => {
    // Skip connecting if no handlers provided (enableSocket: false path)
    if (Object.keys(handlersRef.current).length === 0) return;

    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "https://campaignsatkartar.up.railway.app",
      { withCredentials: true }
    );

    // Stable wrapper functions: registered once at mount, but they delegate
    // to handlersRef.current at call time → always calls the latest handler.
    const wrappers = {};
    Object.keys(handlersRef.current).forEach(event => {
      wrappers[event] = (data) => {
        // handlersRef.current is always the latest version from the last render
        handlersRef.current[event]?.(data);
      };
      socket.on(event, wrappers[event]);
    });

    return () => {
      // Clean up all registered wrappers before disconnecting
      Object.entries(wrappers).forEach(([event, wrapper]) => {
        socket.off(event, wrapper);
      });
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps — intentional, see above
};