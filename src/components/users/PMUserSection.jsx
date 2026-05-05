/**
 * PMUserSection — 3-tab user viewer for Process Manager.
 * REFACTORED: inline styles → Tailwind CSS
 *
 * Kept inline (per rules):
 *  - Dynamic tab colors based on `active` + `rc` (role color)
 *  - Avatar colors from `rc`
 *  - gridTemplateColumns (complex CSS not expressible in Tailwind)
 *  - onMouseEnter/onMouseLeave handlers
 *  - GoldBtn style prop (component API)
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
  const rc = ROLE_COLORS[user.role] ?? { color: "#706658", bg: "rgba(112,102,88,0.1)" };
  return (
    <div
      className="bg-[#141310] border border-[rgba(201,164,42,0.20)] rounded-md px-4.5 py-4 transition-[border-color,box-shadow] duration-200"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${rc.color}55`;
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.4)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = T.goldBorder;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8.5 h-8.5 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold font-[Cinzel,serif]"
            style={{ background: rc.bg, border: `1px solid ${rc.color}44`, color: rc.color }}
          >
            {initials(user.username)}
          </div>
          <div>
            <p className="m-0 text-[13px] font-semibold text-[#f5edd8] font-[Cinzel,serif]">
              {user.username}
            </p>
            <p className="m-0 mt-0.5 text-[11px] text-[#7a7060] font-['JetBrains_Mono',monospace]">
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <RoleBadge role={user.role} />
          {onDelete && (
            <button
              className="ops-del px-2.5 py-0.75 rounded-sm bg-[rgba(224,82,82,0.12)] border border-[rgba(224,82,82,0.2)] text-[#7a7060] text-[9px] font-bold tracking-widest cursor-pointer font-[Cinzel,serif]"
              onClick={() => onDelete(user)}
            >
              DELETE
            </button>
          )}
        </div>
      </div>

      {extra && (
        <div className="mt-3 pt-2.5 border-t border-[rgba(46,44,34,0.13)]">
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
      <p className="m-0 mb-1.5 text-[8px] tracking-[0.14em] text-[#7a7060] font-[Cinzel,serif]">
        TEAM MEMBERS ({teamPpcs.length})
      </p>
      {teamPpcs.length === 0 ? (
        <p className="m-0 text-[11px] text-[#2e2c22] italic">No PPC members yet</p>
      ) : (
        <div className="flex flex-col gap-1">
          {teamPpcs.map(p => (
            <div key={p._id} className="flex items-center gap-2">
              <span className="w-1.25 h-1.25 rounded-full bg-[#5b9cf6] shrink-0" />
              <span className="text-[11px] text-[#e8ddc8] font-medium">{p.username}</span>
              <span className="text-[10px] text-[#7a7060] font-['JetBrains_Mono',monospace]">
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
      <span className="text-[9px] text-[#7a7060] tracking-widest font-[Cinzel,serif]">
        MANAGER
      </span>
      <span className={`text-[11px] ${managerName ? "text-[#c9a42a]" : "text-[#2e2c22]"}`}>
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
                    color:      active ? "#0c0b08" : T.muted,
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
        <div className="py-13 px-5 text-center text-[#7a7060]">
          <div className="mb-2.5 text-[#c9a42a] text-[22px]">◈</div>
          Loading users…
        </div>
      ) : currentList || (
        <div className="py-10 px-5 text-center bg-[#141310] border border-[rgba(201,164,42,0.20)] rounded">
          <div className="text-[24px] text-[#2e2c22] mb-3 font-[Cinzel,serif]">◇</div>
          <p className="m-0 text-[14px] text-[#f5edd8] font-[Cinzel,serif]">No Users Found</p>
          <p className="m-0 mt-1.5 text-[13px] text-[#7a7060]">{EMPTY_MSGS[activeTab]}</p>
        </div>
      )}
    </div>
  );
}