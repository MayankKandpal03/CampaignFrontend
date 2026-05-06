/**
 * PMUserSection — 3-tab user viewer for Process Manager.
 * Nature-inspired light theme.
 */
import { useState, useMemo } from "react";
import { T }        from "../../constants/theme.js";
import { initials } from "../../utils/formatters.js";
import RoleBadge    from "../common/RoleBadge.jsx";
import GoldBtn      from "../common/GoldBtn.jsx";

const ROLE_COLORS = {
  manager:           { color: T.gold,   bg: T.goldDim  },
  ppc:               { color: T.blue,   bg: T.blueBg   },
  it:                { color: T.teal,   bg: T.tealBg   },
  "process manager": { color: T.purple, bg: T.purpleBg },
};

const TABS = [
  { id: "managers", label: "Managers", role: "manager" },
  { id: "ppcs",     label: "PPCs",     role: "ppc"     },
  { id: "it",       label: "IT",       role: "it"      },
];

/* ── Base card ────────────────────────────────────────────────────────────── */
function BaseCard({ user, extra, onDelete }) {
  const rc = ROLE_COLORS[user.role] ?? { color: "#8a8475", bg: "rgba(138,132,117,0.08)" };
  return (
    <div
      className="bg-white border border-[#e8e5de] rounded-md px-4.5 py-4 transition-[border-color,box-shadow] duration-200"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${rc.color}40`;
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.06)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "#e8e5de";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8.5 h-8.5 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold font-['Fraunces',serif]"
            style={{ background: rc.bg, border: `1px solid ${rc.color}30`, color: rc.color }}
          >
            {initials(user.username)}
          </div>
          <div>
            <p className="m-0 text-[13px] font-semibold text-[#1a1810] font-['Fraunces',serif]">
              {user.username}
            </p>
            <p className="m-0 mt-0.5 text-[11px] text-[#8a8475] font-['JetBrains_Mono',monospace]">
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <RoleBadge role={user.role} />
          {onDelete && (
            <button
              className="ops-del px-2.5 py-0.75 rounded-sm bg-[rgba(184,48,48,0.06)] border border-[rgba(184,48,48,0.15)] text-[#8a8475] text-[9px] font-bold tracking-widest cursor-pointer font-['Fraunces',serif]"
              onClick={() => onDelete(user)}
            >
              DELETE
            </button>
          )}
        </div>
      </div>

      {extra && (
        <div className="mt-3 pt-2.5 border-t border-[rgba(232,229,222,0.5)]">
          {extra}
        </div>
      )}
    </div>
  );
}

/* ── Manager card — shows team members ──────────────────────────────────── */
function ManagerCard({ manager, ppcs, onDelete }) {
  const teamPpcs = ppcs.filter(p => {
    const mid = typeof p.managerId === "object" ? p.managerId?._id : p.managerId;
    return String(mid) === String(manager._id);
  });

  const extra = (
    <>
      <p className="m-0 mb-1.5 text-[8px] tracking-[0.14em] text-[#8a8475] font-['Fraunces',serif]">
        TEAM MEMBERS ({teamPpcs.length})
      </p>
      {teamPpcs.length === 0 ? (
        <p className="m-0 text-[11px] text-[#d4cfc6] italic">No PPC members yet</p>
      ) : (
        <div className="flex flex-col gap-1">
          {teamPpcs.map(p => (
            <div key={p._id} className="flex items-center gap-2">
              <span className="w-1.25 h-1.25 rounded-full bg-[#1a4f6e] shrink-0" />
              <span className="text-[11px] text-[#2d2a24] font-medium">{p.username}</span>
              <span className="text-[10px] text-[#8a8475] font-['JetBrains_Mono',monospace]">
                {p.email}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return <BaseCard user={manager} extra={extra} onDelete={onDelete} />;
}

/* ── PPC card — shows manager name ──────────────────────────────────────── */
function PPCCard({ ppc, onDelete }) {
  const managerName = typeof ppc.managerId === "object" ? ppc.managerId?.username : null;

  const extra = (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-[#8a8475] tracking-widest font-['Fraunces',serif]">
        MANAGER
      </span>
      <span className={`text-[11px] ${managerName ? "text-[#2a6048]" : "text-[#d4cfc6]"}`}>
        {managerName || "Not assigned"}
      </span>
    </div>
  );

  return <BaseCard user={ppc} extra={extra} onDelete={onDelete} />;
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function PMUserSection({ users, loading, onDelete, onRefresh }) {
  const [activeTab, setActiveTab] = useState("managers");

  const managers = useMemo(() => users.filter(u => u.role === "manager"), [users]);
  const ppcs     = useMemo(() => users.filter(u => u.role === "ppc"),     [users]);
  const its      = useMemo(() => users.filter(u => u.role === "it"),      [users]);

  const countMap = { managers: managers.length, ppcs: ppcs.length, it: its.length };

  const EMPTY_MSGS = {
    managers: "No managers found. Create one from Manage Users.",
    ppcs:     "No PPC users found. Managers can create PPC users.",
    it:       "No IT users found. Create one from Manage Users.",
  };

  const renderList = () => {
    if (activeTab === "managers") {
      return managers.length === 0 ? null : (
        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}
        >
          {managers.map(m => (
            <ManagerCard key={m._id} manager={m} ppcs={ppcs} onDelete={onDelete} />
          ))}
        </div>
      );
    }
    if (activeTab === "ppcs") {
      return ppcs.length === 0 ? null : (
        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
        >
          {ppcs.map(p => <PPCCard key={p._id} ppc={p} onDelete={onDelete} />)}
        </div>
      );
    }
    // IT tab
    return its.length === 0 ? null : (
      <div
        className="grid gap-3.5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
      >
        {its.map(u => <BaseCard key={u._id} user={u} onDelete={onDelete} />)}
      </div>
    );
  };

  const currentList = renderList();

  return (
    <div>
      {/* Tab bar + refresh */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex gap-2">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            const rc     = ROLE_COLORS[tab.role] ?? {};
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.75 rounded-[3px] text-[11px] cursor-pointer font-['DM_Sans',sans-serif] transition-all duration-150"
                style={{
                  background: active ? (rc.bg || T.goldDim) : "transparent",
                  border:     `1px solid ${active ? (rc.color || T.gold) : T.subtle}`,
                  color:      active ? (rc.color || T.gold) : T.muted,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {tab.label}
                <span
                  className="px-1.5 py-px rounded-full text-[9px] font-bold font-['JetBrains_Mono',monospace]"
                  style={{
                    background: active ? (rc.color || T.gold) : T.subtle,
                    color:      active ? "#ffffff" : T.muted,
                  }}
                >
                  {countMap[tab.id]}
                </span>
              </button>
            );
          })}
        </div>
        <GoldBtn variant="outline" onClick={onRefresh} style={{ padding: "6px 14px", fontSize: 9 }}>
          REFRESH
        </GoldBtn>
      </div>

      {loading ? (
        <div className="py-13 px-5 text-center text-[#8a8475]">
          <div className="mb-2.5 text-[#2a6048] text-[22px]">◈</div>
          Loading users…
        </div>
      ) : currentList || (
        <div className="py-10 px-5 text-center bg-white border border-[#e8e5de] rounded">
          <div className="text-[24px] text-[#d4cfc6] mb-3 font-['Fraunces',serif]">◇</div>
          <p className="m-0 text-[14px] text-[#1a1810] font-['Fraunces',serif]">No Users Found</p>
          <p className="m-0 mt-1.5 text-[13px] text-[#8a8475]">{EMPTY_MSGS[activeTab]}</p>
        </div>
      )}
    </div>
  );
}