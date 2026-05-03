// public/sw.js
// Service worker for push notifications.
// Place this file at: public/sw.js (Vite serves public/ at the root)

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Notification", body: event.data.text() };
  }

  const title = data.title || "Notification";
  const options = {
    body:               data.body              || "",
    icon:               data.icon              || "/favicon.ico",
    badge:              data.badge             || "/favicon.ico",
    tag:                data.tag               || `notif-${Date.now()}`,
    renotify:           true,
    requireInteraction: true,
    silent:             false,
    data: {
      url:  data.url  || "/",
      role: data.role || "",
    },
  };

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // If any tab for this origin is currently focused, suppress the OS
        // notification — the tab's own triggerAlert() already handled it.
        const hasFocusedClient = clients.some((c) => c.focused);
        if (hasFocusedClient) return Promise.resolve();

        return self.registration.showNotification(title, options);
      })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus an existing tab whose URL matches
        const match = clients.find(
          (c) => new URL(c.url).pathname === targetUrl && "focus" in c
        );
        if (match) return match.focus();

        // Focus any open tab for this app
        const anyTab = clients.find((c) => "focus" in c);
        if (anyTab) {
          anyTab.focus();
          return anyTab.navigate(targetUrl);
        }

        // No open tab — open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  // Re-subscribe automatically when the browser rotates the push subscription.
  // The frontend will re-call /push/subscribe on next load, so this is a
  // best-effort silent handler to avoid unhandled-event warnings in DevTools.
  event.waitUntil(Promise.resolve());
});