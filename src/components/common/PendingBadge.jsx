/**
 * PendingBadge — refined animated pending indicator.
 */

export default function PendingBadge() {
  return (
    <span className="ops-pending inline-flex items-center gap-1.25 px-2.25 py-0.75 rounded-full bg-[rgba(112,102,88,0.08)] text-[#7a7060] text-[9.5px] font-semibold tracking-widest font-['Cinzel',serif] whitespace-nowrap uppercase border border-[#2e2c22]">
      <span className="w-1 h-1 rounded-full bg-[#7a7060] shrink-0" />
      Pending
    </span>
  );
}