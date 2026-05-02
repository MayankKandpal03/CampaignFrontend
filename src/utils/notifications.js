// src/utils/notifications.js
// Unified for ITDashboard + PMDashboard
//
// HOW NOTIFICATIONS WORK:
//  - Tab OPEN & FOCUSED : socket fires → triggerAlert → showNativeNotification
//                         sw.js sees client is focused → suppresses SW push (no duplicate)
//  - Tab OPEN, NOT FOCUSED : SW push fires → sw.js shows OS notification
//  - Tab CLOSED           : SW push fires → sw.js shows OS notification

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

// ── Native OS notification (exported for direct use if needed) ────────────────

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
// DUPLICATE PREVENTION STRATEGY:
//   sw.js checks if any client tab is focused before showing a push notification.
//   If focused → sw.js suppresses the push notification.
//   So calling showNativeNotification here is safe — sw.js won't double-fire.
//
//   Tab OPEN   → this function fires → plays sound + shows native OS notification
//   Tab CLOSED → sw.js push fires   → shows OS notification (this never called)

export const triggerAlert = (title, body, onClickCb) => {
  playNotificationSound();
  showNativeNotification(title, body, onClickCb);
  return true;
};