// src/components/campaigns/CampaignsTable.jsx — Nature-inspired light theme
import { useState, useMemo, useEffect } from "react";
import { PM_FILTER_CARDS }   from "../../constants/filterCards.js";
import { STATUS_META, ACTION_META } from "../../constants/statusMeta.js";
import StatusBadge           from "../common/StatusBadge.jsx";
import PendingBadge          from "../common/PendingBadge.jsx";
import { fmt, initials }     from "../../utils/formatters.js";

const COLS = [
  "Created By","PPC Message","PM Comment","PM Action",
  "Requested Time","Schedule At","IT Comment","Ticket State",
];

const INPUT_CX =
  "bg-white border border-[#e8e5de] text-[#2d2a24] text-[12px] outline-none font-['DM_Sans',sans-serif] transition-[border-color,box-shadow] duration-200";

export default function CampaignsTable({
  campaigns, loading, onAction, isMobile,
  title = "ALL TASKS", showActionBtn = true, filterCards = PM_FILTER_CARDS,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  // ── Smart now-state: zero-polling schedule lock ────────────────────────────
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const currentReal = Date.now();
    const justFired = campaigns.some(c =>
      c.scheduleAt &&
      new Date(c.scheduleAt).getTime() > now &&
      new Date(c.scheduleAt).getTime() <= currentReal
    );
    if (justFired) { setTimeout(() => setNow(currentReal), 0); return; }

    const nextTime = campaigns
      .filter(c => c.scheduleAt)
      .map(c => new Date(c.scheduleAt).getTime())
      .filter(t => t > currentReal)
      .sort((a, b) => a - b)[0];

    if (!nextTime) return;
    const delay = nextTime - currentReal;
    const id = setTimeout(() => setNow(Date.now()), delay + 200);
    return () => clearTimeout(id);
  }, [campaigns, now]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    pending:    campaigns.filter(c => !c.action).length,
    approve:    campaigns.filter(c => c.action === "approve").length,
    done:       campaigns.filter(c => c.status === "done").length,
    cancel:     campaigns.filter(c => c.status === "cancel" || c.action === "cancel").length,
    "not done": campaigns.filter(c => c.status === "not done").length,
  }), [campaigns]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...campaigns];
    if (statusFilter === "pending")       list = list.filter(c => !c.action);
    else if (statusFilter === "approve")  list = list.filter(c => c.action === "approve");
    else if (statusFilter === "done")     list = list.filter(c => c.status === "done");
    else if (statusFilter === "cancel")   list = list.filter(c => c.status === "cancel" || c.action === "cancel");
    else if (statusFilter === "not done") list = list.filter(c => c.status === "not done");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.message?.toLowerCase().includes(q) ||
        c.pmMessage?.toLowerCase().includes(q) ||
        (typeof c.createdBy === "object" ? c.createdBy?.username : "")?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [campaigns, statusFilter, search]);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Filter chips */}
      <div className="flex gap-2.5 flex-wrap mb-4.5 shrink-0" style={{ overflowX: isMobile ? "auto" : undefined, flexWrap: isMobile ? "nowrap" : "wrap" }}>
        {filterCards.map(card => {
          const active = statusFilter === card.id;
          return (
            <div
              key={card.id}
              className="ops-fcard cursor-pointer select-none"
              onClick={() => setStatusFilter(p => p === card.id ? null : card.id)}
              style={{
                flex: isMobile ? "0 0 120px" : "1 1 0",
                minWidth: isMobile ? 120 : 100,
                padding: "14px 16px 12px",
                borderRadius: 10,
                background: active ? card.bg : "#ffffff",
                border: `1px solid ${active ? card.color + "40" : "#e8e5de"}`,
                boxShadow: active ? "0 4px 16px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: active ? card.color : "#8a8475", flexShrink: 0 }} />
                <span className="text-[8px] font-bold tracking-[0.16em] font-['Fraunces',serif] uppercase" style={{ color: active ? card.color : "#8a8475" }}>{card.label}</span>
              </div>
              <div className="text-[24px] font-bold font-['Fraunces',serif] leading-none" style={{ color: active ? card.color : "#2d2a24" }}>{stats[card.id] ?? 0}</div>
              <div className="text-[9px] text-[#8a8475] mt-1">tasks</div>
            </div>
          );
        })}
      </div>

      {/* Table card */}
      <div className="bg-white border border-[#e8e5de] rounded-[10px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] flex flex-col flex-1 min-h-0">
        {/* Toolbar */}
        <div className="px-4.5 py-3 flex items-center justify-between gap-2.5 flex-wrap border-b border-[#e8e5de] shrink-0 bg-[#f8f7f4]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[8.5px] font-bold tracking-[0.18em] text-[#2a6048] font-['Fraunces',serif] uppercase">{title}</span>
            <span className="px-2.25 py-0.5 rounded-full bg-[rgba(42,96,72,0.08)] border border-[rgba(42,96,72,0.12)] text-[9px] text-[#2a6048] font-['JetBrains_Mono',monospace] font-semibold">{filtered.length} records</span>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter(null)}
                className="flex items-center gap-1.25 bg-transparent border border-[#e8e5de] text-[#8a8475] text-[9px] cursor-pointer px-2.25 py-0.5 rounded-full transition-all duration-150 font-['DM_Sans',sans-serif] hover:text-[#b83030] hover:border-[#b83030] hover:bg-[rgba(184,48,48,0.06)]"
              >
                ✕ Clear filter
              </button>
            )}
          </div>
          <div className="relative shrink-0" style={{ width: isMobile ? "100%" : "auto" }}>
            <span className="absolute left-2.75 top-1/2 -translate-y-1/2 text-[#8a8475] pointer-events-none leading-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </span>
            <input
              className={`ops-focus ${INPUT_CX} pl-8 h-8.25 rounded-full`}
              style={{ width: isMobile ? "100%" : 230 }}
              type="text"
              placeholder="Search name, message…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="px-5 py-14 text-center text-[#8a8475]">
              <div className="w-8 h-8 rounded-full border-2 border-[#e8e5de] border-t-[#2a6048] mx-auto mb-3.5 animate-[opsSpinner_.8s_linear_infinite]" />
              <p className="m-0 text-[13px]">Loading tasks…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-15 text-center">
              <div className="w-12 h-12 rounded-xl bg-[rgba(42,96,72,0.06)] border border-[rgba(42,96,72,0.10)] flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 36 36" fill="none"><path d="M18 4 C26 8, 30 16, 28 24 C26 30, 20 34, 18 34 C16 34, 10 30, 8 24 C6 16, 10 8, 18 4Z" fill="rgba(42,96,72,0.06)" stroke="rgba(42,96,72,0.25)" strokeWidth="1"/></svg>
              </div>
              <p className="m-0 text-[14px] font-semibold text-[#2d2a24] font-['Fraunces',serif]">No Records Found</p>
              <p className="m-0 mt-2 text-[13px] text-[#8a8475]">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <table className="w-full border-collapse" style={{ minWidth: 1060 }}>
              <thead className="sticky top-0 z-1">
                <tr className="border-b border-[#e8e5de]" style={{ background: "#f8f7f4" }}>
                  {COLS.map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[8.5px] font-semibold text-[#8a8475] tracking-[0.14em] font-['Fraunces',serif] uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const creatorName = typeof c.createdBy === "object" ? c.createdBy?.username : null;
                  const isApproved  = c.action === "approve";
                  const isFutureScheduled = c.scheduleAt && new Date(c.scheduleAt).getTime() > now;
                  const isClosed = c.status==="cancel" || c.status==="done" || c.status==="not done" ||
                    c.action==="cancel" || Boolean(c.acknowledgement) || (isApproved && !isFutureScheduled);
                  const canAct = showActionBtn && (!isClosed || (isApproved && isFutureScheduled));

                  const ticketLabel = isApproved && isFutureScheduled  ? "Scheduled"
                    : isApproved && !c.acknowledgement                  ? "Sent to IT"
                    : c.status==="cancel" || c.action==="cancel"        ? "Cancelled"
                    : c.status==="not done"                             ? "Not Done"
                    : "Closed";

                  const ticketColor = isApproved && isFutureScheduled  ? "#6b4fa0"
                    : isApproved && !c.acknowledgement                  ? "#1a6040"
                    : c.status==="cancel" || c.action==="cancel"        ? "#b83030"
                    : c.status==="not done"                             ? "#8f420c"
                    : "#2a6048";

                  return (
                    <tr
                      key={c._id}
                      className="ops-row"
                      style={{ borderBottom: "1px solid #e8e5de", background: i%2===1 ? "#f8f7f4" : "transparent" }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {creatorName ? (
                          <div className="flex items-center gap-1.75">
                            <div className="w-6 h-6 rounded-full bg-[rgba(42,96,72,0.08)] border border-[rgba(42,96,72,0.12)] flex items-center justify-center text-[9px] font-bold text-[#2a6048] font-['Fraunces',serif] shrink-0">
                              {initials(creatorName)}
                            </div>
                            <span className="text-[12px] text-[#2d2a24]">{creatorName}</span>
                          </div>
                        ) : <span className="text-[11px] text-[#e8e5de] font-['JetBrains_Mono',monospace]">—</span>}
                      </td>

                      <td className="px-4 py-3" style={{ minWidth: 160, maxWidth: 260 }}>
                        <p className="m-0 text-[12px] text-[#2d2a24] leading-[1.55] wrap-break-word whitespace-pre-wrap">{c.message}</p>
                      </td>

                      <td className="px-4 py-3" style={{ minWidth: 130, maxWidth: 220 }}>
                        {c.pmMessage
                          ? <p className="m-0 text-[12px] text-[#8a8475] leading-[1.55] italic wrap-break-word">{c.pmMessage}</p>
                          : <span className="text-[11px] text-[#d4cfc6] font-['JetBrains_Mono',monospace]">—</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.action ? <StatusBadge value={c.action} meta={ACTION_META}/> : <PendingBadge/>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[11px] text-[#8a8475] font-['JetBrains_Mono',monospace]">{fmt(c.requestedAt)}</span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {c.scheduleAt
                          ? <span className="text-[11px] text-[#6b4fa0] font-['JetBrains_Mono',monospace]">{fmt(c.scheduleAt)}</span>
                          : <span className="text-[11px] text-[#d4cfc6] font-['JetBrains_Mono',monospace]">—</span>}
                      </td>

                      <td className="px-4 py-3" style={{ minWidth: 130, maxWidth: 200 }}>
                        {c.itMessage
                          ? <span className="text-[11px] text-[#1a6040] italic wrap-break-word block">{c.itMessage}</span>
                          : <span className="text-[11px] text-[#d4cfc6] font-['JetBrains_Mono',monospace]">—</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {canAct ? (
                          <div className="flex flex-col gap-1 items-start">
                            <button
                              className="ops-upd px-3 py-1 rounded-full bg-[rgba(143,66,12,0.08)] border border-[rgba(143,66,12,0.18)] text-[#8f420c] text-[9px] font-bold tracking-widest cursor-pointer font-['Fraunces',serif] uppercase"
                              onClick={() => onAction(c)}
                            >
                              Update
                            </button>
                            {isApproved && isFutureScheduled && (
                              <span className="text-[8px] text-[#6b4fa0] font-semibold tracking-[0.05em]">AWAITING SCHEDULE</span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] tracking-widest font-bold font-['Fraunces',serif] uppercase" style={{ color: ticketColor }}>
                            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: ticketColor }} />
                            {ticketLabel}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-4.5 py-2.25 border-t border-[#e8e5de] flex justify-between bg-[#f8f7f4] shrink-0">
            <span className="text-[9px] text-[#8a8475] font-['JetBrains_Mono',monospace]">{filtered.length} of {campaigns.length} tasks</span>
            <span className="text-[9px] text-[#8a8475] font-['JetBrains_Mono',monospace] flex items-center gap-1.25">
              <span className="w-1 h-1 rounded-full bg-[#2a6048] animate-[opsPulse_2s_infinite]" />
              Live updates active
            </span>
          </div>
        )}
      </div>
    </div>
  );
}