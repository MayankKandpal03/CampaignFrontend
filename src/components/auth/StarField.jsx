/**
 * LeafField — animated botanical background for the Login page.
 * Replaces the dark star field with floating leaf-like particles.
 * Memoised to prevent re-renders on parent state changes.
 */
import { memo } from "react";

const PARTICLES = Array.from({ length: 60 }, (_, i) => ({
  id:       i,
  size:     Math.random() * 6 + 2,
  top:      Math.random() * 100,
  left:     Math.random() * 100,
  opacity:  Math.random() * 0.25 + 0.05,
  delay:    Math.random() * 8,
  duration: Math.random() * 6 + 4,
}));

export const StarField = memo(() => (
  <div
    className="fixed inset-0 overflow-hidden pointer-events-none z-0"
    aria-hidden="true"
  >
    {PARTICLES.map(p => (
      <div
        key={p.id}
        className="absolute rounded-full will-change-[opacity,transform]"
        style={{
          width:      p.size,
          height:     p.size,
          top:        `${p.top}%`,
          left:       `${p.left}%`,
          opacity:    p.opacity,
          background: p.id % 3 === 0 ? "#2a6048" : p.id % 3 === 1 ? "#8a8475" : "#b8974a",
          animation:  `twinkle ${p.duration}s ${p.delay}s ease-in-out infinite alternate`,
        }}
      />
    ))}
  </div>
));
StarField.displayName = "StarField";

/**
 * Spinner — SVG loading spinner used inside the Login button.
 */
export const Spinner = memo(() => (
  <svg
    className="anim-spinner w-4 h-4 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    {[
      [1,    "M12 2v4"],
      [0.3,  "M12 18v4"],
      [0.8,  "M4.93 4.93l2.83 2.83"],
      [0.2,  "M16.24 16.24l2.83 2.83"],
      [0.6,  "M2 12h4"],
      [0.15, "M18 12h4"],
      [0.4,  "M4.93 19.07l2.83-2.83"],
      [0.6,  "M16.24 7.76l2.83-2.83"],
    ].map(([op, d], i) => (
      <path key={i} d={d} strokeLinecap="round" strokeOpacity={op} />
    ))}
  </svg>
));
Spinner.displayName = "Spinner";
