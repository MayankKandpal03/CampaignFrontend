/* public/sw.js — place this file in your React app's /public folder */
/* global clients */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

/* ── Receive push from server and show OS-level notification ── */
self.addEventListener('push', event => {
  const data = event.data?.json() || {
    title: '📋 IT Alert',
    body:  'You have a new campaign or task',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:              data.body,
      icon:              '/favicon.ico',
      badge:             '/favicon.ico',
      requireInteraction: true,   // stays on screen until user acts
      vibrate:           [200, 100, 200, 100, 200],
      tag:               'it-alert-' + Date.now(),
      renotify:          true,
      data:              { url: data.url || '/it-dashboard' },
    })
  );
});

/* ── Clicking the notification focuses or opens the IT tab ── */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('it-dashboard') && 'focus' in client)
          return client.focus();
      }
      return clients.openWindow('/it-dashboard');
    })
  );
});