/**
 * GoldBtn — premium button with smooth micro-interactions.
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
    "inline-flex items-center justify-center gap-[7px] px-5 py-[10px] rounded-lg text-[11px] font-semibold tracking-[0.12em] font-['Cinzel',serif] uppercase leading-none border transition-all duration-[180ms] ease-out active:scale-[0.975] disabled:opacity-45 disabled:cursor-not-allowed";

  if (isFill) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${base} bg-linear-to-br from-[#c9a42a] to-[#d4b44e] text-[#0c0906] border-[#c9a42a] shadow-[0_2px_10px_rgba(200,168,74,0.18),0_1px_2px_rgba(0,0,0,0.2)] hover:-translate-y-px hover:from-[#e2bc4a] hover:to-[#e8c060] hover:shadow-[0_4px_20px_rgba(200,168,74,0.3),0_1px_4px_rgba(0,0,0,0.25)] cursor-pointer`}
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
      className={`${base} bg-transparent text-[#c9a42a] border-[rgba(201,164,42,0.20)] hover:bg-[rgba(201,164,42,0.13)] hover:text-[#e2bc4a] hover:border-[#c9a42a] hover:shadow-[0_2px_12px_rgba(200,168,74,0.12)] hover:-translate-y-px cursor-pointer`}
      style={style}
    >
      {children}
    </button>
  );
}