/**
 * DashboardHeader — premium redesign.
 * Props and logic (NotifPanel, useNotifStore) unchanged.
 * Styling: refined typography, cleaner layout, polished notification bell.
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
      padding:        isMobile ? "0 16px" : "0 28px",
      height:         56,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      gap:            12,
      borderBottom:   `1px solid ${T.subtle}`,
      background:     `linear-gradient(90deg, ${T.bgSide} 0%, ${T.bg} 100%)`,
      position:       "sticky",
      top:            0,
      zIndex:         100,
      flexShrink:     0,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>

      {/* ── Left: hamburger + title ───────────────────────────────────────── */}
      <div style={{display:"flex", alignItems:"center", gap:12, minWidth:0}}>

        {/* Hamburger — mobile only */}
        {isMobile && (
          <button
            onClick={onMenuToggle}
            style={{
              display:        "flex",
              flexDirection:  "column",
              gap:            4,
              background:     "transparent",
              border:         `1px solid ${T.subtle}`,
              borderRadius:   7,
              padding:        "7px 8px",
              cursor:         "pointer",
              flexShrink:     0,
              transition:     "border-color .18s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.goldBorder}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.subtle}
            aria-label="Toggle navigation"
          >
            {sidebarOpen
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : (
                <>
                  <span style={{display:"block", width:16, height:1.5, borderRadius:2, background:T.muted}}/>
                  <span style={{display:"block", width:12, height:1.5, borderRadius:2, background:T.muted}}/>
                  <span style={{display:"block", width:16, height:1.5, borderRadius:2, background:T.muted}}/>
                </>
              )
            }
          </button>
        )}

        {/* Title block */}
        <div style={{minWidth:0}}>
          <p style={{
            margin:        0,
            fontSize:      8,
            letterSpacing: "0.24em",
            color:         T.gold,
            fontFamily:    "'Cinzel', serif",
            textTransform: "uppercase",
            opacity:       0.7,
            lineHeight:    1,
          }}>
            {subLabel}
          </p>
          <h1 style={{
            margin:        "3px 0 0",
            fontSize:      isMobile ? 16 : 19,
            fontWeight:    600,
            color:         T.white,
            fontFamily:    "'Cinzel', serif",
            letterSpacing: "0.02em",
            lineHeight:    1.1,
            whiteSpace:    "nowrap",
            overflow:      "hidden",
            textOverflow:  "ellipsis",
          }}>
            {title}
          </h1>
        </div>
      </div>

      {/* ── Right: badge + bell ──────────────────────────────────────────── */}
      <div style={{display:"flex", alignItems:"center", gap:10, flexShrink:0}}>

        {/* Optional badge */}
        {badge && (
          <span style={{
            fontSize:      9.5,
            fontFamily:    "'JetBrains Mono', monospace",
            padding:       "4px 10px",
            borderRadius:  99,
            background:    T.goldDim,
            border:        `1px solid ${T.goldBorder}`,
            color:         T.gold,
            letterSpacing: "0.05em",
            whiteSpace:    "nowrap",
          }}>
            {badge}
          </span>
        )}

        {/* Notification bell */}
        <div style={{position:"relative"}}>
          <button
            onClick={() => setShowNotifs(v => !v)}
            style={{
              width:          36,
              height:         36,
              borderRadius:   9,
              background:     showNotifs ? T.goldDim : "transparent",
              border:         `1px solid ${showNotifs ? T.goldBorder : T.subtle}`,
              color:          showNotifs ? T.gold    : T.muted,
              cursor:         "pointer",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              transition:     "all .18s ease",
              position:       "relative",
              flexShrink:     0,
            }}
            onMouseEnter={e => {
              if (!showNotifs) {
                e.currentTarget.style.borderColor  = T.goldBorder;
                e.currentTarget.style.color        = T.gold;
                e.currentTarget.style.background   = T.goldDim;
              }
            }}
            onMouseLeave={e => {
              if (!showNotifs) {
                e.currentTarget.style.borderColor  = T.subtle;
                e.currentTarget.style.color        = T.muted;
                e.currentTarget.style.background   = "transparent";
              }
            }}
            aria-label="Notifications"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>

            {/* Unread dot */}
            {unread > 0 && (
              <span style={{
                position:     "absolute",
                top:          6,
                right:        6,
                width:        7,
                height:       7,
                borderRadius: "50%",
                background:   T.red,
                border:       `2px solid ${T.bgSide}`,
              }}/>
            )}
          </button>

          {/* Dropdown */}
          <NotifPanel
            open={showNotifs}
            onClose={() => setShowNotifs(false)}
          />
        </div>
      </div>
    </header>
  );
}