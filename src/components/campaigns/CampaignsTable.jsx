// src/components/campaigns/CampaignsTable.jsx
import { useState, useMemo, useEffect } from "react";
import { T, inputSx }        from "../../constants/theme.js";
import { PM_FILTER_CARDS }   from "../../constants/filterCards.js";
import { STATUS_META, ACTION_META } from "../../constants/statusMeta.js";
import StatusBadge           from "../common/StatusBadge.jsx";
import PendingBadge          from "../common/PendingBadge.jsx";
import { fmt, initials }     from "../../utils/formatters.js";

const COLS = [
  "Created By","PPC Message","PM Comment","PM Action",
  "Requested Time","Schedule At","IT Comment","Ticket State",
];

export default function CampaignsTable({
  campaigns, loading, onAction, isMobile,
  title = "ALL TASKS", showActionBtn = true, filterCards = PM_FILTER_CARDS,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  // ── Smart now-state: zero-polling schedule lock ────────────────────────────
  //
  // TWO cases need to update `now`:
  //
  // Case A — Normal path: PM approves a campaign with a future scheduleAt.
  //   We set a setTimeout that fires when that time passes, calling setNow().
  //   The table re-renders and scheduleReached flips to true → "Sent to IT".
  //
  // Case B — schedule_fired socket path: the server timer fires and
  //   `campaign:schedule_fired` arrives, patching `campaigns` (via PMDashboard
  //   setCampaigns). React's useEffect cleanup runs, CLEARING the pending
  //   Case-A timeout because `campaigns` is a dependency. The effect re-runs but
  //   scheduleAt is now past so no new timeout is set. `now` stays stale →
  //   isFutureScheduled stays true → "Sent to IT" never shows.
  //
  // Fix: at the top of the effect, detect when any scheduleAt has crossed from
  // "future per stale now" to "past in real time". If found, call setNow()
  // immediately so the render catches up without needing a timeout.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const currentReal = Date.now();

    // Case B fix — detect a schedule that just fired externally
    const justFired = campaigns.some(c =>
      c.scheduleAt &&
      new Date(c.scheduleAt).getTime() > now &&       // was "future" per stale state
      new Date(c.scheduleAt).getTime() <= currentReal  // is "past" in real time
    );

    if (justFired) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNow(currentReal); // triggers re-render; effect runs again, justFired will be false
      return;
    }

    // Case A — schedule a timeout for the next future scheduleAt
    const nextTime = campaigns
      .filter(c => c.scheduleAt)
      .map(c => new Date(c.scheduleAt).getTime())
      .filter(t => t > currentReal)
      .sort((a, b) => a - b)[0];

    if (!nextTime) return; // no pending schedules — nothing to do

    const delay = nextTime - currentReal;
    const id = setTimeout(() => setNow(Date.now()), delay + 200); // +200ms buffer
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
    <div style={{ display:"flex", flexDirection:"column", minHeight:0, flex:1 }}>
      {/* Filter chips */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18, flexShrink:0 }}>
        {filterCards.map(card => {
          const active = statusFilter === card.id;
          return (
            <div key={card.id} className="ops-fcard"
              onClick={() => setStatusFilter(p => p === card.id ? null : card.id)}
              style={{
                flex: isMobile ? "0 0 120px" : "1 1 0", minWidth: isMobile ? 120 : 100,
                padding:"14px 16px 12px", borderRadius:10,
                background: active ? card.bg : T.bgCard,
                border:`1px solid ${active ? card.color+"55" : T.subtle}`,
                cursor:"pointer", userSelect:"none",
                boxShadow: active ? "0 4px 16px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.2)",
              }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                <span style={{ width:4, height:4, borderRadius:"50%", background: active ? card.color : T.muted, flexShrink:0 }}/>
                <span style={{ fontSize:8, fontWeight:700, letterSpacing:"0.16em", color: active ? card.color : T.muted, fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>{card.label}</span>
              </div>
              <div style={{ fontSize:24, fontWeight:700, color: active ? card.color : T.white, fontFamily:"'Cinzel',serif", lineHeight:1 }}>{stats[card.id] ?? 0}</div>
              <div style={{ fontSize:9, color:T.muted, marginTop:4 }}>tasks</div>
            </div>
          );
        })}
      </div>

      {/* Table card */}
      <div style={{
        background:T.bgCard, border:`1px solid ${T.subtle}`, borderRadius:10,
        overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.3)",
        display:"flex", flexDirection:"column", flex:1, minHeight:0,
      }}>
        {/* Toolbar */}
        <div style={{ padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap", borderBottom:`1px solid ${T.subtle}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:8.5, fontWeight:700, letterSpacing:"0.18em", color:T.gold, fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>{title}</span>
            <span style={{ padding:"2px 9px", borderRadius:99, background:T.goldDim, border:`1px solid ${T.goldBorder}`, fontSize:9, color:T.gold, fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{filtered.length} records</span>
            {statusFilter && (
              <button onClick={() => setStatusFilter(null)}
                style={{ display:"flex", alignItems:"center", gap:5, background:"transparent", border:`1px solid ${T.subtle}`, color:T.muted, fontSize:9, cursor:"pointer", padding:"2px 9px", borderRadius:99, transition:"all .15s", fontFamily:"'DM Sans',sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.color=T.red; e.currentTarget.style.borderColor=T.red; e.currentTarget.style.background=T.redBg; }}
                onMouseLeave={e => { e.currentTarget.style.color=T.muted; e.currentTarget.style.borderColor=T.subtle; e.currentTarget.style.background="transparent"; }}>
                ✕ Clear filter
              </button>
            )}
          </div>
          <div style={{ position:"relative", flexShrink:0, width: isMobile ? "100%" : "auto" }}>
            <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:T.muted, pointerEvents:"none", lineHeight:1 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </span>
            <input className="ops-focus" type="text" placeholder="Search name, message…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputSx, paddingLeft:32, height:33, width: isMobile ? "100%" : 230, fontSize:12, borderRadius:99 }}/>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex:1, overflow:"auto", minHeight:0 }}>
          {loading ? (
            <div style={{ padding:"56px 20px", textAlign:"center", color:T.muted }}>
              <div style={{ width:32, height:32, borderRadius:"50%", border:`2px solid ${T.subtle}`, borderTopColor:T.gold, margin:"0 auto 14px", animation:"opsSpinner .8s linear infinite" }}/>
              <p style={{ margin:0, fontSize:13 }}>Loading tasks…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:"60px 20px", textAlign:"center" }}>
              <div style={{ width:48, height:48, borderRadius:12, background:T.goldDim, border:`1px solid ${T.goldBorder}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <svg width="20" height="20" viewBox="0 0 36 36" fill="none"><polygon points="18,4 32,18 18,32 4,18" fill="none" stroke="rgba(200,168,74,0.4)" strokeWidth="1.5"/></svg>
              </div>
              <p style={{ margin:0, fontSize:14, fontWeight:600, color:T.white, fontFamily:"'Cinzel',serif" }}>No Records Found</p>
              <p style={{ margin:"8px 0 0", fontSize:13, color:T.muted }}>Try adjusting your search or filter.</p>
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1060 }}>
              <thead style={{ position:"sticky", top:0, zIndex:1 }}>
                <tr style={{ borderBottom:`1px solid ${T.subtle}`, background:`${T.bg}ee` }}>
                  {COLS.map(h => (
                    <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:8.5, fontWeight:600, color:T.muted, letterSpacing:"0.14em", fontFamily:"'Cinzel',serif", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const creatorName = typeof c.createdBy === "object" ? c.createdBy?.username : null;
                  const isApproved  = c.action === "approve";

                  // `now` is always current thanks to the justFired fix above.
                  // isFutureScheduled is true only if schedule has NOT yet passed.
                  const isFutureScheduled = c.scheduleAt && new Date(c.scheduleAt).getTime() > now;

                  const isClosed = c.status==="cancel" || c.status==="done" || c.status==="not done" ||
                    c.action==="cancel" || Boolean(c.acknowledgement) || (isApproved && !isFutureScheduled);

                  // PM can update while: not closed, OR approved but schedule hasn't fired yet
                  const canAct = showActionBtn && (!isClosed || (isApproved && isFutureScheduled));

                  const ticketLabel = isApproved && isFutureScheduled  ? "Scheduled"
                    : isApproved && !c.acknowledgement                  ? "Sent to IT"
                    : c.status==="cancel" || c.action==="cancel"        ? "Cancelled"
                    : c.status==="not done"                             ? "Not Done"
                    : "Closed";

                  const ticketColor = isApproved && isFutureScheduled  ? T.purple
                    : isApproved && !c.acknowledgement                  ? T.teal
                    : c.status==="cancel" || c.action==="cancel"        ? T.red
                    : c.status==="not done"                             ? T.amber
                    : T.green;

                  return (
                    <tr key={c._id} className="ops-row"
                      style={{ borderBottom:`1px solid ${T.subtle}22`, background: i%2===1 ? `${T.bgCard}80` : "transparent" }}>

                      <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                        {creatorName ? (
                          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                            <div style={{ width:24, height:24, borderRadius:"50%", background:T.purpleBg, border:`1px solid ${T.purple}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:T.purple, fontFamily:"'Cinzel',serif", flexShrink:0 }}>
                              {initials(creatorName)}
                            </div>
                            <span style={{ fontSize:12, color:T.text }}>{creatorName}</span>
                          </div>
                        ) : <span style={{ fontSize:11, color:T.subtle, fontFamily:"'JetBrains Mono',monospace" }}>—</span>}
                      </td>

                      <td style={{ padding:"12px 16px", minWidth:160, maxWidth:260 }}>
                        <p style={{ margin:0, fontSize:12, color:T.text, lineHeight:1.55, wordBreak:"break-word", whiteSpace:"pre-wrap" }}>{c.message}</p>
                      </td>

                      <td style={{ padding:"12px 16px", minWidth:130, maxWidth:220 }}>
                        {c.pmMessage
                          ? <p style={{ margin:0, fontSize:12, color:T.muted, lineHeight:1.55, fontStyle:"italic", wordBreak:"break-word" }}>{c.pmMessage}</p>
                          : <span style={{ fontSize:11, color:T.subtle, fontFamily:"'JetBrains Mono',monospace" }}>—</span>}
                      </td>

                      <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                        {c.action ? <StatusBadge value={c.action} meta={ACTION_META}/> : <PendingBadge/>}
                      </td>

                      <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                        <span style={{ fontSize:11, color:T.muted, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(c.requestedAt)}</span>
                      </td>

                      <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                        {c.scheduleAt
                          ? <span style={{ fontSize:11, color:T.purple, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(c.scheduleAt)}</span>
                          : <span style={{ fontSize:11, color:T.subtle, fontFamily:"'JetBrains Mono',monospace" }}>—</span>}
                      </td>

                      <td style={{ padding:"12px 16px", minWidth:130, maxWidth:200 }}>
                        {c.itMessage
                          ? <span style={{ fontSize:11, color:T.teal, fontStyle:"italic", wordBreak:"break-word", display:"block" }}>{c.itMessage}</span>
                          : <span style={{ fontSize:11, color:T.subtle, fontFamily:"'JetBrains Mono',monospace" }}>—</span>}
                      </td>

                      <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                        {canAct ? (
                          <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"flex-start" }}>
                            <button className="ops-upd" onClick={() => onAction(c)}
                              style={{ padding:"4px 12px", borderRadius:99, background:T.amberBg, border:`1px solid ${T.amber}44`, color:T.amber, fontSize:9, fontWeight:700, letterSpacing:"0.1em", cursor:"pointer", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>
                              Update
                            </button>
                            {isApproved && isFutureScheduled && (
                              <span style={{ fontSize:8, color:T.purple, fontWeight:600, letterSpacing:"0.05em" }}>AWAITING SCHEDULE</span>
                            )}
                          </div>
                        ) : (
                          <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:9, letterSpacing:"0.1em", fontWeight:700, color:ticketColor, fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>
                            <span style={{ width:4, height:4, borderRadius:"50%", background:ticketColor, flexShrink:0 }}/>
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
          <div style={{ padding:"9px 18px", borderTop:`1px solid ${T.subtle}22`, display:"flex", justifyContent:"space-between", background:`${T.bg}99`, flexShrink:0 }}>
            <span style={{ fontSize:9, color:T.muted, fontFamily:"'JetBrains Mono',monospace" }}>{filtered.length} of {campaigns.length} tasks</span>
            <span style={{ fontSize:9, color:T.subtle, fontFamily:"'JetBrains Mono',monospace", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:4, height:4, borderRadius:"50%", background:T.green, animation:"opsPulse 2s infinite" }}/>
              Live updates active
            </span>
          </div>
        )}
      </div>
    </div>
  );
}