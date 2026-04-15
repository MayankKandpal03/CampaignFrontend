/**
 * DiamondLogo — OPS SUITE brand SVG mark.
 * Previously copy-pasted into PPCDashboard, ManagerDashboard, and PMDashboard.
 */
import { T } from "../../constants/theme.js";

export default function DiamondLogo({ size = 34 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
    >
      <polygon
        points="18,2 34,18 18,34 2,18"
        fill="none"
        stroke={T.gold}
        strokeWidth="1.8"
      />
      <polygon
        points="18,8 29,18 18,28 7,18"
        fill={T.goldDim}
        stroke={T.gold}
        strokeWidth="1"
      />
      <polygon points="18,13 23,18 18,23 13,18" fill={T.gold} />
    </svg>
  );
}
