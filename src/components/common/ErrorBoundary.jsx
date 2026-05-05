// src/components/common/ITNotifPanel.jsx
// White-themed notification panel for the IT dashboard — Tailwind refactor.
import { useEffect } from 'react';
import useNotifStore from '../../stores/useNotificationStore.js';
import { fmt } from '../../utils/formatters.js';

export default function ITNotifPanel({ open, width = 310 }) {
  const { notifications, markRead, clearNotifs } = useNotifStore();

  useEffect(() => {
    if (open) markRead();
  }, [open, markRead]);

  if (!open) return null;

  return (
    <div
      className="absolute top-11.5 right-0 z-600 bg-white border border-[#e8e5de] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(24,23,15,0.12),0_2px_8px_rgba(24,23,15,0.06)]"
      style={{ width, animation: 'slideUp 0.22s cubic-bezier(.22,1,.36,1) both' }}
    >
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }`}</style>

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e8e5de] flex justify-between items-center bg-[#f8f7f4]">
        <span className="text-[10px] font-semibold tracking-[0.14em] text-[#2a6048] font-['DM_Mono',monospace] uppercase">
          Notifications
        </span>
        {notifications.length > 0 && (
          <button
            onClick={clearNotifs}
            className="bg-none border-none text-[#8a8475] text-[11px] cursor-pointer px-1.5 py-0.5 rounded font-['DM_Sans',sans-serif] transition-colors duration-150 hover:text-[#b83030]"
          >
            Clear all
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="m-0 mt-2 text-[12px] text-[#8a8475] font-['DM_Sans',sans-serif]">
              No notifications
            </p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <div
              key={n.id}
              className="px-4 py-2.75 cursor-default transition-colors duration-150 hover:bg-[#f8f7f4]"
              style={{ borderBottom: i < notifications.length - 1 ? '1px solid #e8e5de' : 'none' }}
            >
              <p className="m-0 text-[12px] text-[#18170f] leading-normal font-['DM_Sans',sans-serif]">
                {n.message}
              </p>
              <p className="m-0 mt-1 text-[9px] text-[#8a8475] font-['DM_Mono',monospace]">
                {fmt(n.time)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}