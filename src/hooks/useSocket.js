import { useEffect } from "react";
import { io } from "socket.io-client";

/**
 * Establishes a Socket.io connection and registers event handlers.
 * Previously copy-pasted with slight variations in PPCDashboard and ManagerDashboard.
 * PMDashboard had the socket code commented out — this hook makes it trivial to enable.
 *
 * @param {Record<string, Function>} eventHandlers
 *   Map of socket event names to handler functions.
 *   e.g. { "campaign:created": (c) => ..., "campaign:updated": (c) => ... }
 *
 * @example
 *  useSocket({
 *    "campaign:created": (c) => {
 *      useCampaignStore.setState(s => ({ campaigns: [c, ...s.campaigns] }));
 *      addNotification("New campaign created");
 *    },
 *  });
 */
export const useSocket = (eventHandlers = {}) => {
  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:3000",
      { withCredentials: true }
    );

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => socket.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};
