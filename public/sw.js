/**
 * sw.js — Service Worker for Web Push Notifications
 *
 * MUST be placed at /public/sw.js (project root of the static folder).
 * Express serves it via express.static("public"), so the browser can
 * register it at scope "/", which covers all pages.
 *
 * FIX: Added focused-client check in the push handler.
 * When the user has the app tab open and focused, the socket connection is
 * active and triggerAlert() already plays a sound + shows the in-app overlay.
 * Showing an OS notification ON TOP of that is redundant and confusing.
 * We suppress the SW push notification when any app tab is focused, and only
 * show it when the user is away (tab hidden / browser minimised / closed).
 *
 * FIX: Removed hardcoded vercel URL from notificationclick handler.
 * APP_ORIGIN already captures the correct origin dynamically via
 * self.location.origin, making the extra hardcoded string unnecessary and
 * potentially wrong across deployments.
 */

const APP_ORIGIN = self.location.origin;

// ── Push event ────────────────────────────────────────────────────────────────
// Fired by the browser when the server sends a Web Push message via web-push.
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "OPS Suite", body: event.data.text() };
  }

  const { title = "OPS Suite", body = "", url = "/", tag, role } = data;

  const icon  = "/favicon.ico";
  const badge = "/favicon.ico";

  const options = {
    body,
    icon,
    badge,
    // tag groups notifications — same tag replaces the previous one
    tag: tag || `ops-${role || "general"}-${Date.now()}`,
    renotify: true,           // vibrate/sound even if tag already exists
    requireInteraction: true, // notification stays until user acts (Android)
    silent: false,
    data: { url },
  };

  event.waitUntil(
    // Check whether the user already has an app tab focused.
    // If they do, the socket event fires triggerAlert() which handles
    // in-app feedback (sound + overlay card for IT, bell for PM).
    // Showing an OS notification on top would be a duplicate — suppress it.
    // If no tab is focused (background / closed), show the OS notification.
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        const hasFocusedClient = windowClients.some((c) => c.focused);
        if (hasFocusedClient) {
          // Tab is open and in focus — in-app notifications handle feedback.
          // Do nothing here.
          return;
        }
        // No focused tab — user is away, show the OS notification.
        return self.registration.showNotification(title, options);
      })
  );
});

// ── Notification click ────────────────────────────────────────────────────────
// Fired when the user taps the notification.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus an existing window if one is already open for this app.
        // APP_ORIGIN is set dynamically from self.location.origin so it
        // always matches the correct deployment without hardcoded URLs.
        for (const client of windowClients) {
          if (client.url.startsWith(APP_ORIGIN) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Otherwise open a new window.
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// ── Notification close ────────────────────────────────────────────────────────
// Optional: fires when user explicitly dismisses the notification.
self.addEventListener("notificationclose", () => {
  // Can log analytics here if needed.
});

// ── Activate ──────────────────────────────────────────────────────────────────
// Take control of all pages immediately (no waiting for reload).
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});