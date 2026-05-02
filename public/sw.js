// public/sw.js
//
// DUPLICATE PREVENTION:
//   When the tab is open and focused, the socket event fires triggerAlert
//   which shows a native OS notification directly.
//   This SW push handler checks if any client is focused — if yes, it skips
//   showing the push notification to avoid showing two OS alerts.
//
//   Tab FOCUSED  → skip push notification (triggerAlert handles it)
//   Tab VISIBLE but not focused → show push notification
//   Tab HIDDEN / CLOSED         → show push notification

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If any tab is focused, triggerAlert (socket path) handles the OS notification
        const anyFocused = clientList.some((c) => c.focused);
        if (anyFocused) return; // skip — no duplicate

        return self.registration.showNotification(data.title || "New Notification", {
          body:               data.body  || "",
          icon:               "/favicon.ico",
          badge:              "/favicon.ico",
          tag:                data.tag   || "portal-default",
          renotify:           true,
          requireInteraction: true,
          data:               { url: data.url || "/" },
        });
      })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing tab if it matches the target URL
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open a new tab
        return clients.openWindow(url);
      })
  );
});

// Keep SW alive / updated immediately
self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));