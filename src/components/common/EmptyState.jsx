/**
 * EmptyState — refined empty placeholder with diamond glyph.
 * Props unchanged.
 */

export default function EmptyState({
  headline = "No Records Found",
  sub,
  action,
}) {
  return (
    <div className="py-15 px-6 text-center animate-[opsFadeUp_0.3s_ease_both]">
      {/* Diamond glyph */}
      <div className="w-12 h-12 rounded-xl bg-[rgba(201,164,42,0.13)] border border-[rgba(201,164,42,0.20)] flex items-center justify-center mx-auto mb-4.5">
        <svg width="20" height="20" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <polygon points="18,4 32,18 18,32 4,18" fill="none" stroke="rgba(200,168,74,0.4)" strokeWidth="1.5"/>
          <polygon points="18,11 25,18 18,25 11,18" fill="rgba(200,168,74,0.08)" stroke="rgba(200,168,74,0.3)" strokeWidth="1"/>
        </svg>
      </div>

      <p className="m-0 text-sm font-semibold text-[#f5edd8] font-['Cinzel',serif] tracking-[0.03em]">
        {headline}
      </p>

      {sub && (
        <p className="mt-2 text-[13px] text-[#7a7060] leading-relaxed font-['DM_Sans',sans-serif] max-w-75 mx-auto">
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