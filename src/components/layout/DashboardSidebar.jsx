/**
 * DashboardSidebar — premium redesign.
 */
import { initials } from "../../utils/formatters.js";
import DiamondLogo from "../common/DiamondLogo.jsx";

export default function DashboardSidebar({
  brandSub   = "PANEL",
  navItems   = [],
  activeSection,
  onNavigate,
  user,
  role,
  onLogout,
  isMobile,
  open,
  extra = null,
}) {
  return (
    <aside
      className={[
        "w-56 min-w-56 bg-linear-to-b from-[#0f0e0a] to-[#0c0b08] border-r border-[#2e2c22] flex flex-col",
        isMobile
          ? `fixed top-0 left-0 h-screen z-8000 overflow-y-auto transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "translate-x-0 shadow-[16px_0_60px_rgba(0,0,0,0.85)]" : "-translate-x-full"}`
          : "sticky top-0 h-screen overflow-y-auto",
      ].join(" ")}
    >
      {/* Brand */}
      <div className="px-4.5 py-5 border-b border-[#2e2c22] flex items-center gap-2.75 shrink-0">
        <div className="w-9 h-9 rounded-[9px] bg-[rgba(201,164,42,0.13)] border border-[rgba(201,164,42,0.20)] flex items-center justify-center shrink-0">
          <DiamondLogo size={20} />
        </div>
        <div>
          <p className="m-0 text-[13px] font-bold text-[#f5edd8] font-['Cinzel',serif] tracking-widest leading-none">
            Sat Kartar
          </p>
          <p className="mt-1 m-0 text-[8px] text-[#7a7060] tracking-[0.22em] leading-none uppercase">
            {brandSub}
          </p>
        </div>
      </div>

      {/* Optional extra slot (e.g. TeamChip) */}
      {extra}

      {/* Navigation */}
      <div className="px-2.5 pt-4 pb-2.5 flex-1">
        <p className="m-0 mb-2 ml-2.5 text-[10px] text-white tracking-[0.22em] font-['Cinzel',serif] uppercase">
          Navigation
        </p>

        {navItems.map(item => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              className={`ops-nav-btn flex items-center gap-2.5 w-full px-3 py-2.25 rounded-[7px] border-none text-[13px] cursor-pointer mb-0.5 font-['DM_Sans',sans-serif] text-left relative overflow-hidden transition-all duration-160 ${
                active
                  ? "bg-[rgba(201,164,42,0.13)] text-[#c9a42a] font-medium shadow-[inset_2px_0_0_#c9a42a]"
                  : "bg-transparent text-[#7a7060] font-normal"
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <span className={`w-1.25h-[5px] rounded-full shrink-0 transition-all duration-160 ${active ? "bg-[#c9a42a] border-[#c9a42a]" : "bg-transparent border border-[#2e2c22]"}`}/>
              <span className="flex-1 leading-[1.2]">{item.label}</span>

              {item.count > 0 && (
                <span className={`px-1.75 py-0.5 rounded-full text-[9px] font-['JetBrains_Mono',monospace] font-bold leading-[1.4] transition-all duration-160 ${active ? "bg-[#c9a42a] text-[#0c0906]" : "bg-[#2e2c22] text-[#7a7060]"}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Account / Sign-out */}
      <div className="px-3.5 pb-4.5 pt-pt-3.5rder-t border-[#2e2c22] shrink-0">
        <p className="m-0 mb-2.5 ml-0.5 text-[10px] text-white tracking-[0.22em] font-['Cinzel',serif] uppercase">
          Account
        </p>

        {/* User info */}
        <div className="flex items-center gap-2.5 mb-3 px-2.5 py-2 rounded-lg bg-[rgba(201,164,42,0.13)] border border-[rgba(201,164,42,0.20)]">
          <div className="w-7.5 h-7.5 rounded-full bg-linear-to-br from-[rgba(201,164,42,0.13)] to-[rgba(200,168,74,0.2)] border border-[rgba(201,164,42,0.20)] flex items-center justify-center text-[11px] font-bold text-[#c9a42a] font-['Cinzel',serif] shrink-0">
            {initials(user || "U")}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="m-0 text-xs font-medium text-[#f5edd8] overflow-hidden text-ellipsis whitespace-nowrap font-['DM_Sans',sans-serif]">
              {user || "User"}
            </p>
            <p className="m-0 mt-0.5 text-[8px] text-[#7a7060] tracking-[0.12em] uppercase">
              {(role || "").toUpperCase()}
            </p>
          </div>
        </div>

        {/* Sign-out */}
        <button
          onClick={onLogout}
          className="w-full py-2 rounded-[7px] cursor-pointer bg-transparent border border-[#2e2c22] text-[#7a7060] text-[10px] tracking-[0.14em] font-['Cinzel',serif] uppercase transition-all duration-180x items-center justify-center gap-1.75 hover:border-[#e05252] hover:text-[#e05252] hover:bg-[rgba(224,82,82,0.12)]"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}