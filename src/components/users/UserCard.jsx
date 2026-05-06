/**
 * UserCard — displays a single user's info with optional delete button.
 * Nature-inspired light theme.
 */
import { initials } from "../../utils/formatters.js";
import RoleBadge from "../common/RoleBadge.jsx";

export default function UserCard({ user, campaignCount, showDetails = false, onDelete }) {
  return (
    <div className="bg-white border border-[#e8e5de] rounded p-[16px_18px] transition-all duration-200 hover:border-[rgba(42,96,72,0.2)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] animate-[opsFadeUp_0.22s_ease]">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[rgba(42,96,72,0.08)] border border-[rgba(42,96,72,0.12)] flex items-center justify-center text-xs font-bold text-[#2a6048] font-['Fraunces',serif] shrink-0">
            {initials(user.username || "U")}
          </div>
          <div>
            <p className="m-0 text-[13px] font-semibold text-[#1a1810] font-['Fraunces',serif]">
              {user.username || "—"}
            </p>
            <p className="mt-0.5 m-0 text-[10px] text-[#8a8475] font-['JetBrains_Mono',monospace]">
              {user.email || "—"}
            </p>
          </div>
        </div>

        {onDelete && (
          <button
            className="ops-del px-2.5 py-1 rounded bg-[rgba(184,48,48,0.06)] border border-[rgba(184,48,48,0.15)] text-[#8a8475] text-[9px] font-bold tracking-widest cursor-pointer font-['Fraunces',serif]"
            onClick={() => onDelete(user)}
          >
            REMOVE
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-[#8a8475] tracking-[0.12em] font-['Fraunces',serif]">ROLE</span>
          <RoleBadge role={user.role} />
        </div>

        {campaignCount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#8a8475] tracking-[0.12em] font-['Fraunces',serif]">TASKS</span>
            <p className={`m-0 text-[13px] font-bold font-['Fraunces',serif] ${campaignCount > 0 ? "text-[#2a6048]" : "text-[#d4cfc6]"}`}>
              {campaignCount}
            </p>
          </div>
        )}

        {showDetails && user.managerId && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#8a8475] tracking-[0.12em] font-['Fraunces',serif]">MANAGER</span>
            <span className="text-[10px] text-[#8a8475] font-['JetBrains_Mono',monospace] max-w-37.5 overflow-hidden text-ellipsis">
              {typeof user.managerId === "object"
                ? (user.managerId.username || user.managerId._id)
                : user.managerId}
            </span>
          </div>
        )}

        {showDetails && user.teams?.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#8a8475] tracking-[0.12em] font-['Fraunces',serif]">TEAMS</span>
            <span className="text-[10px] text-[#6b4fa0] font-['JetBrains_Mono',monospace]">
              {user.teams.length} team{user.teams.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {showDetails && (
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#8a8475] tracking-[0.12em] font-['Fraunces',serif]">USER ID</span>
            <span className="text-[9px] text-[#d4cfc6] font-['JetBrains_Mono',monospace]">
              {String(user._id || "—").slice(0, 16)}…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}