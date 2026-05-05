/**
 * DiamondLogo — premium brand SVG mark.
 */

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
        stroke="#c9a42a"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <polygon
        points="18,9 28,18 18,27 8,18"
        fill="rgba(201,164,42,0.13)"
        stroke="rgba(201,164,42,0.20)"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <polygon
        points="18,14 22,18 18,22 14,18"
        fill="#c9a42a"
        opacity="0.9"
      />
    </svg>
  );
}