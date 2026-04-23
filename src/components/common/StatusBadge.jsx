/**
 * StatusBadge — refined pill with smooth rendering.
 */
import { STATUS_META } from "../../constants/statusMeta.js";

export function StatusBadge({ value, meta = STATUS_META }) {
  const m = meta[value] ?? {
    label: (value ?? "—").toUpperCase(),
    color: "#706658",
    bg:    "rgba(112,102,88,0.1)",
  };
  return (
    <span style={{
      display:       "inline-flex",
      alignItems:    "center",
      gap:           5,
      padding:       "3px 9px",
      borderRadius:  99,
      background:    m.bg,
      color:         m.color,
      fontSize:      9.5,
      fontWeight:    600,
      letterSpacing: "0.1em",
      fontFamily:    "'Cinzel', serif",
      whiteSpace:    "nowrap",
      border:        `1px solid ${m.color}28`,
      textTransform: "uppercase",
    }}>
      <span style={{
        width:        4,
        height:       4,
        borderRadius: "50%",
        background:   m.color,
        flexShrink:   0,
        opacity:      0.8,
      }}/>
      {m.label}
    </span>
  );
}

export default StatusBadge;