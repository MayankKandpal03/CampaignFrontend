/**
 * StatusBadge — renders a coloured pill for campaign status or action values.
 * Previously copy-pasted into PPCDashboard, ManagerDashboard, and PMDashboard.
 */
import { STATUS_META } from "../../constants/statusMeta.js";

export default function StatusBadge({ value, meta = STATUS_META }) {
  const m = meta[value] ?? {
    label: (value ?? "—").toUpperCase(),
    color: "#7a7060",
    bg:    "rgba(122,112,96,0.11)",
  };
  return (
    <span style={{
      display:       "inline-flex",
      alignItems:    "center",
      padding:       "3px 9px",
      borderRadius:  2,
      background:    m.bg,
      color:         m.color,
      fontSize:      9,
      fontWeight:    700,
      letterSpacing: "0.12em",
      fontFamily:    "'Cinzel', serif",
      whiteSpace:    "nowrap",
      border:        `1px solid ${m.color}33`,
    }}>
      {m.label}
    </span>
  );
}
