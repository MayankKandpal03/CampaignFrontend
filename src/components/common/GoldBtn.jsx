/**
 * GoldBtn — OPS SUITE primary action button with hover/active states.
 * Previously copy-pasted into PPCDashboard, ManagerDashboard, and PMDashboard.
 *
 * @prop {"fill"|"outline"} variant - solid gold or transparent outline
 */
import { useState } from "react";
import { T } from "../../constants/theme.js";

export default function GoldBtn({
  children,
  onClick,
  disabled,
  style = {},
  type = "button",
  variant = "fill",
}) {
  const [hov, setHov] = useState(false);
  const [act, setAct] = useState(false);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setAct(false); }}
      onMouseDown={() => setAct(true)}
      onMouseUp={() => setAct(false)}
      style={{
        padding:       "11px 22px",
        borderRadius:  3,
        fontSize:      11,
        fontWeight:    600,
        letterSpacing: "0.14em",
        fontFamily:    "'Cinzel', serif",
        cursor:        disabled ? "not-allowed" : "pointer",
        opacity:       disabled ? 0.55 : 1,
        transition:    "all 0.15s",
        transform:     act ? "scale(0.98)" : "scale(1)",
        background:
          variant === "fill"
            ? (hov ? T.goldLight : T.gold)
            : (hov ? T.goldDim : "transparent"),
        color:
          variant === "fill"
            ? "#0c0b08"
            : (hov ? T.goldLight : T.gold),
        border: `1px solid ${variant === "fill" ? T.gold : T.goldBorder}`,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
