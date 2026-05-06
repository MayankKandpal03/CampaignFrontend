/**
 * OPS SUITE Design Tokens — Nature-Inspired Ayurvedic Theme
 * Single source of truth for all color, spacing, and style values.
 * Previously duplicated identically in PPCDashboard, ManagerDashboard, PMDashboard.
 */
export const T = {
  bg:         "#faf8f4",
  bgSide:     "#f5f2ec",
  bgCard:     "#ffffff",
  bgRow:      "#f8f7f4",
  bgInput:    "#faf8f5",
  gold:       "#2a6048",
  goldLight:  "#347a5a",
  goldDim:    "rgba(42,96,72,0.08)",
  goldBorder: "rgba(42,96,72,0.12)",
  text:       "#2d2a24",
  muted:      "#8a8475",
  subtle:     "#e8e5de",
  white:      "#1a1810",
  red:        "#b83030",
  redBg:      "rgba(184,48,48,0.08)",
  teal:       "#1a6040",
  tealBg:     "rgba(26,96,64,0.08)",
  blue:       "#1a4f6e",
  blueBg:     "rgba(26,79,110,0.08)",
  amber:      "#8f420c",
  amberBg:    "rgba(143,66,12,0.07)",
  green:      "#2a6048",
  greenBg:    "rgba(42,96,72,0.08)",
  purple:     "#6b4fa0",
  purpleBg:   "rgba(107,79,160,0.08)",
  accent2:    "#b89030",
  sideW:      224,
};

/**
 * Shared input element style.
 * Previously defined as `inputSx` inside every dashboard file.
 */
export const inputSx = {
  width: "100%",
  boxSizing: "border-box",
  background: T.bgInput,
  border: `1px solid ${T.subtle}`,
  borderRadius: 3,
  color: T.text,
  fontSize: 13,
  padding: "11px 14px",
  outline: "none",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.2s, box-shadow 0.2s",
};
