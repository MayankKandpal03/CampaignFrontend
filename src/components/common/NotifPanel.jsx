/**
 * NotifPanel — dropdown notification list.
 * Previously copy-pasted with minor variations (panel width) into
 * PPCDashboard (width 290), ManagerDashboard (width 300), and PMDashboard (width 310).
 * Now accepts a `width` prop; default 300.
 */
import { useEffect } from "react";
import useNotifStore from "../../stores/useNotificationStore.js";
import { T } from "../../constants/theme.js";
import { fmt } from "../../utils/formatters.js";

export default function NotifPanel({ open, onClose, width = 300 }) {
  const { notifications, markRead, clearNotifs } = useNotifStore();

  useEffect(() => {
    if (open) markRead();
  }, [open, markRead]);

  if (!open) return null;

  return (
    <div style={{
      position:  "absolute",
      top:       46,
      right:     0,
      width,
      zIndex:    600,
      background: T.bgCard,
      border:    `1px solid ${T.goldBorder}`,
      borderRadius: 4,
      overflow:  "hidden",
      boxShadow: "0 16px 48px rgba(0,0,0,.7)",
    }}>
      <div style={{
        padding:        "11px 16px",
        borderBottom:   `1px solid ${T.subtle}`,
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
      }}>
        <span style={{
          fontSize:      9,
          fontWeight:    600,
          letterSpacing: "0.18em",
          color:         T.gold,
          fontFamily:    "'Cinzel', serif",
        }}>
          NOTIFICATIONS
        </span>
        <button
          onClick={clearNotifs}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 11, cursor: "pointer" }}
        >
          Clear all
        </button>
      </div>

      <div style={{ maxHeight: 320, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <p style={{ padding: "20px 16px", textAlign: "center", color: T.muted, fontSize: 12, margin: 0 }}>
            No notifications
          </p>
        ) : (
          notifications.map(n => (
            <div key={n.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${T.subtle}22` }}>
              <p style={{ margin: 0, fontSize: 12, color: T.text, lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
                {n.message}
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 9, color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>
                {fmt(n.time)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
