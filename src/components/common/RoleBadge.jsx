/**
 * RoleBadge — refined role indicator pill.
 * Dynamic colors kept as inline style (runtime values).
 * Updated font to Fraunces.
 */
import { ROLE_COLOR } from "../../constants/statusMeta.js";

export default function RoleBadge({ role }) {
  const m = ROLE_COLOR[role] ?? { color: "#8a8475", bg: "rgba(138,132,117,0.08)" };
  return (
    <span
      className="inline-flex items-center px-2.25 py-0.75 rounded-full text-[9px] font-semibold tracking-[0.12em] font-['Fraunces',serif] whitespace-nowrap uppercase"
      style={{
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.color}28`,
      }}
    >
      {(role || "—").toUpperCase()}
    </span>
  );
}