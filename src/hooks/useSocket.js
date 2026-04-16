// src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * Establishes one Socket.io connection per component mount.
 *
 * FIX — stale closure:
 *   The original hook passed eventHandlers directly into a [] dep effect,
 *   meaning handler functions were captured once at mount. If a handler
 *   ever closed over stale component state it would silently use old values.
 *
 *   Solution: store the latest handlers in a ref. The socket listeners are
 *   registered ONCE (stable wrappers), but each invocation delegates to
 *   handlersRef.current which is updated on every render. This gives us:
 *     • No extra socket reconnections
 *     • Handlers always run with the latest closure values
 */

// All socket events the app emits — listed here once so every useSocket
// instance registers wrappers for them without needing to know in advance
// which subset a particular component cares about.
const ALL_CAMPAIGN_EVENTS = [
  "campaign:created",
  "campaign:updated",
  "campaign:deleted",
  "campaign:it_queued",
  "campaign:it_ack",
];

export const useSocket = (eventHandlers = {}) => {
  // Always holds the latest handlers without causing the effect to re-run
  const handlersRef = useRef(eventHandlers);
  useEffect(() => {
    handlersRef.current = eventHandlers;
    // No deps array → runs after every render, keeping ref in sync
  });

  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3000",
      { withCredentials: true }
    );

    // Stable wrappers registered once; they call the *current* handler each time
    const wrappers = {};
    ALL_CAMPAIGN_EVENTS.forEach((event) => {
      wrappers[event] = (...args) => handlersRef.current[event]?.(...args);
      socket.on(event, wrappers[event]);
    });

    return () => {
      ALL_CAMPAIGN_EVENTS.forEach((event) =>
        socket.off(event, wrappers[event])
      );
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};