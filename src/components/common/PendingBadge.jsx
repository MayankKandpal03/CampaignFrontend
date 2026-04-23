/**
 * PendingBadge — refined animated pending indicator.
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
        borderRadius:  99,
        background:    "rgba(112,102,88,0.08)",
        color:         T.muted,
        fontSize:      9.5,
        fontWeight:    600,
        letterSpacing: "0.1em",
        fontFamily:    "'Cinzel', serif",
        whiteSpace:    "nowrap",
        border:        `1px solid ${T.subtle}`,
        textTransform: "uppercase",
      }}
    >
      <span style={{
        width:        4,
        height:       4,
        borderRadius: "50%",
        background:   T.muted,
        flexShrink:   0,
      }}/>
      Pending
    </span>
  );
}