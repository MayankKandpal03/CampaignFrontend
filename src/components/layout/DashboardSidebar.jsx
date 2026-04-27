/**
 * DashboardSidebar — premium redesign.
 * Props interface and all logic unchanged.
 * Styling: refined navigation, elevated brand mark, polished account section.
 */
import { T } from "../../constants/theme.js";
import { initials } from "../../utils/formatters.js";
import DiamondLogo from "../common/DiamondLogo.jsx";

export default function DashboardSidebar({
  brandSub   = "PANEL",
  navItems   = [],
  activeSection,
  onNavigate,
  user,
  role,
  onLogout,
  isMobile,
  open,
  extra = null,
}) {
  return (
    <aside
      style={{
        width:         T.sideW,
        minWidth:      T.sideW,
        background:    `linear-gradient(180deg, ${T.bgSide} 0%, ${T.bg} 100%)`,
        borderRight:   `1px solid ${T.subtle}`,
        display:       "flex",
        flexDirection: "column",
        ...(isMobile
          ? {
              position:   "fixed",
              top:        0,
              left:       open ? 0 : -T.sideW,
              height:     "100vh",
              zIndex:     8000,
              overflowY:  "auto",
              transition: "left .3s cubic-bezier(.22,1,.36,1)",
              boxShadow:  open ? "16px 0 60px rgba(0,0,0,.85)" : "none",
            }
          : {
              position:  "sticky",
              top:       0,
              height:    "100vh",
              overflowY: "auto",
            }),
      }}
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding:     "20px 18px 18px",
        borderBottom:`1px solid ${T.subtle}`,
        display:     "flex",
        alignItems:  "center",
        gap:         11,
        flexShrink:  0,
      }}>
        <div style={{
          width:          36,
          height:         36,
          borderRadius:   9,
          background:     T.goldDim,
          border:         `1px solid ${T.goldBorder}`,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
        }}>
          <DiamondLogo size={20} />
        </div>
        <div>
          <p style={{
            margin:        0,
            fontSize:      13,
            fontWeight:    700,
            color:         T.white,
            fontFamily:    "'Cinzel', serif",
            letterSpacing: "0.1em",
            lineHeight:    1,
          }}>
            Sat Kartar
          </p>
          <p style={{
            margin:        "4px 0 0",
            fontSize:      8,
            color:         T.muted,
            letterSpacing: "0.22em",
            lineHeight:    1,
            textTransform: "uppercase",
          }}>
            {brandSub}
          </p>
        </div>
      </div>

      {/* ── Optional extra slot ────────────────────────────────────────────── */}
      {extra}

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div style={{padding:"16px 10px 10px", flex:1}}>
        <p style={{
          margin:        "0 0 8px 10px",
          fontSize:      10,
          color:         "white",
          letterSpacing: "0.22em",
          fontFamily:    "'Cinzel', serif",
          textTransform: "uppercase",
          
        }}>
          Navigation
        </p>

        {navItems.map(item => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              className="ops-nav-btn"
              onClick={() => onNavigate(item.id)}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          10,
                width:        "100%",
                padding:      "9px 12px 9px 10px",
                borderRadius: 7,
                background:   active ? T.goldDim : "transparent",
                border:       "none",
                color:        active ? T.gold : T.muted,
                fontSize:     13,
                fontWeight:   active ? 500 : 400,
                cursor:       "pointer",
                marginBottom: 2,
                fontFamily:   "'DM Sans', sans-serif",
                textAlign:    "left",
                position:     "relative",
                overflow:     "hidden",
                transition:   "all .16s ease",
                boxShadow:    active ? `inset 2px 0 0 ${T.gold}` : "none",
              }}
            >
              {/* Active pip */}
              <span style={{
                width:        5,
                height:       5,
                borderRadius: "50%",
                flexShrink:   0,
                background:   active ? T.gold : "transparent",
                border:       `1px solid ${active ? T.gold : T.subtle}`,
                transition:   "all .16s ease",
              }}/>

              <span style={{flex:1, lineHeight:1.2}}>{item.label}</span>

              {/* Count badge */}
              {item.count > 0 && (
                <span style={{
                  padding:      "2px 7px",
                  borderRadius: 99,
                  background:   active ? T.gold        : T.subtle,
                  color:        active ? "#0c0906"     : T.muted,
                  fontSize:     9,
                  fontFamily:   "'JetBrains Mono', monospace",
                  fontWeight:   700,
                  transition:   "all .16s ease",
                  lineHeight:   1.4,
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Account / Sign-out ─────────────────────────────────────────────── */}
      <div style={{
        padding:    "14px 14px 18px",
        borderTop:  `1px solid ${T.subtle}`,
        flexShrink: 0,
      }}>
        <p style={{
          margin:        "0 0 10px 2px",
          fontSize:      10,
          letterSpacing: "0.22em",
          color:         "white",
          fontFamily:    "'Cinzel', serif",
          textTransform: "uppercase",
          
        }}>
          Account
        </p>

        {/* User info */}
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          10,
          marginBottom: 12,
          padding:      "8px 10px",
          borderRadius: 8,
          background:   T.goldDim,
          border:       `1px solid ${T.goldBorder}`,
        }}>
          <div style={{
            width:          30,
            height:         30,
            borderRadius:   "50%",
            background:     `linear-gradient(135deg, ${T.goldDim}, rgba(200,168,74,0.2))`,
            border:         `1px solid ${T.goldBorder}`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       11,
            fontWeight:     700,
            color:          T.gold,
            fontFamily:     "'Cinzel', serif",
            flexShrink:     0,
          }}>
            {initials(user || "U")}
          </div>
          <div style={{overflow:"hidden", flex:1}}>
            <p style={{
              margin:       0,
              fontSize:     12,
              fontWeight:   500,
              color:        T.white,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
              fontFamily:   "'DM Sans', sans-serif",
            }}>
              {user || "User"}
            </p>
            <p style={{
              margin:        0,
              fontSize:      8,
              color:         T.muted,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginTop:     2,
            }}>
              {(role || "").toUpperCase()}
            </p>
          </div>
        </div>

        {/* Sign-out */}
        <button
          onClick={onLogout}
          style={{
            width:         "100%",
            padding:       "8px",
            borderRadius:  7,
            cursor:        "pointer",
            background:    "transparent",
            border:        `1px solid ${T.subtle}`,
            color:         T.muted,
            fontSize:      10,
            letterSpacing: "0.14em",
            fontFamily:    "'Cinzel', serif",
            textTransform: "uppercase",
            transition:    "all .18s ease",
            display:       "flex",
            alignItems:    "center",
            justifyContent:"center",
            gap:           7,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor  = T.red;
            e.currentTarget.style.color        = T.red;
            e.currentTarget.style.background   = T.redBg;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor  = T.subtle;
            e.currentTarget.style.color        = T.muted;
            e.currentTarget.style.background   = "transparent";
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}