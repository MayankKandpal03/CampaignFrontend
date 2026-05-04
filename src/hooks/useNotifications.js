// src/hooks/useNotifications.js
//
// Handles notification permission state and push subscription registration
// for any dashboard. Call once at the top of the component.
//
// Usage:
//   const { notifPermission, handleRequestPermission } = useNotifications();
//
// Then render <NotifPermissionBanner> with those two props.

import { useState, useEffect, useCallback } from "react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  registerPushSubscription,
} from "../utils/notifications.js";

export const useNotifications = () => {
  const [notifPermission, setNotifPermission] = useState(
    () => getNotificationPermission()
  );

  // Re-register on every mount so the server's in-memory subscription Map
  // (which resets on restart) always has a live entry for this user.
  // Only runs when permission is already granted — no prompt on mount.
  useEffect(() => {
    if (getNotificationPermission() === "granted") {
      registerPushSubscription().catch((err) =>
        console.warn("[Push] Registration on mount failed:", err.message)
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Called when the user clicks "Enable Notifications".
  const handleRequestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    const newPerm = granted ? "granted" : "denied";
    setNotifPermission(newPerm);
    if (granted) {
      registerPushSubscription().catch((err) =>
        console.warn("[Push] Registration after grant failed:", err.message)
      );
    }
  }, []);

  return { notifPermission, handleRequestPermission };
};