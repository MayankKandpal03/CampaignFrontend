// src/utils/itNotifications.js
//
// USED BY: ITDashboard + PMDashboard
// Despite the "it" prefix on the file name this module handles push for
// both roles — the backend stores the role on subscribe so targeting is
// handled server-side.
//
// CHANGES:
//  - registerPushSubscription: wraps any error from /push/subscribe so a
//    network failure doesn't prevent the rest of the dashboard from loading.
//  - playNotificationSound: unchanged.
//  - All other exports: unchanged.

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

/** Convert a VAPID base64 public key string to a Uint8Array. */
const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

/**
 * Register sw.js and subscribe to Web Push.
 *
 * Call this once after the user grants notification permission.
 * Safe to call again — will reuse an existing subscription.
 *
 * The backend stores the subscription keyed to the current user + role,
 * so IT users get IT pushes and PMs get PM pushes automatically.
 *
 * @returns {Promise<boolean>} true on success, false on any failure
 */
export const registerPushSubscription = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("[Push] Service workers / PushManager not supported");
    return false;
  }

  try {
    // 1. Get VAPID public key from the backend
    const keyRes = await api.get("/push/vapid-public-key");
    const vapidKey = keyRes.data?.key;
    if (!vapidKey) {
      console.warn("[Push] VAPID public key not configured on server");
      return false;
    }

    // 2. Register the service worker (idempotent — safe to call multiple times)
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    // Wait until it's active before subscribing
    await navigator.serviceWorker.ready;

    // 3. Check for an existing subscription first to avoid unnecessary re-subscribes
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,   // required by Chrome / all browsers
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    // 4. Send the subscription to the backend (role is derived from JWT there)
    await api.post("/push/subscribe", { subscription });
    console.log("[Push] Subscribed successfully");
    return true;

  } catch (err) {
    // Don't crash the dashboard — push is a progressive enhancement
    console.error("[Push] Subscription failed:", err.message);
    return false;
  }
};

/**
 * Unsubscribe from Web Push (call on logout).
 * Cleans up both the browser subscription and the server record.
 */
export const unregisterPushSubscription = async () => {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    // Best-effort server cleanup — ignore network errors on logout
    await api.post("/push/unsubscribe").catch(() => {});
  } catch (err) {
    console.warn("[Push] Unsubscribe failed:", err.message);
  }
};

// ── In-tab sound ─────────────────────────────────────────────────────────────
// Plays a 3-note chime when a notification arrives while the tab is open.
// Complements the OS push which fires when the tab is closed/background.

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
    console.warn("[ITNotif] Sound failed:", e.message);
  }
};

// ── Native (OS-level) in-tab Notification ───────────────────────────────────
// Used when the tab IS open — shows a native browser notification.
// When the tab is closed the SW handles this automatically via Web Push.

export const showNativeNotification = (title, body, onClickCb) => {
  if (!hasNotificationPermission()) return false;
  try {
    const notif = new Notification(title, {
      body,
      icon:               "/favicon.ico",
      badge:              "/favicon.ico",
      requireInteraction: true,
      tag:                `it-${Date.now()}`,
      renotify:           true,
    });
    notif.onclick = () => {
      try { window.focus(); } catch { /* ignore */ }
      if (onClickCb) onClickCb();
    };
    return true;
  } catch (e) {
    console.warn("[ITNotif] Native notification failed:", e.message);
    return false;
  }
};

/**
 * Plays sound + shows an OS notification.
 * Use this for in-tab alerts. Background alerts come via Web Push (sw.js).
 */
export const triggerAlert = (title, body, onClickCb) => {
  playNotificationSound();
  return showNativeNotification(title, body, onClickCb);
};