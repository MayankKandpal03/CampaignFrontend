/* public/sw.js */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('push', event => {
  const data = event.data?.json() || {
    title: '📋 OPS Suite Alert',
    body:  'You have a new campaign or task',
    url:   '/',           // generic fallback — role-specific URL set by server
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:               data.body,
      icon:               '/favicon.ico',
      badge:              '/favicon.ico',
      requireInteraction: true,
      vibrate:            [200, 100, 200, 100, 200],
      tag:                data.tag || ('alert-' + Date.now()),
      renotify:           true,
      data:               { url: data.url || '/' },   // ← store url from payload
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';  // ← use stored url

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});