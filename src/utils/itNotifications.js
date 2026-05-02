// src/utils/itNotifications.js
//
// USED BY: ITDashboard + PMDashboard
//
// CHANGES:
//  - triggerAlert: removed showNativeNotification call.
//    Chrome/Edge always deliver the service-worker Web Push notification even
//    when the tab is focused. Calling new Notification() here as well produces
//    two OS-level alerts in those browsers (Brave deduplicates them, which is
//    why you saw only 1 there).  The push notification from the backend covers
//    the OS alert; the in-tab overlay card (IT) or the bell badge (PM) cover
//    the visible-page feedback.  triggerAlert now only plays the audio chime.
//  - registerPushSubscription: wraps any error from /push/subscribe so a
//    network failure doesn't prevent the rest of the dashboard from loading.
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
    await navigator.serviceWorker.ready;

    // 3. Check for an existing subscription first to avoid unnecessary re-subscribes
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
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
 */
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
    console.warn("[ITNotif] Sound failed:", e.message);
  }
};

// ── Native (OS-level) in-tab Notification ────────────────────────────────────
// Kept as a standalone export for callers that explicitly need it (e.g. a
// fallback when VAPID / push is not configured at all).
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
 * Plays the audio chime.
 *
 * FIX — duplicate notifications:
 * Chrome and Edge always display the service-worker Web Push notification
 * even when the tab is focused. Calling showNativeNotification() here as
 * well produces two OS-level alerts in those browsers. Brave happens to
 * deduplicate/suppress one of them, which is why only one appeared there.
 *
 * The service-worker push (sent by the backend) is the authoritative OS
 * alert. In-tab visual feedback is handled by:
 *   • OverlayNotif card  — IT dashboard
 *   • Notification bell  — PM dashboard
 *
 * triggerAlert therefore only plays the chime. If you deploy without VAPID
 * keys and need an OS fallback, uncomment the guarded line below.
 */
export const triggerAlert = (title, body, onClickCb) => {
  playNotificationSound();

  // Uncomment ONLY if you have no VAPID / push setup and need a fallback:
  // if (!navigator.serviceWorker?.controller) showNativeNotification(title, body, onClickCb);

  return false;
};