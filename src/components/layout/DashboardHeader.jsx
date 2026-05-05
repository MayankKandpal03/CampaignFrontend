/**
 * DashboardHeader — premium redesign.
 */
import { useState } from "react";
import NotifPanel from "../common/NotifPanel.jsx";
import useNotifStore from "../../stores/useNotificationStore.js";

export default function DashboardHeader({
  isMobile,
  onMenuToggle,
  sidebarOpen,
  title,
  subLabel = "— ADMIN PANEL",
  badge = null,
}) {
  const unread = useNotifStore(s => s.unread);
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className={`${isMobile ? "px-4" : "px-7"} h-14 flex items-center justify-between gap-3 border-b border-[#2e2c22] bg-linear-to-r from-[#0f0e0a] to-[#0c0b08] sticky top-0 z-100 shrink-0 backdrop-blur-md`}>

      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3 min-w-0">

        {isMobile && (
          <button
            onClick={onMenuToggle}
            className="flex flex-col gap-1 bg-transparent border border-[#2e2c22] rounded-[7px] p-[7px_8px] cursor-pointer shrink-0 transition-[border-color] duration-180 hover:border-[rgba(201,164,42,0.20)]"
            aria-label="Toggle navigation"
          >
            {sidebarOpen
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a42a" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : (
                <>
                  <span className="block w-4 h-[1.5px] rounded-sm bg-[#7a7060]"/>
                  <span className="block w-3 h-[1.5px] rounded-sm bg-[#7a7060]"/>
                  <span className="block w-4 h-[1.5px] rounded-sm bg-[#7a7060]"/>
                </>
              )
            }
          </button>
        )}

        <div className="min-w-0">
          <p className="m-0 text-[8px] tracking-[0.24em] text-[#c9a42a] font-['Cinzel',serif] uppercase opacity-70 leading-none">
            {subLabel}
          </p>
          <h1 className={`mt-0.75 m-0 ${isMobile ? "text-base" : "text-[19px]"} font-semibold text-[#f5edd8] font-['Cinzel',serif] tracking-[0.02em] leading-[1.1] whitespace-nowrap overflow-hidden text-ellipsis`}>
            {title}
          </h1>
        </div>
      </div>

      {/* Right: badge + bell */}
      <div className="flex items-center gap-2.5 shrink-0">

        {badge && (
          <span className="text-[9.5px] font-['JetBrains_Mono',monospace] px-2.5 py-1 rounded-full bg-[rgba(201,164,42,0.13)] border border-[rgba(201,164,42,0.20)] text-[#c9a42a] tracking-[0.05em] whitespace-nowrap">
            {badge}
          </span>
        )}

        <div className="relative">
          <button
            onClick={() => setShowNotifs(v => !v)}
            className={`w-9 h-9 rounded-[9px] border cursor-pointer flex items-center justify-center transition-all duration-180 relative shrink-0 ${showNotifs ? "bg-[rgba(201,164,42,0.13)] border-[rgba(201,164,42,0.20)] text-[#c9a42a]" : "bg-transparent border-[#2e2c22] text-[#7a7060] hover:border-[rgba(201,164,42,0.20)] hover:text-[#c9a42a] hover:bg-[rgba(201,164,42,0.13)]"}`}
            aria-label="Notifications"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            </svg>

            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.75 h-1.75 rounded-full bg-[#e05252] border-2 border-[#0f0e0a]"/>
            )}
          </button>

          <NotifPanel open={showNotifs} onClose={() => setShowNotifs(false)} />
        </div>
      </div>
    </header>
  );
}