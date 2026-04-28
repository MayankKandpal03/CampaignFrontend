/**
 * useSocket — establishes Socket.io connection and registers event handlers.
 *
 * FIX — Cross-origin socket auth:
 * The backend socket middleware reads `socket.handshake.auth?.token` first,
 * then falls back to the cookie. The accessToken cookie is httpOnly — JS cannot
 * read it to pass it there. On mobile networks (and some desktop cross-origin
 * setups) the browser does not forward httpOnly cookies during a WebSocket
 * upgrade to a different origin.
 *
 * We read `accessToken` from the persisted auth store and pass it via
 * `auth: { token }` in the io() options. This is sent as part of the handshake
 * payload and is completely unaffected by cookie/SameSite restrictions.
 * The backend socket.js middleware already checks this path first — no backend
 * changes are needed.
 *
 * FIX — Mobile data CORS failure:
 * `withCredentials: true` on socket polling requests sends cookies and requires
 * the server to respond with `Access-Control-Allow-Credentials: true`. Mobile
 * carrier proxies often strip this response header, causing the browser to
 * reject the polling response as a CORS violation and break the connection.
 * Since auth is entirely via `auth: { token }`, cookies are not needed for
 * socket auth — removing `withCredentials` eliminates this failure path.
 *
 * Stale closure fix (already present, preserved):
 * Handlers are stored in a mutable ref so the socket always calls the latest
 * version without re-registering listeners on every render.
 */
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import useAuthStore from "../stores/useAuthStore.js";

export const useSocket = (eventHandlers = {}) => {
  const handlersRef = useRef(eventHandlers);
  const accessToken = useAuthStore(s => s.accessToken);

  // Keep ref current on every render (no deps — intentional).
  useEffect(() => {
    handlersRef.current = eventHandlers;
  });

  useEffect(() => {
    if (Object.keys(handlersRef.current).length === 0) return;

    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "https://campaignbackend-production.up.railway.app",
      {
        // NOTE: withCredentials intentionally removed.
        // Socket auth is via auth.token — cookies are not needed here.
        // withCredentials: true causes CORS failures on mobile carrier networks
        // because carrier proxies strip Access-Control-Allow-Credentials from
        // polling responses, making the browser reject them as CORS errors.
        // The backend socket middleware checks auth.token first, so this is safe.
        auth: { token: accessToken ?? "" },
        // Start with WebSocket directly to avoid a polling round-trip that
        // can sometimes drop auth context on cross-origin proxies.
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1500,
        reconnectionDelayMax: 10000,
      }
    );

    socket.on("connect", () =>
      console.log(`[Socket] Connected (${socket.id})`)
    );
    socket.on("connect_error", err =>
      console.error("[Socket] Connection error:", err.message)
    );
    socket.on("disconnect", reason =>
      console.warn("[Socket] Disconnected:", reason)
    );

    const wrappers = {};
    Object.keys(handlersRef.current).forEach(event => {
      wrappers[event] = data => handlersRef.current[event]?.(data);
      socket.on(event, wrappers[event]);
    });

    return () => {
      Object.entries(wrappers).forEach(([event, wrapper]) =>
        socket.off(event, wrapper)
      );
      socket.disconnect();
    };
  // Re-create the socket when the token changes (login / logout).
  }, [accessToken]);
};