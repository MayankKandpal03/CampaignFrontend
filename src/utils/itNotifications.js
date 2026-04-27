/**
 * itNotifications.js
 *
 * Handles all IT-specific notification logic:
 *  1. Web Notifications API  — native OS-level alerts that overlay above any
 *     application and appear even when the browser tab is in the background.
 *  2. Web Audio API sound    — generated programmatically; no audio file needed.
 *
 * BROWSER SUPPORT NOTES:
 *  - Notification API: supported in Chrome, Firefox, Edge, Safari 16.4+.
 *    iOS Safari does NOT support it — the in-app overlay covers that case.
 *  - requireInteraction: true keeps the native notification visible until the
 *    user explicitly dismisses it (Chrome/Edge). Firefox ignores this flag but
 *    still shows the notification.
 *  - Audio requires a prior user gesture to unlock the AudioContext on most
 *    browsers. The first click anywhere on the page is enough.
 */

// ── Permission ────────────────────────────────────────────────────────────────

/**
 * Request notification permission if not already granted/denied.
 * Returns true if permission is now "granted".
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

export const hasNotificationPermission = () =>
  "Notification" in window && Notification.permission === "granted";

// ── Sound ─────────────────────────────────────────────────────────────────────

let _audioCtx = null;

const getAudioCtx = () => {
  if (_audioCtx && _audioCtx.state !== "closed") return _audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  _audioCtx = new Ctx();
  return _audioCtx;
};

/**
 * Play a three-tone ascending chime.
 * Silently fails if Web Audio is unavailable or AudioContext is locked.
 */
export const playNotificationSound = () => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;

    // Resume suspended context (needed after page load before any gesture)
    if (ctx.state === "suspended") ctx.resume();

    const schedule = [
      { freq: 784,  start: 0,    dur: 0.18, vol: 0.28 },  // G5
      { freq: 988,  start: 0.16, dur: 0.18, vol: 0.28 },  // B5
      { freq: 1175, start: 0.32, dur: 0.32, vol: 0.32 },  // D6
    ];

    schedule.forEach(({ freq, start, dur, vol }) => {
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
    // Silently ignore — sound is non-critical
    console.warn("[ITNotif] Sound failed:", e.message);
  }
};

// ── Native (OS-level) Notification ───────────────────────────────────────────

/**
 * Show a native browser/OS notification.
 *
 * @param {string}   title
 * @param {string}   body
 * @param {Function} [onClick]  - called when the user clicks the notification
 * @returns {Notification|null}
 */
export const showNativeNotification = (title, body, onClick) => {
  if (!hasNotificationPermission()) return null;
  try {
    const notif = new Notification(title, {
      body,
      icon:              "/favicon.ico",
      badge:             "/favicon.ico",
      requireInteraction: true,  // stays visible until user interacts
      tag:               `it-${Date.now()}`,
      renotify:          true,
    });

    if (onClick) notif.onclick = onClick;

    return notif;
  } catch (e) {
    console.warn("[ITNotif] Native notification failed:", e.message);
    return null;
  }
};

// ── Combined trigger ──────────────────────────────────────────────────────────

/**
 * Play sound + show native notification together.
 * Call this whenever a new campaign or daily task arrives.
 *
 * @param {string}   title
 * @param {string}   body
 * @param {Function} [onClick]
 */
export const triggerAlert = (title, body, onClick) => {
  playNotificationSound();
  showNativeNotification(title, body, onClick);
};