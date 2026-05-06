/**
 * TableToolbar — premium search bar, record count, filter chip.
 * Updated for nature light theme.
 */

export default function TableToolbar({
  title,
  count,
  search,
  onSearch,
  activeFilter,
  onClearFilter,
  isMobile = false,
}) {
  return (
    <div className="px-4.5 py-3 flex items-center justify-between gap-2.5 flex-wrap border-b border-[#e8e5de] bg-[#f8f7f4]">
      {/* Left */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[8.5px] font-bold tracking-[0.18em] text-[#2a6048] font-['Fraunces',serif] uppercase">
          {title}
        </span>

        <span className="px-2.25 py-0.5 rounded-full bg-[rgba(42,96,72,0.08)] border border-[rgba(42,96,72,0.12)] text-[9px] text-[#2a6048] font-['JetBrains_Mono',monospace] font-bold">
          {count} records
        </span>

        {activeFilter && (
          <button
            onClick={onClearFilter}
            className="flex items-center gap-1.25 bg-transparent border border-[#e8e5de] text-[#8a8475] text-[9px] cursor-pointer px-2.25 py-0.5 rounded-full transition-all duration-150 hover:text-[#b83030] hover:border-[#b83030] hover:bg-[rgba(184,48,48,0.06)] font-['DM_Sans',sans-serif]"
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Right: search */}
      <div className={`relative shrink-0 ${isMobile ? "w-full" : ""}`}>
        <span className="absolute left-2.75 top-1/2 -translate-y-1/2 text-[#8a8475] pointer-events-none leading-none">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </span>
        <input
          className="ops-focus bg-white border border-[#e8e5de] rounded-full text-[#2d2a24] text-xs pl-8.5 h-8.5 font-['DM_Sans',sans-serif] outline-none transition-all"
          style={{ width: isMobile ? "100%" : 210 }}
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
}