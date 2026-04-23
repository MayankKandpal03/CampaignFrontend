/**
 * RoleBadge — refined role indicator pill.
 */
import { ROLE_COLOR } from "../../constants/statusMeta.js";

export default function RoleBadge({ role }) {
  const m = ROLE_COLOR[role] ?? { color: "#706658", bg: "rgba(112,102,88,0.1)" };
  return (
    <span style={{
      display:       "inline-flex",
      alignItems:    "center",
      padding:       "3px 9px",
      borderRadius:  99,
      background:    m.bg,
      color:         m.color,
      fontSize:      9,
      fontWeight:    600,
      letterSpacing: "0.12em",
      fontFamily:    "'Cinzel', serif",
      whiteSpace:    "nowrap",
      border:        `1px solid ${m.color}28`,
      textTransform: "uppercase",
    }}>
      {(role || "—").toUpperCase()}
    </span>
  );
}