/**
 * TeamChip — premium team info block for Manager sidebar.
 * Refactored to Tailwind CSS.
 */
export default function TeamChip({ teamInfo, memberCount = 0 }) {
  if (!teamInfo) return null;

  return (
    <div className="mx-3 mt-2.5 px-3.5 py-2.5 rounded-lg bg-[linear-gradient(135deg,rgba(200,168,74,0.08),rgba(200,168,74,0.04))] border border-[rgba(201,164,42,0.20)] shrink-0">
      <div className="flex items-center gap-1.75 mb-1">
        <span className="w-1.25 h-1.25 rounded-full bg-[#c9a42a] shrink-0 shadow-[0_0_6px_#c9a42a]" />
        <p className="m-0 text-[8px] text-[#7a7060] tracking-[0.18em] font-[Cinzel,serif] uppercase">
          Your Team
        </p>
      </div>
      <p className="m-0 mb-0.75 text-[12px] text-[#c9a42a] font-[Cinzel,serif] font-semibold tracking-[0.03em]">
        {teamInfo.teamName || "My Team"}
      </p>
      <p className="m-0 text-[9px] text-[#7a7060] font-['JetBrains_Mono',monospace]">
        {memberCount} PPC member{memberCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}