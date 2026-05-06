/**
 * GoldBtn → PrimaryBtn — forest green primary button with smooth micro-interactions.
 * Hover/active states moved to Tailwind — removed useState for hov/act.
 */

export default function GoldBtn({
  children,
  onClick,
  disabled,
  style = {},
  type = "button",
  variant = "fill",
}) {
  const isFill = variant === "fill";

  const base =
    "inline-flex items-center justify-center gap-[7px] px-5 py-[10px] rounded-lg text-[11px] font-semibold tracking-[0.12em] font-['Fraunces',serif] uppercase leading-none border transition-all duration-[180ms] ease-out active:scale-[0.975] disabled:opacity-45 disabled:cursor-not-allowed";

  if (isFill) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-linear-to-br from-[#2a6048] to-[#347a5a] text-white border-[#2a6048] shadow-[0_2px_10px_rgba(42,96,72,0.18),0_1px_2px_rgba(0,0,0,0.06)] hover:-translate-y-px hover:from-[#347a5a] hover:to-[#3a8a64] hover:shadow-[0_4px_20px_rgba(42,96,72,0.25),0_1px_4px_rgba(0,0,0,0.08)] cursor-pointer`}
        style={style}
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
      className={`${base} bg-transparent text-[#2a6048] border-[rgba(42,96,72,0.15)] hover:bg-[rgba(42,96,72,0.06)] hover:text-[#347a5a] hover:border-[#2a6048] hover:shadow-[0_2px_12px_rgba(42,96,72,0.1)] hover:-translate-y-px cursor-pointer`}
      style={style}
    >
      {children}
    </button>
  );
}