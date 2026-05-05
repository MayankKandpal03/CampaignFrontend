/**
 * RoleBadge — refined role indicator pill.
 * Dynamic colors kept as inline style (runtime values).
 */
import { ROLE_COLOR } from "../../constants/statusMeta.js";

export default function RoleBadge({ role }) {
  const m = ROLE_COLOR[role] ?? { color: "#706658", bg: "rgba(112,102,88,0.1)" };
  return (
    <span
      className="inline-flex items-center px-2.25 ppy-0.75rounded-full text-[9px] font-semibold tracking-[0.12em] font-['Cinzel',serif] whitespace-nowrap uppercase"
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