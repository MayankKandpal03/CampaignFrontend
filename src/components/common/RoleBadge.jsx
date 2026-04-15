/**
 * RoleBadge — coloured role label pill.
 * Previously defined only inside PMDashboard; now shared so ManagerDashboard
 * and ITDashboard can display role labels consistently.
 */
import { ROLE_COLOR } from "../../constants/statusMeta.js";

export default function RoleBadge({ role }) {
  const m = ROLE_COLOR[role] ?? { color: "#7a7060", bg: "rgba(122,112,96,0.11)" };
  return (
    <span style={{
      display:       "inline-flex",
      alignItems:    "center",
      padding:       "2px 8px",
      borderRadius:  2,
      background:    m.bg,
      color:         m.color,
      fontSize:      9,
      fontWeight:    700,
      letterSpacing: "0.1em",
      fontFamily:    "'Cinzel', serif",
      whiteSpace:    "nowrap",
      border:        `1px solid ${m.color}33`,
    }}>
      {(role || "—").toUpperCase()}
    </span>
  );
}
