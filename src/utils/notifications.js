// src/utils/notifications.js
// Unified for ITDashboard + PMDashboard
//
// HOW NOTIFICATIONS WORK (three states):
//
//  1. Tab OPEN + FOCUSED:
//     Socket fires → triggerAlert() → plays sound only (no OS notification).
//     For IT: the overlay card provides the visual in-app feedback.
//     For PM: the notification bell + sound provides in-app feedback.
//     sw.js detects a focused client → suppresses the SW push notification.
//     Result: sound only — no duplicate OS popup while the user is in the app.
//
//  2. Tab OPEN, NOT FOCUSED (e.g. user on another browser tab):
//     Socket fires → triggerAlert() → plays sound only.
//     sw.js detects NO focused client → shows OS notification.
//     Result: sound + 1 OS notification.
//
//  3. Tab CLOSED:
//     Socket is disconnected → triggerAlert() never called.
//     SW push fires → sw.js shows OS notification.
//     Result: 1 OS notification.
//
// FIX — removed showNativeNotification() from triggerAlert():
//   Previously triggerAlert called showNativeNotification() directly, which
//   produced an OS notification from the frontend. The service-worker push
//   ALSO produces an OS notification for the same event. This caused duplicates
//   in every scenario where the socket was connected (tab open).
//   Now triggerAlert only plays the sound; the SW exclusively owns OS
//   notifications. The focused-client check in sw.js ensures the SW suppresses
//   its notification when the user is actively looking at the app.

import api from "../api/axios.js";

// ── Permission ────────────────────────────────────────────────────────────────

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied")  return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

export const hasNotificationPermission = () =>
  "Notification" in window && Notification.permission === "granted";

export const getNotificationPermission = () => {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
};

// ── Service Worker + Push Subscription ───────────────────────────────────────

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

export const registerPushSubscription = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("[Push] Not supported");
    return false;
  }
  try {
    const keyRes = await api.get("/push/vapid-public-key");
    const vapidKey = keyRes.data?.key;
    if (!vapidKey) {
      console.warn("[Push] VAPID not configured on server");
      return false;
    }

    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    await api.post("/push/subscribe", { subscription });
    console.log("[Push] Subscribed successfully");
    return true;
  } catch (err) {
    console.error("[Push] Subscription failed:", err.message);
    return false;
  }
};

export const unregisterPushSubscription = async () => {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await api.post("/push/unsubscribe").catch(() => {});
  } catch (err) {
    console.warn("[Push] Unsubscribe failed:", err.message);
  }
};

// ── In-tab sound ─────────────────────────────────────────────────────────────

let _audioCtx = null;

const getAudioCtx = () => {
  if (_audioCtx && _audioCtx.state !== "closed") return _audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  _audioCtx = new Ctx();
  return _audioCtx;
};

export const playNotificationSound = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    [
      { freq: 784,  start: 0,    dur: 0.18, vol: 0.28 },
      { freq: 988,  start: 0.16, dur: 0.18, vol: 0.28 },
      { freq: 1175, start: 0.32, dur: 0.32, vol: 0.32 },
    ].forEach(({ freq, start, dur, vol }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + start;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    });
  } catch (e) {
    console.warn("[Notif] Sound failed:", e.message);
  }
};

// ── Native OS notification ────────────────────────────────────────────────────
// Kept as a standalone export for any code that explicitly needs a one-off
// OS notification, but it is NO LONGER called inside triggerAlert().
// The service worker exclusively manages OS notifications via Web Push.

export const showNativeNotification = (title, body, onClickCb) => {
  if (!hasNotificationPermission()) return false;
  try {
    const notif = new Notification(title, {
      body,
      icon:               "/favicon.ico",
      badge:              "/favicon.ico",
      requireInteraction: true,
      tag:                `portal-${Date.now()}`,
      renotify:           true,
    });
    notif.onclick = () => {
      try { window.focus(); } catch { /* ignore */ }
      if (onClickCb) onClickCb();
    };
    return true;
  } catch (e) {
    console.warn("[Notif] Native notification failed:", e.message);
    return false;
  }
};

// ── triggerAlert ─────────────────────────────────────────────────────────────
//
// Called by socket event handlers when the tab IS open.
//
// WHAT IT DOES NOW:
//   Plays the notification sound only. That's it.
//
// WHAT IT NO LONGER DOES:
//   It no longer calls showNativeNotification(). Previously this caused a
//   duplicate OS notification alongside the one produced by the SW push event.
//
// WHO HANDLES OS NOTIFICATIONS NOW:
//   Exclusively sw.js via Web Push. The focused-client check in sw.js
//   suppresses the OS notification when the user is actively in the app
//   (ensuring they're never double-notified), and shows it when they're away.
//
// WHO HANDLES VISUAL IN-APP FEEDBACK:
//   IT Dashboard  → pushOverlay() renders the full-screen overlay card.
//   PM Dashboard  → addNotification() updates the bell badge.

export const triggerAlert = (title, body, onClickCb) => {
  playNotificationSound();
  // OS notification is handled solely by the service worker push event.
  // Calling showNativeNotification here while the SW push is also firing
  // produces duplicate OS popups. The sw.js focused-client check ensures
  // the SW notification only fires when the user is away from the app.
  return true;
};