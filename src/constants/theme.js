/**
 * OPS SUITE Design Tokens
 * Single source of truth for all color, spacing, and style values.
 * Previously duplicated identically in PPCDashboard, ManagerDashboard, PMDashboard.
 */
export const T = {
  bg:         "#0c0b08",
  bgSide:     "#0f0e0a",
  bgCard:     "#141310",
  bgRow:      "#111009",
  bgInput:    "#0a0908",
  gold:       "#c9a42a",
  goldLight:  "#e2bc4a",
  goldDim:    "rgba(201,164,42,0.13)",
  goldBorder: "rgba(201,164,42,0.20)",
  text:       "#e8ddc8",
  muted:      "#7a7060",
  subtle:     "#2e2c22",
  white:      "#f5edd8",
  red:        "#e05252",
  redBg:      "rgba(224,82,82,0.12)",
  teal:       "#3ecfb2",
  tealBg:     "rgba(62,207,178,0.11)",
  blue:       "#5b9cf6",
  blueBg:     "rgba(91,156,246,0.11)",
  amber:      "#f0a030",
  amberBg:    "rgba(240,160,48,0.11)",
  green:      "#4cbb7f",
  greenBg:    "rgba(76,187,127,0.11)",
  purple:     "#a78bfa",
  purpleBg:   "rgba(167,139,250,0.11)",
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
