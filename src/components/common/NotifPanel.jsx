/**
 * NotifPanel — premium notification dropdown.
 * Updated for nature light theme — white panel with green accents.
 */
import { useEffect } from "react";
import useNotifStore from "../../stores/useNotificationStore.js";
import { fmt } from "../../utils/formatters.js";

export default function NotifPanel({ open, width = 300 }) {
  const { notifications, markRead, clearNotifs } = useNotifStore();

  useEffect(() => {
    if (open) markRead();
  }, [open, markRead]);

  if (!open) return null;

  return (
    <div
      className="absolute top-11.5 right-0 z-600 bg-white border border-[#e8e5de] rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.06)] animate-[opsFadeUp_0.2s_cubic-bezier(0.22,1,0.36,1)_both]"
      style={{ width }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e8e5de] flex justify-between items-center bg-[#f8f7f4]">
        <span className="text-[9px] font-semibold tracking-[0.2em] text-[#2a6048] font-['Fraunces',serif] uppercase">
          Notifications
        </span>
        {notifications.length > 0 && (
          <button
            onClick={clearNotifs}
            className="bg-transparent border-none text-[#8a8475] text-[11px] cursor-pointer px-1.5 py-0.5 rounded font-['DM_Sans',sans-serif] transition-colors hover:text-[#b83030]"
          >
            Clear all
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <svg width="20" height="20" viewBox="0 0 36 36" fill="none" className="mx-auto mb-2.5 opacity-30">
              <path d="M18 4 C26 8, 30 16, 28 24 C26 30, 20 34, 18 34 C16 34, 10 30, 8 24 C6 16, 10 8, 18 4Z" fill="rgba(42,96,72,0.06)" stroke="rgba(42,96,72,0.25)" strokeWidth="1"/>
            </svg>
            <p className="m-0 text-xs text-[#8a8475] font-['DM_Sans',sans-serif]">
              No notifications
            </p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id}
              className="px-4 py-2.75 transition-colors hover:bg-[rgba(42,96,72,0.04)] cursor-default"
              style={{ borderBottom: i < notifications.length - 1 ? "1px solid #e8e5de" : "none" }}
            >
              <p className="m-0 text-xs text-[#2d2a24] leading-relaxed font-['DM_Sans',sans-serif]">
                {n.message}
              </p>
              <p className="mt-1 m-0 text-[9px] text-[#8a8475] font-['JetBrains_Mono',monospace]">
                {fmt(n.time)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}