/**
 * DiamondLogo → LeafLogo — nature-inspired botanical brand SVG mark.
 * Replaced diamond with a stylized leaf icon matching the Ayurvedic theme.
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
      {/* Outer leaf shape */}
      <path
        d="M18 4 C26 8, 30 16, 28 24 C26 30, 20 34, 18 34 C16 34, 10 30, 8 24 C6 16, 10 8, 18 4Z"
        fill="rgba(42,96,72,0.08)"
        stroke="#2a6048"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Center vein */}
      <path
        d="M18 8 L18 30"
        stroke="rgba(42,96,72,0.25)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      {/* Side veins */}
      <path
        d="M18 14 L12 18 M18 18 L11 22 M18 22 L13 25"
        stroke="rgba(42,96,72,0.18)"
        strokeWidth="0.6"
        strokeLinecap="round"
      />
      <path
        d="M18 14 L24 18 M18 18 L25 22 M18 22 L23 25"
        stroke="rgba(42,96,72,0.18)"
        strokeWidth="0.6"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx="18" cy="12" r="1.5" fill="#2a6048" opacity="0.6" />
    </svg>
  );
}