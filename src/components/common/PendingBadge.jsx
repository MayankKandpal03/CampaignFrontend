/**
 * PendingBadge — animated "PENDING" status pill.
 *
 * EXTRACTED FROM: PPCDashboard and ManagerDashboard campaign tables.
 * Both rendered the same inline <span className="ops-pending"> block
 * (~8 lines of inline styles) whenever a campaign had no PM action yet.
 *
 * The `ops-pending` CSS class (pulse animation) is injected by OpsGlobalStyles.
 */
import { T } from "../../constants/theme.js";

export default function PendingBadge() {
  return (
    <span
      className="ops-pending"
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        gap:           5,
        padding:       "3px 9px",
        borderRadius:  2,
        background:    "rgba(122,112,96,0.11)",
        color:         T.muted,
        fontSize:      9,
        fontWeight:    700,
        letterSpacing: "0.12em",
        fontFamily:    "'Cinzel', serif",
        whiteSpace:    "nowrap",
        border:        `1px solid ${T.muted}33`,
      }}
    >
      PENDING
    </span>
  );
}
