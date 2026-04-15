/**
 * StarField — animated star background for the Login page.
 * Extracted from LoginPage where it was defined inline (~30 lines).
 * Memoised to prevent re-renders on parent state changes.
 */
import { memo } from "react";

const STARS = Array.from({ length: 140 }, (_, i) => ({
  id:       i,
  size:     Math.random() * 2.2 + 0.4,
  top:      Math.random() * 100,
  left:     Math.random() * 100,
  opacity:  Math.random() * 0.75 + 0.15,
  delay:    Math.random() * 6,
  duration: Math.random() * 4 + 2.5,
}));

export const StarField = memo(() => (
  <div
    className="fixed inset-0 overflow-hidden pointer-events-none z-0"
    aria-hidden="true"
  >
    {STARS.map(s => (
      <div
        key={s.id}
        className="absolute rounded-full bg-white will-change-[opacity,transform]"
        style={{
          width:     s.size,
          height:    s.size,
          top:       `${s.top}%`,
          left:      `${s.left}%`,
          opacity:   s.opacity,
          animation: `twinkle ${s.duration}s ${s.delay}s ease-in-out infinite alternate`,
        }}
      />
    ))}
  </div>
));
StarField.displayName = "StarField";

/**
 * Spinner — SVG loading spinner used inside the Login button.
 * Extracted from LoginPage where it was defined inline.
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
