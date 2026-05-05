/**
 * TableToolbar — premium search bar, record count, filter chip.
 */
import { inputSx } from "../../constants/theme.js";

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
    <div className="px-4.5 py-3 flex items-center justify-between gap-2.5 flex-wrap border-b border-[#2e2c22] bg-[rgba(20,19,16,0.97)]">
      {/* Left */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-[8.5px] font-bold tracking-[0.18em] text-[#c9a42a] font-['Cinzel',serif] uppercase">
          {title}
        </span>

        <span className="px-2.25 py-0.5 rounded-full bg-[rgba(201,164,42,0.13)] border border-[rgba(201,164,42,0.20)] text-[9px] text-[#c9a42a] font-['JetBrains_Mono',monospace] font-bold">
          {count} records
        </span>

        {activeFilter && (
          <button
            onClick={onClearFilter}
            className="flex items-center gap-1.25 bg-transparent border border-[#2e2c22] text-[#7a7060] text-[9px] cursor-pointer px-2.25 py-0.5 rounded-full transition-all duration-150 hover:text-[#e05252] hover:border-[#e05252] hover:bg-[rgba(224,82,82,0.12)] font-['DM_Sans',sans-serif]"
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Right: search */}
      <div className={`relative shrink-0 ${isMobile ? "w-full" : ""}`}>
        <span className="absolute left-2.75 top-1/2 -translate-y-1/2 text-[#7a7060] pointer-events-none leading-none">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </span>
        <input
          className="ops-focus bg-[#0a0908] border border-[#2e2c22] rounded-full text-[#e8ddc8] text-xs pl-8.5 h-8.5 font-['DM_Sans',sans-serif] outline-none transition-all"
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