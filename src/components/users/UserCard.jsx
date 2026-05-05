/**
 * UserCard — displays a single user's info with optional delete button.
 */
import { initials } from "../../utils/formatters.js";
import RoleBadge from "../common/RoleBadge.jsx";

export default function UserCard({ user, campaignCount, showDetails = false, onDelete }) {
  return (
    <div className="bg-[#141310] border border-[rgba(201,164,42,0.20)] rounded p-[16px_18px] transition-all duration-200 hover:border-[rgba(201,164,42,0.27)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] animate-[opsFadeUp_0.22s_ease]">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[rgba(167,139,250,0.11)] border border-[rgba(167,139,250,0.27)] flex items-center justify-center text-xs font-bold text-[#a78bfa] font-['Cinzel',serif] shrink-0">
            {initials(user.username || "U")}
          </div>
          <div>
            <p className="m-0 text-[13px] font-semibold text-[#f5edd8] font-['Cinzel',serif]">
              {user.username || "—"}
            </p>
            <p className="mt-0.5 m-0 text-[10px] text-[#7a7060] font-['JetBrains_Mono',monospace]">
              {user.email || "—"}
            </p>
          </div>
        </div>

        {onDelete && (
          <button
            className="ops-del px-2.5 py-1 rounded bg-[rgba(224,82,82,0.12)] border border-[rgba(224,82,82,0.2)] text-[#7a7060] text-[9px] font-bold tracking-widest cursor-pointer font-['Cinzel',serif]"
            onClick={() => onDelete(user)}
          >
            REMOVE
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#7a7060] tracking-[0.12em] font-['Cinzel',serif]">ROLE</span>
          <RoleBadge role={user.role} />
        </div>

        {campaignCount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#7a7060] tracking-[0.12em] font-['Cinzel',serif]">TASKS</span>
            <p className={`m-0 text-[13px] font-bold font-['Cinzel',serif] ${campaignCount > 0 ? "text-[#c9a42a]" : "text-[#2e2c22]"}`}>
              {campaignCount}
            </p>
          </div>
        )}

        {showDetails && user.managerId && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#7a7060] tracking-[0.12em] font-['Cinzel',serif]">MANAGER</span>
            <span className="text-[10px] text-[#7a7060] font-['JetBrains_Mono',monospace] max-w-37.5 overflow-hidden text-ellipsis">
              {typeof user.managerId === "object"
                ? (user.managerId.username || user.managerId._id)
                : user.managerId}
            </span>
          </div>
        )}

        {showDetails && user.teams?.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#7a7060] tracking-[0.12em] font-['Cinzel',serif]">TEAMS</span>
            <span className="text-[10px] text-[#a78bfa] font-['JetBrains_Mono',monospace]">
              {user.teams.length} team{user.teams.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {showDetails && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#7a7060] tracking-[0.12em] font-['Cinzel',serif]">USER ID</span>
            <span className="text-[9px] text-[#2e2c22] font-['JetBrains_Mono',monospace]">
              {String(user._id || "—").slice(0, 16)}…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}