/**
 * NotifPanel — premium notification dropdown.
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
      className="absolute top-11.5 right-0 z-600 bg-linear-to-br from-[#141310] to-[#0c0b08] border border-[#2e2c22] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7),0_4px_16px_rgba(0,0,0,0.5)] animate-[opsFadeUp_0.2s_cubic-bezier(0.22,1,0.36,1)_both]"
      style={{ width }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2e2c22] flex justify-between items-center">
        <span className="text-[9px] font-semibold tracking-[0.2em] text-[#c9a42a] font-['Cinzel',serif] uppercase">
          Notifications
        </span>
        {notifications.length > 0 && (
          <button
            onClick={clearNotifs}
            className="bg-transparent border-none text-[#7a7060] text-[11px] cursor-pointer px-1.5 py-0.5 rounded font-['DM_Sans',sans-serif] transition-colors hover:text-[#e05252]"
          >
            Clear all
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 px-4 text-center">
            <div className="text-xl mb-2.5 opacity-30">◇</div>
            <p className="m-0 text-xs text-[#7a7060] font-['DM_Sans',sans-serif]">
              No notifications
            </p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id}
              className="px-4 py-2.75 transition-colors hover:bg-[rgba(201,164,42,0.13)] cursor-default"
              style={{ borderBottom: i < notifications.length - 1 ? "1px solid rgba(46,44,34,0.13)" : "none" }}
            >
              <p className="m-0 text-xs text-[#e8ddc8] leading-relaxed font-['DM_Sans',sans-serif]">
                {n.message}
              </p>
              <p className="mt-1 m-0 text-[9px] text-[#7a7060] font-['JetBrains_Mono',monospace]">
                {fmt(n.time)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}