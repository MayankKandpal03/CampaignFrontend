/**
 * itNotifications.js
 *
 * Handles all IT-specific notification logic:
 *  1. Web Notifications API  — native OS-level alerts visible above every
 *     application, including when the browser tab is in the background.
 *  2. Web Audio API sound    — generated programmatically; no audio file needed.
 *
 * WHY NATIVE NOTIFICATIONS ARE THE ONLY CROSS-TAB SOLUTION:
 * The OverlayNotif React component lives inside the ITDashboard component tree.
 * React cannot render into another browser tab or another application. The only
 * way to alert a user who is currently on a different tab or a different app is
 * via the OS-level Notification API. The in-app overlay is shown when the user
 * returns to (or is already on) the IT dashboard tab.
 *
 * IMPORTANT — permission must be granted explicitly:
 * Call requestNotificationPermission() and surface the result to the user.
 * Silently calling it in a useEffect with no UI feedback means users never see
 * the browser permission prompt (it is suppressed on many browsers unless
 * triggered by a user gesture or visible UI cue).
 */

// ── Permission ────────────────────────────────────────────────────────────────

/**
 * Request notification permission if not already granted/denied.
 * Returns true if permission is now "granted".
 * Must be called from a user gesture (button click) for the browser
 * permission prompt to appear on Chrome/Edge.
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

export const getNotificationPermission = () => {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
};

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
    if (ctx.state === "suspended") ctx.resume();

    const schedule = [
      { freq: 784,  start: 0,    dur: 0.18, vol: 0.28 },
      { freq: 988,  start: 0.16, dur: 0.18, vol: 0.28 },
      { freq: 1175, start: 0.32, dur: 0.32, vol: 0.32 },
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
    console.warn("[ITNotif] Sound failed:", e.message);
  }
};

// ── Native (OS-level) Notification ───────────────────────────────────────────

/**
 * Show a native browser/OS notification.
 *
 * The onClick handler uses a two-step approach to bring the IT dashboard
 * tab to the foreground when the user clicks the notification:
 *   1. window.focus() — works in Chrome/Edge when the page already has focus.
 *   2. The browser itself focuses the originating tab when the user clicks a
 *      Notification — this is built into the browser and doesn't require code.
 *
 * @param {string}   title
 * @param {string}   body
 * @param {Function} [onClickCb]  - extra callback after the tab is focused
 * @returns {boolean}  true if the notification was actually created
 */
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
      // Clicking the OS notification focuses the originating browser tab.
      // window.focus() reinforces this for browsers that don't do it automatically.
      try { window.focus(); } catch (_) {}
      if (onClickCb) onClickCb();
    };

    return true;
  } catch (e) {
    console.warn("[ITNotif] Native notification failed:", e.message);
    return false;
  }
};

// ── Combined trigger ──────────────────────────────────────────────────────────

/**
 * Play sound + show native OS notification.
 * Returns true if the native notification was created (i.e., permission granted).
 *
 * @param {string}   title
 * @param {string}   body
 * @param {Function} [onClickCb]
 * @returns {boolean}
 */
export const triggerAlert = (title, body, onClickCb) => {
  playNotificationSound();
  return showNativeNotification(title, body, onClickCb);
};