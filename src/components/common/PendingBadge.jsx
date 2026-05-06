/**
 * PendingBadge — refined animated pending indicator.
 * Updated for nature light theme.
 */

export default function PendingBadge() {
  return (
    <span className="ops-pending inline-flex items-center gap-1.25 px-2.25 py-0.75 rounded-full bg-[rgba(184,144,48,0.08)] text-[#8c6818] text-[9.5px] font-semibold tracking-widest font-['Fraunces',serif] whitespace-nowrap uppercase border border-[rgba(184,144,48,0.2)]">
      <span className="w-1 h-1 rounded-full bg-[#b89030] shrink-0" />
      Pending
    </span>
  );
}