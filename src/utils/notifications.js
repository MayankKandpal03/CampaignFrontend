// src/utils/notifications.js
// Single notification utility used by both PMDashboard and ITDashboard.
//
// PUSH FLOW:
//  Tab OPEN   → socket fires → triggerAlert() → sound + native OS notification
//              (SW push also fires but sw.js checks for a focused client and
//               suppresses its notification to avoid duplicates)
//  Tab HIDDEN → socket fires → triggerAlert() → sound + native OS notification
//  Tab CLOSED → socket disconnected → SW push fires → OS notification only
//
// NOTE: The focused-client check in sw.js is what prevents double OS popups
// when the user is actively looking at the app.

import api from "../api/axios.js";

// ── Permission helpers ────────────────────────────────────────────────────────

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

/**
 * Register sw.js and subscribe to Web Push.
 * Safe to call on every mount — reuses an existing browser subscription.
 * The backend stores subscription keyed to user + role, so IT gets IT pushes,
 * PM gets PM pushes — no extra work needed on the frontend.
 */
export const registerPushSubscription = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("[Push] Not supported in this browser");
    return false;
  }
  try {
    const keyRes  = await api.get("/push/vapid-public-key");
    const vapidKey = keyRes.data?.key;
    if (!vapidKey) {
      console.warn("[Push] VAPID key not configured on server");
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

// ── In-tab sound ──────────────────────────────────────────────────────────────

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

// ── Native OS notification (in-tab) ──────────────────────────────────────────
// Called when the tab is open. The SW handles notifications when the tab is
// closed. The focused-client check in sw.js prevents double popups.

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

/**
 * triggerAlert — plays sound AND shows an OS notification.
 * Use this in every socket event handler so the user gets notified
 * whether or not they are looking at the tab.
 */
export const triggerAlert = (title, body, onClickCb) => {
  playNotificationSound();
  showNativeNotification(title, body, onClickCb);
};