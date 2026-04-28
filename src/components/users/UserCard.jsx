/**
 * UserCard — displays a single user's info with optional delete button.
 *
 * Used in:
 *  - ManagerDashboard → Team Members section (shows campaign count)
 *  - PMDashboard      → PPC Users section (shows managerId / teams)
 *
 * Previously each dashboard had its own card markup. Unified with optional
 * `campaignCount` and `showDetails` props.
 *
 * @prop {object}   user           - { _id, username, email, role, managerId?, teams? }
 * @prop {number=}  campaignCount  - if provided, shown as a stat on the card
 * @prop {boolean=} showDetails    - show managerId / teams rows (PM view)
 * @prop {Function} onDelete       - called with the user object when REMOVE is clicked
 */
import { T } from "../../constants/theme.js";
import { initials } from "../../utils/formatters.js";
import RoleBadge from "../common/RoleBadge.jsx";

export default function UserCard({ user, campaignCount, showDetails = false, onDelete }) {
  return (
    <div
      style={{
        background: T.bgCard, border: `1px solid ${T.goldBorder}`,
        borderRadius: 4, padding: "16px 18px",
        transition: "border-color .2s, box-shadow .2s",
        animation: "opsFadeUp .22s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${T.gold}44`; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.goldBorder;  e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Top row: avatar + name + delete button */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: T.purpleBg, border: `1px solid ${T.purple}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: T.purple,
            fontFamily: "'Cinzel', serif", flexShrink: 0,
          }}>
            {initials(user.username || "U")}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.white, fontFamily: "'Cinzel', serif" }}>
              {user.username || "—"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>
              {user.email || "—"}
            </p>
          </div>
        </div>

        {onDelete && (
          <button
            className="ops-del"
            onClick={() => onDelete(user)}
            style={{
              padding: "4px 10px", borderRadius: 2,
              background: T.redBg, border: `1px solid ${T.red}33`,
              color: T.muted, fontSize: 9, fontWeight: 700,
              letterSpacing: "0.1em", cursor: "pointer",
              fontFamily: "'Cinzel', serif",
            }}
          >
            REMOVE
          </button>
        )}
      </div>

      {/* Stat rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Role */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, color: T.muted, letterSpacing: "0.12em", fontFamily: "'Cinzel', serif" }}>ROLE</span>
          <RoleBadge role={user.role} />
        </div>

        {/* Campaign count (Manager view) */}
        {campaignCount !== undefined && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: T.muted, letterSpacing: "0.12em", fontFamily: "'Cinzel', serif" }}>TASKS</span>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: campaignCount > 0 ? T.gold : T.subtle, fontFamily: "'Cinzel', serif" }}>
              {campaignCount}
            </p>
          </div>
        )}

        {/* PM detail rows */}
        {showDetails && user.managerId && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: T.muted, letterSpacing: "0.12em", fontFamily: "'Cinzel', serif" }}>MANAGER</span>
            <span style={{ fontSize: 10, color: T.muted, fontFamily: "'JetBrains Mono', monospace", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>
              {typeof user.managerId === "object"
                ? (user.managerId.username || user.managerId._id)
                : user.managerId}
            </span>
          </div>
        )}

        {showDetails && user.teams?.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: T.muted, letterSpacing: "0.12em", fontFamily: "'Cinzel', serif" }}>TEAMS</span>
            <span style={{ fontSize: 10, color: T.purple, fontFamily: "'JetBrains Mono', monospace" }}>
              {user.teams.length} team{user.teams.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* User ID (PM view) */}
        {showDetails && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: T.muted, letterSpacing: "0.12em", fontFamily: "'Cinzel', serif" }}>USER ID</span>
            <span style={{ fontSize: 9, color: T.subtle, fontFamily: "'JetBrains Mono', monospace" }}>
              {String(user._id || "—").slice(0, 16)}…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
