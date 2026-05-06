/**
 * EmptyState — refined empty placeholder with leaf glyph.
 * Props unchanged.
 */

export default function EmptyState({
  headline = "No Records Found",
  sub,
  action,
}) {
  return (
    <div className="py-15 px-6 text-center animate-[opsFadeUp_0.3s_ease_both]">
      {/* Leaf glyph */}
      <div className="w-12 h-12 rounded-xl bg-[rgba(42,96,72,0.06)] border border-[rgba(42,96,72,0.10)] flex items-center justify-center mx-auto mb-4.5">
        <svg width="20" height="20" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path d="M18 4 C26 8, 30 16, 28 24 C26 30, 20 34, 18 34 C16 34, 10 30, 8 24 C6 16, 10 8, 18 4Z" fill="rgba(42,96,72,0.06)" stroke="rgba(42,96,72,0.3)" strokeWidth="1.2"/>
          <path d="M18 8 L18 30" stroke="rgba(42,96,72,0.2)" strokeWidth="0.8"/>
        </svg>
      </div>

      <p className="m-0 text-sm font-semibold text-[#1a1810] font-['Fraunces',serif] tracking-[0.03em]">
        {headline}
      </p>

      {sub && (
        <p className="mt-2 text-[13px] text-[#8a8475] leading-relaxed font-['DM_Sans',sans-serif] max-w-75 mx-auto">
          {sub}
        </p>
      )}

      {action && (
        <div className="mt-5.5">
          {action}
        </div>
      )}
    </div>
  );
}