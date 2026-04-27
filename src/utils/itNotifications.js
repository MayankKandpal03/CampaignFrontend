// src/utils/itNotifications.js
// CHANGED: added registerPushSubscription() that wires up the Service Worker
// and sends the PushSubscription to the backend so the server can send
// system-level push notifications (visible even when app is closed).

import api from '../api/axios.js';

// ── Permission ────────────────────────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const hasNotificationPermission = () =>
  'Notification' in window && Notification.permission === 'granted';

export const getNotificationPermission = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

// ── Service Worker + Push Subscription ───────────────────────────────────────

/** Convert VAPID base64 public key to Uint8Array (required by subscribe()) */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
};

/**
 * Registers the service worker and subscribes to Web Push.
 * The subscription is sent to the backend so the server can trigger
 * OS-level notifications even when the browser tab is in the background
 * or the device is locked (on Android Chrome).
 *
 * Call this once — after the user grants notification permission.
 */
export const registerPushSubscription = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Not supported in this browser');
    return false;
  }

  try {
    // Register service worker (sw.js must be in /public root)
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Check for existing subscription first
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Get VAPID public key from backend
      const { data } = await api.get('/push/vapid-public-key');
      if (!data.key) throw new Error('No VAPID public key from server');

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,            // required by Chrome
        applicationServerKey: urlBase64ToUint8Array(data.key),
      });
    }

    // Send subscription to backend so server can push to this device
    await api.post('/push/subscribe', { subscription });
    console.log('[Push] Subscribed successfully');
    return true;
  } catch (err) {
    console.error('[Push] Subscription failed:', err.message);
    return false;
  }
};

/** Unsubscribe (call on logout) */
export const unregisterPushSubscription = async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await api.post('/push/unsubscribe').catch(() => {});
  } catch (err) {
    console.warn('[Push] Unsubscribe failed:', err.message);
  }
};

// ── Sound ─────────────────────────────────────────────────────────────────────
let _audioCtx = null;

const getAudioCtx = () => {
  if (_audioCtx && _audioCtx.state !== 'closed') return _audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  _audioCtx = new Ctx();
  return _audioCtx;
};

export const playNotificationSound = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    [
      { freq: 784,  start: 0,    dur: 0.18, vol: 0.28 },
      { freq: 988,  start: 0.16, dur: 0.18, vol: 0.28 },
      { freq: 1175, start: 0.32, dur: 0.32, vol: 0.32 },
    ].forEach(({ freq, start, dur, vol }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + start;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    });
  } catch (e) {
    console.warn('[ITNotif] Sound failed:', e.message);
  }
};

// ── Native (OS-level) Notification ───────────────────────────────────────────
export const showNativeNotification = (title, body, onClickCb) => {
  if (!hasNotificationPermission()) return false;
  try {
    const notif = new Notification(title, {
      body,
      icon:               '/favicon.ico',
      badge:              '/favicon.ico',
      requireInteraction: true,
      tag:                `it-${Date.now()}`,
      renotify:           true,
    });
    notif.onclick = () => {
      try { window.focus(); } catch (_) {}
      if (onClickCb) onClickCb();
    };
    return true;
  } catch (e) {
    console.warn('[ITNotif] Native notification failed:', e.message);
    return false;
  }
};

export const triggerAlert = (title, body, onClickCb) => {
  playNotificationSound();
  return showNativeNotification(title, body, onClickCb);
};