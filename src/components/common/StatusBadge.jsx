/**
 * StatusBadge — refined pill with smooth rendering.
 * Dynamic colors kept as inline style (runtime values).
 */
import { STATUS_META } from "../../constants/statusMeta.js";

export function StatusBadge({ value, meta = STATUS_META }) {
  const m = meta[value] ?? {
    label: (value ?? "—").toUpperCase(),
    color: "#706658",
    bg:    "rgba(112,102,88,0.1)",
  };
  return (
    <span
      className="inline-flex items-center gap-1.25 px-2.25 py-0.75 rounded-full text-[9.5px] font-semibold tracking-widest font-['Cinzel',serif] whitespace-nowrap uppercase"
      style={{
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.color}28`,
      }}
    >
      <span
        className="w-1 h-1 rounded-full shrink-0 opacity-80"
        style={{ background: m.color }}
      />
      {m.label}
    </span>
  );
}

export default StatusBadge;