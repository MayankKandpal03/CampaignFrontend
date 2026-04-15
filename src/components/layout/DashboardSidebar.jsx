/**
 * DashboardSidebar — shared sidebar shell for all OPS SUITE dashboards.
 *
 * EXTRACTED FROM: PPCDashboard, ManagerDashboard, PMDashboard.
 * Each had an identical ~80-line <aside> block with only three differences:
 *   1. brandSub label ("PPC PANEL" / "MANAGER PANEL" / "PM PANEL")
 *   2. navItems array (different section IDs and labels)
 *   3. Optional extra slot (Manager team chip)
 *
 * All three differences are now props.
 *
 * @prop {string}     brandSub      - subtitle below "OPS SUITE"
 * @prop {Array}      navItems      - [{ id, label, count? }]
 * @prop {string}     activeSection - currently active nav item id
 * @prop {Function}   onNavigate    - called with section id on nav click
 * @prop {string}     user          - logged-in username (for avatar initials + display)
 * @prop {string}     role          - role label shown under username
 * @prop {Function}   onLogout      - sign-out handler
 * @prop {boolean}    isMobile      - controls fixed vs sticky positioning
 * @prop {boolean}    open          - mobile drawer open state
 * @prop {ReactNode=} extra         - optional slot rendered between brand and nav
 *                                   (used by ManagerDashboard for the team chip)
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
        width:        T.sideW,
        minWidth:     T.sideW,
        background:   T.bgSide,
        borderRight:  `1px solid ${T.goldBorder}`,
        display:      "flex",
        flexDirection:"column",
        /* ── responsive: slide-over on mobile, sticky on desktop ── */
        ...(isMobile
          ? {
              position:   "fixed",
              top:        0,
              left:       open ? 0 : -T.sideW,
              height:     "100vh",
              zIndex:     8000,
              overflowY:  "auto",
              transition: "left .28s cubic-bezier(.22,1,.36,1)",
              boxShadow:  open ? "8px 0 48px rgba(0,0,0,.9)" : "none",
            }
          : {
              position:   "sticky",
              top:        0,
              height:     "100vh",
              overflowY:  "auto",
            }),
      }}
    >
      {/* ── Brand ─────────────────────────────────────────────────── */}
      <div style={{
        padding:      "22px 18px 20px",
        borderBottom: `1px solid ${T.goldBorder}`,
        display:      "flex",
        alignItems:   "center",
        gap:          12,
      }}>
        <DiamondLogo size={32} />
        <div>
          <p style={{
            margin:        0,
            fontSize:      13,
            fontWeight:    700,
            color:         T.white,
            fontFamily:    "'Cinzel', serif",
            letterSpacing: "0.1em",
          }}>
            OPS SUITE
          </p>
          <p style={{
            margin:        "2px 0 0",
            fontSize:      8,
            color:         T.muted,
            letterSpacing: "0.2em",
          }}>
            {brandSub}
          </p>
        </div>
      </div>

      {/* ── Optional extra slot (e.g. Manager team chip) ──────────── */}
      {extra}

      {/* ── Navigation ────────────────────────────────────────────── */}
      <div style={{ padding: "18px 10px 10px", flex: 1 }}>
        <p style={{
          margin:        "0 0 10px 10px",
          fontSize:      8,
          color:         T.muted,
          letterSpacing: "0.2em",
          fontFamily:    "'Cinzel', serif",
        }}>
          NAVIGATION ·
        </p>

        {navItems.map(item => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              className="ops-nav-btn"
              onClick={() => onNavigate(item.id)}
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        10,
                width:      "100%",
                padding:    "10px 12px 10px 10px",
                borderRadius: 3,
                background: active ? T.goldDim : "transparent",
                border:     "none",
                color:      active ? T.gold : T.muted,
                fontSize:   13,
                fontWeight: active ? 500 : 400,
                cursor:     "pointer",
                marginBottom: 2,
                fontFamily: "'DM Sans', sans-serif",
                textAlign:  "left",
                transition: "all .15s",
              }}
            >
              {/* Active indicator dot */}
              <span style={{
                width:      6,
                height:     6,
                borderRadius:"50%",
                flexShrink: 0,
                background: active ? T.gold : T.subtle,
                transition: "background .15s",
              }} />

              <span style={{ flex: 1 }}>{item.label}</span>

              {/* Count badge — only rendered when count > 0 */}
              {item.count > 0 && (
                <span style={{
                  padding:    "1px 7px",
                  borderRadius: 99,
                  background: active ? T.gold   : T.subtle,
                  color:      active ? "#0c0b08": T.muted,
                  fontSize:   9,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  transition: "all .15s",
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Account / Sign-out ────────────────────────────────────── */}
      <div style={{
        padding:     "14px 16px 20px",
        borderTop:   `1px solid ${T.goldBorder}`,
      }}>
        <p style={{
          margin:        "0 0 10px",
          fontSize:      8,
          letterSpacing: "0.2em",
          color:         T.muted,
          fontFamily:    "'Cinzel', serif",
        }}>
          — ACCOUNT
        </p>

        {/* User info row */}
        <div style={{
          display:     "flex",
          alignItems:  "center",
          gap:         10,
          marginBottom: 12,
        }}>
          {/* Avatar */}
          <div style={{
            width:          32,
            height:         32,
            borderRadius:   "50%",
            background:     T.goldDim,
            border:         `1px solid ${T.goldBorder}`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       12,
            fontWeight:     700,
            color:          T.gold,
            fontFamily:     "'Cinzel', serif",
            flexShrink:     0,
          }}>
            {initials(user || "U")}
          </div>

          {/* Name + role */}
          <div>
            <p style={{
              margin:       0,
              fontSize:     13,
              fontWeight:   500,
              color:        T.white,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
              maxWidth:     128,
            }}>
              {user || "User"}
            </p>
            <p style={{
              margin:        0,
              fontSize:      8,
              color:         T.muted,
              letterSpacing: "0.12em",
            }}>
              {(role || "").toUpperCase()} · ACTIVE
            </p>
          </div>
        </div>

        {/* Sign-out button */}
        <button
          onClick={onLogout}
          style={{
            width:         "100%",
            padding:       "8px",
            borderRadius:  3,
            cursor:        "pointer",
            background:    "transparent",
            border:        `1px solid ${T.subtle}`,
            color:         T.muted,
            fontSize:      10,
            letterSpacing: "0.12em",
            fontFamily:    "'Cinzel', serif",
            transition:    "all .15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = T.red;
            e.currentTarget.style.color       = T.red;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = T.subtle;
            e.currentTarget.style.color       = T.muted;
          }}
        >
          SIGN OUT
        </button>
      </div>
    </aside>
  );
}
