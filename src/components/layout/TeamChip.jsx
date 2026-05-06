/**
 * TeamChip — nature-inspired team info block for Manager sidebar.
 * Refactored to light theme with green accent.
 */
export default function TeamChip({ teamInfo, memberCount = 0 }) {
  if (!teamInfo) return null;

  return (
    <div className="mx-3 mt-2.5 px-3.5 py-2.5 rounded-lg bg-[linear-gradient(135deg,rgba(42,96,72,0.06),rgba(42,96,72,0.03))] border border-[rgba(42,96,72,0.10)] shrink-0">
      <div className="flex items-center gap-1.75 mb-1">
        <span className="w-1.25 h-1.25 rounded-full bg-[#2a6048] shrink-0 shadow-[0_0_6px_rgba(42,96,72,0.4)]" />
        <p className="m-0 text-[8px] text-[#8a8475] tracking-[0.18em] font-['Fraunces',serif] uppercase">
          Your Team
        </p>
      </div>
      <p className="m-0 mb-0.75 text-[12px] text-[#2a6048] font-['Fraunces',serif] font-semibold tracking-[0.03em]">
        {teamInfo.teamName || "My Team"}
      </p>
      <p className="m-0 text-[9px] text-[#8a8475] font-['JetBrains_Mono',monospace]">
        {memberCount} PPC member{memberCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}