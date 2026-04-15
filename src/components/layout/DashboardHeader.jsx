/**
 * DashboardHeader — sticky top bar for all OPS SUITE dashboards.
 *
 * EXTRACTED FROM: PPCDashboard, ManagerDashboard, PMDashboard.
 * Each had an identical ~40-line <header> block with only the title
 * and subLabel as differences.
 *
 * The notification bell + NotifPanel dropdown are self-contained here
 * using the useNotifStore directly, so callers don't need to thread
 * unread counts or panel open-state through props.
 *
 * @prop {boolean}  isMobile      - show hamburger button when true
 * @prop {Function} onMenuToggle  - hamburger click handler
 * @prop {boolean}  sidebarOpen   - controls hamburger icon (☰ vs ✕)
 * @prop {string}   title         - main heading text
 * @prop {string=}  subLabel      - small eyebrow text above title
 * @prop {string=}  badge         - optional count badge next to bell
 *                                  (e.g. "3 Pending" in ITDashboard)
 */
import { useState } from "react";
import { T } from "../../constants/theme.js";
import NotifPanel from "../common/NotifPanel.jsx";
import useNotifStore from "../../stores/useNotificationStore.js";

export default function DashboardHeader({
  isMobile,
  onMenuToggle,
  sidebarOpen,
  title,
  subLabel = "— ADMIN PANEL",
  badge    = null,
}) {
  const unread = useNotifStore(s => s.unread);
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header style={{
      padding:      isMobile ? "13px 16px" : "13px 28px",
      display:      "flex",
      alignItems:   "center",
      justifyContent: "space-between",
      gap:          12,
      borderBottom: `1px solid ${T.goldBorder}`,
      background:   T.bgSide,
      position:     "sticky",
      top:          0,
      zIndex:       100,
    }}>

      {/* ── Left: hamburger + title ───────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Hamburger — mobile only */}
        {isMobile && (
          <button
            onClick={onMenuToggle}
            style={{
              background:   "transparent",
              border:       `1px solid ${T.subtle}`,
              color:        T.gold,
              cursor:       "pointer",
              padding:      "6px 9px",
              borderRadius: 3,
              fontSize:     16,
              lineHeight:   1,
              transition:   "all .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.subtle}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
        )}

        {/* Title block */}
        <div>
          <p style={{
            margin:        0,
            fontSize:      8,
            letterSpacing: "0.24em",
            color:         T.gold,
            fontFamily:    "'Cinzel', serif",
          }}>
            {subLabel}
          </p>
          <h1 style={{
            margin:        "2px 0 0",
            fontSize:      isMobile ? 17 : 22,
            fontWeight:    600,
            color:         T.white,
            fontFamily:    "'Cinzel', serif",
            letterSpacing: "0.02em",
            lineHeight:    1.1,
          }}>
            {title}
          </h1>
        </div>
      </div>

      {/* ── Right: optional badge + notification bell ─────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Optional count badge (e.g. "3 Pending" used by ITDashboard) */}
        {badge && (
          <span style={{
            fontSize:      10,
            fontFamily:    "'JetBrains Mono', monospace",
            padding:       "3px 10px",
            borderRadius:  2,
            background:    T.goldDim,
            border:        `1px solid ${T.goldBorder}`,
            color:         T.gold,
            letterSpacing: "0.05em",
            whiteSpace:    "nowrap",
          }}>
            {badge}
          </span>
        )}

        {/* Notification bell + dropdown */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            style={{
              width:          36,
              height:         36,
              borderRadius:   3,
              background:     showNotifs ? T.goldDim      : "transparent",
              border:         `1px solid ${showNotifs ? T.goldBorder : T.subtle}`,
              color:          showNotifs ? T.gold         : T.muted,
              cursor:         "pointer",
              fontSize:       14,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              transition:     "all .15s",
              position:       "relative",
            }}
            onMouseEnter={e => {
              if (!showNotifs) {
                e.currentTarget.style.borderColor = T.goldBorder;
                e.currentTarget.style.color       = T.gold;
              }
            }}
            onMouseLeave={e => {
              if (!showNotifs) {
                e.currentTarget.style.borderColor = T.subtle;
                e.currentTarget.style.color       = T.muted;
              }
            }}
            aria-label="Notifications"
          >
            ◉
            {/* Unread indicator dot */}
            {unread > 0 && (
              <span style={{
                position:     "absolute",
                top:          5,
                right:        5,
                width:        7,
                height:       7,
                borderRadius: "50%",
                background:   T.red,
                border:       `1.5px solid ${T.bgSide}`,
              }} />
            )}
          </button>

          {/* Dropdown panel */}
          <NotifPanel
            open={showNotifs}
            onClose={() => setShowNotifs(false)}
          />
        </div>
      </div>
    </header>
  );
}
