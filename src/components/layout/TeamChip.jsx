/**
 * TeamChip — compact team info block rendered in the Manager sidebar.
 *
 * EXTRACTED FROM: ManagerDashboard.
 * The `teamChip` JSX block was inlined as a variable and passed to
 * DashboardSidebar's `extra` prop. Extracting it makes the Manager
 * page cleaner and makes this component independently readable.
 *
 * @prop {object|null} teamInfo    - team document from GET /team/my
 * @prop {number}      memberCount - count of PPC members in the team
 */
import { T } from "../../constants/theme.js";

export default function TeamChip({ teamInfo, memberCount = 0 }) {
  if (!teamInfo) return null;

  return (
    <div style={{
      margin:       "12px 12px 0",
      padding:      "8px 12px",
      borderRadius: 3,
      background:   T.goldDim,
      border:       `1px solid ${T.goldBorder}`,
    }}>
      <p style={{
        margin:        0,
        fontSize:      8,
        color:         T.muted,
        letterSpacing: "0.16em",
        fontFamily:    "'Cinzel', serif",
      }}>
        TEAM
      </p>
      <p style={{
        margin:     "2px 0 0",
        fontSize:   12,
        color:      T.gold,
        fontFamily: "'Cinzel', serif",
        fontWeight: 600,
      }}>
        {teamInfo.teamName || "My Team"}
      </p>
      <p style={{
        margin:     "1px 0 0",
        fontSize:   9,
        color:      T.muted,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {memberCount} PPC member{memberCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
