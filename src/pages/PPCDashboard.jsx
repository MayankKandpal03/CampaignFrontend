/**
 * PPCDashboard — premium redesign.
 * All logic, state, hooks, API calls, and socket handlers unchanged.
 * Only the JSX/style layer is updated.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import useAuthStore  from "../stores/useAuthStore.js";
import useNotifStore from "../stores/useNotificationStore.js";
import { useResponsive }            from "../hooks/useResponsive.js";
import { useCampaigns }             from "../hooks/useCampaigns.js";
import { useLogout }                from "../hooks/useLogout.js";
import { T, inputSx }              from "../constants/theme.js";
import { STATUS_META, ACTION_META } from "../constants/statusMeta.js";
import { FILTER_CARDS }             from "../constants/filterCards.js";
import { fmt, toLocalISO, localToUTC } from "../utils/formatters.js";
import OpsGlobalStyles  from "../components/common/OpsGlobalStyles.jsx";
import StatusBadge      from "../components/common/StatusBadge.jsx";
import PendingBadge     from "../components/common/PendingBadge.jsx";
import EmptyState       from "../components/common/EmptyState.jsx";
import GoldBtn          from "../components/common/GoldBtn.jsx";
import Field            from "../components/common/Field.jsx";
import DashboardSidebar from "../components/layout/DashboardSidebar.jsx";
import DashboardHeader  from "../components/layout/DashboardHeader.jsx";
import FilterCardsGrid  from "../components/campaigns/FilterCardsGrid.jsx";
import TableToolbar     from "../components/campaigns/TableToolbar.jsx";
import UpdateModal      from "../components/campaigns/UpdateModal.jsx";

const COLS = ["Message","Requested Time","Status","PM Action","Ticket State"];

// Shared table cell helper
const Th = ({ children }) => (
  <th style={{ padding:"10px 16px", textAlign:"left", fontSize:8.5, fontWeight:600, color:"#706658", letterSpacing:"0.14em", fontFamily:"'Cinzel',serif", textTransform:"uppercase", whiteSpace:"nowrap" }}>
    {children}
  </th>
);

export default function PPCDashboard() {
  const user            = useAuthStore(s => s.user);
  const storedTeamId    = useAuthStore(s => s.teamId);
  const addNotification = useNotifStore(s => s.addNotification);
  const handleLogout    = useLogout();
  const isMobile        = useResponsive();
  const { campaigns, getCampaign, createCampaign, updateCampaign } = useCampaigns({ onNotification: addNotification });

  const [loading,       setLoading]       = useState(true);
  const [pageError,     setPageError]     = useState("");
  const [activeSection, setActiveSection] = useState("campaigns");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [filtersOpen,   setFiltersOpen]   = useState(false);
  const [statusFilter,  setStatusFilter]  = useState(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [updateTarget,  setUpdateTarget]  = useState(null);
  const [createForm,    setCreateForm]    = useState({ message: "", requestedAt: toLocalISO(new Date()) });
  const [creating,      setCreating]      = useState(false);
  const [createError,   setCreateError]   = useState("");
  const [createOk,      setCreateOk]      = useState(false);

  useEffect(() => {
    (async () => {
      try   { await getCampaign(); }
      catch { setPageError("Failed to load campaigns. Please refresh."); }
      finally { setLoading(false); }
    })();
  }, [getCampaign]);

  const teamId = useMemo(() => {
    if (storedTeamId) return storedTeamId;
    const raw = campaigns[0]?.teamId;
    return (typeof raw === "object" ? raw?._id : raw) || null;
  }, [storedTeamId, campaigns]);

  const stats = useMemo(() => ({
    transfer:   campaigns.filter(c => c.status === "transfer").length,
    approve:    campaigns.filter(c => c.action === "approve").length,
    done:       campaigns.filter(c => c.status === "done").length,
    cancel:     campaigns.filter(c => c.status === "cancel").length,
    "not done": campaigns.filter(c => c.status === "not done").length,
  }), [campaigns]);

  const filtered = useMemo(() => {
    let list = [...campaigns];
    if (statusFilter) {
      list = statusFilter === "approve"
        ? list.filter(c => c.action === "approve")
        : list.filter(c => c.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.message?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [campaigns, statusFilter, searchQuery]);

  const goTo = section => {
    setActiveSection(section); setSidebarOpen(false);
    setCreateError(""); setCreateOk(false);
    if (section === "create") setCreateForm({ message: "", requestedAt: toLocalISO(new Date()) });
  };

  const handleFilterSelect = useCallback(id => {
    setStatusFilter(p => p === id ? null : id);
    if (isMobile) setFiltersOpen(false);
  }, [isMobile]);

const handleCreate = async (e) => {
  e.preventDefault();
  setCreateError(""); setCreateOk(false);
  if (!teamId)                    { setCreateError("Team not assigned. Contact your manager."); return; }
  if (!createForm.message.trim()) { setCreateError("Campaign message is required."); return; }
  setCreating(true);
  try {
    await createCampaign({
      message:     createForm.message.trim(),
      // FIX: convert datetime-local (local time) → UTC ISO before sending
      requestedAt: localToUTC(createForm.requestedAt),
      teamId,
    });
    setCreateForm({ message: "", requestedAt: toLocalISO(new Date()) });
    setCreateOk(true);
    setTimeout(() => { setActiveSection("campaigns"); setCreateOk(false); }, 1800);
  } catch (err) {
    setCreateError(err?.response?.data?.message || "Failed to create campaign.");
  } finally { setCreating(false); }
};
  const handleUpdate = useCallback(async (id, data) => {
    await updateCampaign(id, data);
  }, [updateCampaign]);

  const NAV = [
    { id: "campaigns", label: "My Campaigns", count: campaigns.length },
    { id: "create",    label: "Create Campaign" },
  ];

  const pad = isMobile ? "16px 14px" : "22px 28px";

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans',sans-serif" }}>
      <OpsGlobalStyles/>

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, zIndex:7999, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)" }}/>
      )}

      <DashboardSidebar brandSub="PPC PANEL" navItems={NAV} activeSection={activeSection}
        onNavigate={goTo} user={user} role="ppc" onLogout={handleLogout}
        isMobile={isMobile} open={sidebarOpen}/>

      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <DashboardHeader isMobile={isMobile}
          onMenuToggle={() => setSidebarOpen(v => !v)} sidebarOpen={sidebarOpen}
          title={activeSection === "create" ? "Create Campaign" : "My Campaigns"}
          subLabel="PPC PANEL"/>

        {pageError && (
          <div style={{ margin:"16px 28px 0", padding:"11px 16px", background:T.redBg, border:`1px solid ${T.red}44`, borderRadius:8, color:T.red, fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>
            {pageError}
          </div>
        )}

        {/* ── CAMPAIGNS ─────────────────────────────────────────────────────── */}
        {activeSection === "campaigns" && (
          <div style={{ padding:pad, flex:1 }}>
            {isMobile && (
              <button
                onClick={() => setFiltersOpen(v => !v)}
                style={{
                  display:"inline-flex", alignItems:"center", gap:8, marginBottom: filtersOpen ? 12 : 18,
                  padding:"7px 14px", borderRadius:99, cursor:"pointer",
                  background: filtersOpen ? T.goldDim : "transparent",
                  border:`1px solid ${filtersOpen ? T.gold : T.subtle}`,
                  color: filtersOpen ? T.gold : T.muted,
                  fontSize:9, letterSpacing:"0.14em", fontFamily:"'Cinzel',serif", textTransform:"uppercase",
                  transition:"all .18s ease",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                {statusFilter ? FILTER_CARDS.find(f => f.id === statusFilter)?.label : "Filter"} {filtersOpen ? "▲" : "▼"}
              </button>
            )}

            <FilterCardsGrid cards={FILTER_CARDS} stats={stats} activeId={statusFilter}
              onSelect={handleFilterSelect} isMobile={isMobile} visible={!isMobile || filtersOpen}/>

            <div style={{ background:T.bgCard, border:`1px solid ${T.subtle}`, borderRadius:10, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>
              <TableToolbar title="MY CAMPAIGNS" count={filtered.length}
                search={searchQuery} onSearch={setSearchQuery}
                activeFilter={statusFilter} onClearFilter={() => setStatusFilter(null)}
                isMobile={isMobile}/>

              {loading ? (
                <div style={{ padding:"56px 20px", textAlign:"center", color:T.muted }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", border:`2px solid ${T.subtle}`, borderTopColor:T.gold, margin:"0 auto 14px", animation:"opsSpinner .8s linear infinite" }}/>
                  <p style={{ margin:0, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Loading…</p>
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  headline="No Records Found"
                  sub={searchQuery || statusFilter ? "Try adjusting your search or filter." : "Create your first campaign to get started."}
                  action={!searchQuery && !statusFilter ? <GoldBtn onClick={() => goTo("create")} variant="outline">Create Campaign</GoldBtn> : null}/>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", minWidth:620 }}>
                    <thead>
                      <tr style={{ borderBottom:`1px solid ${T.subtle}`, background:`${T.bg}ee` }}>
                        {COLS.map(h => <Th key={h}>{h}</Th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, i) => {
                        const isApproved = c.action === "approve";
const isClosed = c.status === "cancel" || c.status === "done" || c.status === "not done" || c.action === "cancel" || Boolean(c.acknowledgement);
const nowMs = Date.now();
const scheduleReached = !c.scheduleAt || new Date(c.scheduleAt).getTime() <= nowMs;
const canUpdate = !isClosed && (c.status === "transfer" || (isApproved && !scheduleReached));
const ticketLabel = isApproved && scheduleReached && !c.acknowledgement ? "Sent to IT"
  : isApproved && !scheduleReached ? "Scheduled"
  : c.status === "cancel" || c.action === "cancel" ? "Cancelled"
  : c.status === "not done" ? "Not Done" : "Closed";
const ticketColor = isApproved && scheduleReached && !c.acknowledgement ? T.teal
  : isApproved && !scheduleReached ? T.purple
  : c.status === "cancel" || c.action === "cancel" ? T.red
  : c.status === "not done" ? T.amber : T.green;

                        return (
                          <tr key={c._id} className="ops-row"
                            style={{ borderBottom:`1px solid ${T.subtle}22`, background: i%2===1 ? `${T.bgCard}80` : "transparent" }}>
                            <td style={{ padding:"13px 16px", minWidth:200, maxWidth:340 }}>
                              <p style={{ margin:0, fontSize:12, color:T.text, lineHeight:1.6, wordBreak:"break-word", whiteSpace:"pre-wrap", fontFamily:"'DM Sans',sans-serif" }}>{c.message}</p>
                            </td>
                            <td style={{ padding:"13px 16px", whiteSpace:"nowrap" }}>
                              <span style={{ fontSize:11, color:T.muted, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(c.requestedAt)}</span>
                            </td>
                            <td style={{ padding:"13px 16px", whiteSpace:"nowrap" }}>
                              <StatusBadge value={c.status} meta={STATUS_META}/>
                            </td>
                            <td style={{ padding:"13px 16px", whiteSpace:"nowrap" }}>
                              {c.action ? <StatusBadge value={c.action} meta={ACTION_META}/> : <PendingBadge/>}
                            </td>
                            <td style={{ padding:"13px 16px", whiteSpace:"nowrap" }}>
                              {canUpdate ? (
                                <button className="ops-upd" onClick={() => setUpdateTarget(c)}
                                  style={{ padding:"4px 12px", borderRadius:99, background:T.amberBg, border:`1px solid ${T.amber}44`, color:T.amber, fontSize:9, fontWeight:700, letterSpacing:"0.1em", cursor:"pointer", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>
                                  Update
                                </button>
                              ) : (
                                <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:9, letterSpacing:"0.1em", fontWeight:700, color:ticketColor, fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>
                                  <span style={{ width:4, height:4, borderRadius:"50%", background:ticketColor }}/>
                                  {ticketLabel}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && filtered.length > 0 && (
                <div style={{ padding:"9px 18px", borderTop:`1px solid ${T.subtle}22`, display:"flex", justifyContent:"space-between", background:`${T.bg}99` }}>
                  <span style={{ fontSize:9, color:T.muted, fontFamily:"'JetBrains Mono',monospace" }}>{filtered.length} of {campaigns.length} campaigns</span>
                  <span style={{ fontSize:9, color:T.subtle, fontFamily:"'JetBrains Mono',monospace", display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ width:4, height:4, borderRadius:"50%", background:T.green, animation:"opsPulse 2s infinite" }}/>
                    Live updates active
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CREATE ─────────────────────────────────────────────────────────── */}
        {activeSection === "create" && (
          <div style={{ padding:pad, flex:1 }}>
            <div style={{ maxWidth:560 }}>
              {/* Team status */}
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", marginBottom:20, background:T.bgCard, border:`1px solid ${teamId ? T.subtle : T.red+"44"}`, borderRadius:8 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, background: teamId ? T.green : T.red, boxShadow: teamId ? `0 0 8px ${T.green}` : "none" }}/>
                <span style={{ fontSize:12, color: teamId ? T.muted : T.red, fontFamily:"'JetBrains Mono',monospace" }}>
                  {teamId ? "Team assigned ✓" : "No team assigned — contact your manager"}
                </span>
              </div>

              <div style={{ background:T.bgCard, border:`1px solid ${T.subtle}`, borderRadius:10, padding: isMobile ? "22px 18px" : "28px 28px 24px", boxShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>
                <p style={{ margin:"0 0 4px", fontSize:8, letterSpacing:"0.22em", color:"rgba(200,168,74,0.6)", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>New Request</p>
                <h2 style={{ margin:"0 0 22px", fontSize:18, fontWeight:600, color:T.white, fontFamily:"'Cinzel',serif", letterSpacing:"0.02em" }}>Create Campaign</h2>

                {createError && <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:18, background:T.redBg, border:`1px solid ${T.red}44`, color:T.red, fontSize:12 }}>{createError}</div>}
                {createOk    && <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:18, background:T.greenBg, border:`1px solid ${T.green}44`, color:T.green, fontSize:12, display:"flex", alignItems:"center", gap:8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Campaign submitted successfully
                </div>}

                <form onSubmit={handleCreate}>
                  <Field label="Message" hint="required">
                    <textarea className="ops-focus" value={createForm.message}
                      onChange={e => setCreateForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Describe the campaign request…" rows={4} required
                      style={{ ...inputSx, borderRadius:8, resize:"vertical", lineHeight:1.6 }}/>
                  </Field>
                  <Field label="Requested Date / Time" hint="defaults to now">
                    <input type="datetime-local" className="ops-focus" value={createForm.requestedAt}
                      onChange={e => setCreateForm(f => ({ ...f, requestedAt: e.target.value }))}
                      style={{ ...inputSx, borderRadius:8, colorScheme:"dark" }}/>
                  </Field>
                  <div style={{ borderTop:`1px solid ${T.subtle}`, paddingTop:20, marginTop:6 }}>
                    <GoldBtn type="submit" disabled={creating || !teamId} style={{ width:"100%", padding:"13px" }}>
                      {creating ? "Submitting…" : !teamId ? "No Team Assigned" : "Submit Campaign"}
                    </GoldBtn>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {updateTarget && <UpdateModal campaign={updateTarget} onClose={() => setUpdateTarget(null)} onSave={handleUpdate}/>}
    </div>
  );
}