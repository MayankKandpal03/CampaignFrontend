/**
 * NotifPanel — premium notification dropdown.
 * Logic (useNotifStore, markRead, clearNotifs) unchanged.
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
      position:     "absolute",
      top:          46,
      right:        0,
      width,
      zIndex:       600,
      background:   `linear-gradient(160deg, ${T.bgCard}, ${T.bg})`,
      border:       `1px solid ${T.subtle}`,
      borderRadius: 12,
      overflow:     "hidden",
      boxShadow:    `0 20px 60px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)`,
      animation:    "opsFadeUp .2s cubic-bezier(.22,1,.36,1) both",
    }}>
      {/* Header */}
      <div style={{
        padding:        "12px 16px",
        borderBottom:   `1px solid ${T.subtle}`,
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
      }}>
        <span style={{
          fontSize:      9,
          fontWeight:    600,
          letterSpacing: "0.2em",
          color:         T.gold,
          fontFamily:    "'Cinzel', serif",
          textTransform: "uppercase",
        }}>
          Notifications
        </span>
        {notifications.length > 0 && (
          <button
            onClick={clearNotifs}
            style={{
              background:  "none",
              border:      "none",
              color:       T.muted,
              fontSize:    11,
              cursor:      "pointer",
              padding:     "2px 6px",
              borderRadius:4,
              fontFamily:  "'DM Sans', sans-serif",
              transition:  "color .15s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.color = T.red}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}
          >
            Clear all
          </button>
        )}
      </div>

      {/* List */}
      <div style={{maxHeight:320, overflowY:"auto"}}>
        {notifications.length === 0 ? (
          <div style={{
            padding:    "32px 16px",
            textAlign:  "center",
          }}>
            <div style={{
              fontSize:      20,
              marginBottom:  10,
              opacity:       0.3,
            }}>
              ◇
            </div>
            <p style={{
              margin:    0,
              fontSize:  12,
              color:     T.muted,
              fontFamily:"'DM Sans', sans-serif",
            }}>
              No notifications
            </p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id}
              style={{
                padding:      "11px 16px",
                borderBottom: i < notifications.length - 1 ? `1px solid ${T.subtle}22` : "none",
                transition:   "background .12s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = T.goldDim}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <p style={{
                margin:     0,
                fontSize:   12,
                color:      T.text,
                lineHeight: 1.5,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {n.message}
              </p>
              <p style={{
                margin:     "4px 0 0",
                fontSize:   9,
                color:      T.muted,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {fmt(n.time)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}