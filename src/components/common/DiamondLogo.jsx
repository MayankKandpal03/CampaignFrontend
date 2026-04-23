/**
 * DiamondLogo — premium brand SVG mark.
 * Props unchanged.
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
        points="18,3 33,18 18,33 3,18"
        fill="none"
        stroke={T.gold}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <polygon
        points="18,9 28,18 18,27 8,18"
        fill={T.goldDim}
        stroke={T.goldBorder}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <polygon
        points="18,14 22,18 18,22 14,18"
        fill={T.gold}
        opacity="0.9"
      />
    </svg>
  );
}