/**
 * GoldBtn — premium button with smooth micro-interactions.
 * Props interface unchanged.
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

  const isFill = variant === "fill";

  const baseStyle = {
    padding:       "10px 20px",
    borderRadius:  8,
    fontSize:      11,
    fontWeight:    600,
    letterSpacing: "0.12em",
    fontFamily:    "'Cinzel', serif",
    textTransform: "uppercase",
    cursor:        disabled ? "not-allowed" : "pointer",
    opacity:       disabled ? 0.45 : 1,
    transition:    "background 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease, color 0.18s ease, border-color 0.18s ease",
    transform:     act && !disabled ? "scale(0.975)" : hov && !disabled ? "translateY(-1px)" : "scale(1)",
    display:       "inline-flex",
    alignItems:    "center",
    justifyContent:"center",
    gap:           7,
    lineHeight:    1,
    border:        "1px solid transparent",
  };

  if (isFill) {
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
          ...baseStyle,
          background:  hov
            ? `linear-gradient(135deg, ${T.goldLight}, #e8c060)`
            : `linear-gradient(135deg, ${T.gold}, #d4b44e)`,
          color:       "#0c0906",
          boxShadow:   hov
            ? `0 4px 20px rgba(200,168,74,0.3), 0 1px 4px rgba(0,0,0,0.25)`
            : `0 2px 10px rgba(200,168,74,0.18), 0 1px 2px rgba(0,0,0,0.2)`,
          borderColor: T.gold,
          ...style,
        }}
      >
        {children}
      </button>
    );
  }

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
        ...baseStyle,
        background:  hov ? T.goldDim : "transparent",
        color:       hov ? T.goldLight : T.gold,
        borderColor: hov ? T.gold : T.goldBorder,
        boxShadow:   hov ? `0 2px 12px rgba(200,168,74,0.12)` : "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}