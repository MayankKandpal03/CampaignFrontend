/**
 * PPCDashboard — all issues fixed.
 *
 * Columns: Message | Requested Time | Status | PM Action | Ticket State
 * - Timestamp removed (issue #9)
 * - TeamId field removed (issue #1) — uses auth store
 * - Local addNotification calls removed (issue #4) — socket-only
 * - Double campaign prevented in useCampaigns hook (issue #3)
 * - FIX: requestedAt defaults to current time on create form
 * - FIX: 24-hour time display via formatters
 * - FIX: Ticket state correctly shows NOT DONE / CANCELLED / CLOSED
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
import { fmt, toLocalISO }          from "../utils/formatters.js";

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

const COLS = ["MESSAGE", "REQUESTED TIME", "STATUS", "PM ACTION", "TICKET STATE"];

export default function PPCDashboard() {
  const user            = useAuthStore(s => s.user);
  const storedTeamId    = useAuthStore(s => s.teamId);
  const addNotification = useNotifStore(s => s.addNotification);
  const handleLogout    = useLogout();
  const isMobile        = useResponsive();

  const { campaigns, getCampaign, createCampaign, updateCampaign } = useCampaigns({
    onNotification: addNotification,
  });

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
  }, [getCampaign]); // eslint-disable-line

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
    if (section === "create") {
      setCreateForm({ message: "", requestedAt: toLocalISO(new Date()) });
    }
  };

  const handleFilterSelect = useCallback(id => {
    setStatusFilter(p => p === id ? null : id);
    if (isMobile) setFiltersOpen(false);
  }, [isMobile]);

  const handleCreate = useCallback(async e => {
    e.preventDefault();
    setCreateError(""); setCreateOk(false);
    if (!teamId)                    { setCreateError("Team not assigned. Contact your manager."); return; }
    if (!createForm.message.trim()) { setCreateError("Campaign message is required."); return; }
    setCreating(true);
    try {
      await createCampaign({
        message:     createForm.message.trim(),
        requestedAt: createForm.requestedAt || undefined,
        teamId,
      });
      setCreateForm({ message: "", requestedAt: toLocalISO(new Date()) });
      setCreateOk(true);
      setTimeout(() => { setActiveSection("campaigns"); setCreateOk(false); }, 1800);
    } catch (err) {
      setCreateError(err?.response?.data?.message || "Failed to create campaign.");
    } finally { setCreating(false); }
  }, [teamId, createForm, createCampaign]);

  const handleUpdate = useCallback(async (id, data) => {
    await updateCampaign(id, data);
  }, [updateCampaign]);

  const NAV = [
    { id: "campaigns", label: "My Campaigns"    },
    { id: "create",    label: "Create Campaign" },
  ];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans',sans-serif" }}>
      <OpsGlobalStyles />

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:"fixed", inset:0, zIndex:7999, background:"rgba(0,0,0,0.72)" }} />
      )}

      <DashboardSidebar brandSub="PPC PANEL" navItems={NAV} activeSection={activeSection}
        onNavigate={goTo} user={user} role="ppc" onLogout={handleLogout}
        isMobile={isMobile} open={sidebarOpen} />

      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <DashboardHeader isMobile={isMobile}
          onMenuToggle={() => setSidebarOpen(v => !v)} sidebarOpen={sidebarOpen}
          title={activeSection === "create" ? "Create Campaign" : "My Campaigns"}
          subLabel="— ADMIN PANEL" />

        {pageError && (
          <div style={{ margin:"16px 28px 0", padding:"10px 14px", background:T.redBg, border:`1px solid ${T.red}44`, borderRadius:3, color:T.red, fontSize:12 }}>{pageError}</div>
        )}

        {/* ── CAMPAIGNS ─────────────────────────────────────────────────── */}
        {activeSection === "campaigns" && (
          <div style={{ padding: isMobile ? "16px 14px" : "22px 28px", flex:1 }}>

            {isMobile && (
              <button onClick={() => setFiltersOpen(v => !v)}
                style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom: filtersOpen ? 12 : 20, padding:"7px 13px", borderRadius:3, cursor:"pointer", background: filtersOpen ? T.goldDim : "transparent", border:`1px solid ${filtersOpen ? T.gold : T.subtle}`, color: filtersOpen ? T.gold : T.muted, fontSize:9, letterSpacing:"0.16em", fontFamily:"'Cinzel',serif" }}>
                ◈ {statusFilter ? FILTER_CARDS.find(f => f.id === statusFilter)?.label.toUpperCase() : "FILTER"} {filtersOpen ? "▲" : "▼"}
              </button>
            )}

            <FilterCardsGrid cards={FILTER_CARDS} stats={stats} activeId={statusFilter}
              onSelect={handleFilterSelect} isMobile={isMobile} visible={!isMobile || filtersOpen} />

            <div style={{ background:T.bgCard, border:`1px solid ${T.goldBorder}`, borderRadius:4, overflow:"hidden" }}>
              <TableToolbar title="MY CAMPAIGNS" count={filtered.length}
                search={searchQuery} onSearch={setSearchQuery}
                activeFilter={statusFilter} onClearFilter={() => setStatusFilter(null)}
                isMobile={isMobile} />

              {loading ? (
                <div style={{ padding:"52px 20px", textAlign:"center", color:T.muted, fontSize:13 }}>
                  <div style={{ marginBottom:10, color:T.gold, fontSize:22 }}>◈</div>Loading…
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  headline="No Records Found"
                  sub={searchQuery || statusFilter ? "Try adjusting your search or filter." : "Create your first campaign to get started."}
                  action={!searchQuery && !statusFilter ? <GoldBtn onClick={() => goTo("create")} variant="outline">CREATE CAMPAIGN</GoldBtn> : null} />
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", minWidth:620 }}>
                    <thead>
                      <tr style={{ borderBottom:`1px solid ${T.subtle}`, background:`${T.bg}dd` }}>
                        {COLS.map(h => (
                          <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:9, fontWeight:600, color:T.gold, letterSpacing:"0.16em", fontFamily:"'Cinzel',serif", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, i) => (
                        <tr key={c._id} className="ops-row"
                          style={{ borderBottom:`1px solid ${T.subtle}22`, background: i%2===1 ? `${T.bgCard}88` : "transparent" }}>

                          {/* MESSAGE */}
                          <td style={{ padding:"12px 16px", minWidth:200, maxWidth:320 }}>
                            <p style={{ margin:0, fontSize:12, color:T.text, lineHeight:1.55, wordBreak:"break-word", whiteSpace:"pre-wrap" }}>{c.message}</p>
                          </td>

                          {/* REQUESTED TIME */}
                          <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                            <span style={{ fontSize:11, color:T.muted, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(c.requestedAt)}</span>
                          </td>

                          {/* STATUS */}
                          <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                            <StatusBadge value={c.status} meta={STATUS_META} />
                          </td>

                          {/* PM ACTION */}
                          <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                            {c.action ? <StatusBadge value={c.action} meta={ACTION_META} /> : <PendingBadge />}
                          </td>

                          {/* TICKET STATE */}
                          <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                            {c.status === "transfer"
                              ? <button className="ops-upd" onClick={() => setUpdateTarget(c)}
                                  style={{ padding:"4px 12px", borderRadius:2, background:T.amberBg, border:`1px solid ${T.amber}44`, color:T.amber, fontSize:9, fontWeight:700, letterSpacing:"0.12em", cursor:"pointer", fontFamily:"'Cinzel',serif" }}>
                                  UPDATE
                                </button>
                              : <span style={{
                                  fontSize:9, letterSpacing:"0.12em", fontWeight:700,
                                  color: c.status === "cancel"   ? T.red
                                       : c.status === "not done" ? T.amber
                                       : T.green,
                                  fontFamily:"'Cinzel',serif"
                                }}>
                                  {c.status === "cancel"    ? "CANCELLED"
                                   : c.status === "not done" ? "NOT DONE"
                                   : "CLOSED"}
                                </span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && filtered.length > 0 && (
                <div style={{ padding:"9px 18px", borderTop:`1px solid ${T.subtle}22`, display:"flex", justifyContent:"space-between", background:`${T.bg}aa` }}>
                  <span style={{ fontSize:9, color:T.muted, fontFamily:"'JetBrains Mono',monospace" }}>{filtered.length} of {campaigns.length} campaigns</span>
                  <span style={{ fontSize:9, color:T.subtle, fontFamily:"'JetBrains Mono',monospace" }}>LIVE UPDATES ACTIVE</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CREATE ────────────────────────────────────────────────────── */}
        {activeSection === "create" && (
          <div style={{ padding: isMobile ? "16px 14px" : "22px 28px", flex:1 }}>
            <div style={{ maxWidth:560 }}>
              <div style={{ padding:"14px 18px", marginBottom:22, border:`1px solid ${T.goldBorder}`, borderRadius:4, background:T.bgCard }}>
                <p style={{ margin:0, fontSize:12, color:T.muted, lineHeight:1.6 }}>
                  Fill in the details below. The Process Manager will review your request.
                </p>
              </div>

              <div style={{ background:T.bgCard, border:`1px solid ${T.goldBorder}`, borderRadius:4, padding: isMobile ? "22px 18px" : "28px 26px 24px" }}>
                <h2 style={{ margin:"0 0 22px", fontSize:15, fontWeight:600, color:T.white, fontFamily:"'Cinzel',serif", letterSpacing:"0.08em" }}>Create Campaign</h2>

                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", background:T.bgInput, border:`1px solid ${teamId ? T.subtle : `${T.red}44`}`, borderRadius:3, marginBottom:20 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background: teamId ? T.green : T.red, flexShrink:0 }} />
                  <span style={{ fontSize:11, color: teamId ? T.muted : T.red, fontFamily:"'JetBrains Mono',monospace" }}>
                    {teamId ? "Team assigned ✓" : "No team assigned — contact your manager"}
                  </span>
                </div>

                {createError && <div style={{ padding:"10px 14px", borderRadius:3, marginBottom:18, background:T.redBg, border:`1px solid ${T.red}44`, color:T.red, fontSize:12 }}>{createError}</div>}
                {createOk    && <div style={{ padding:"10px 14px", borderRadius:3, marginBottom:18, background:T.greenBg, border:`1px solid ${T.green}44`, color:T.green, fontSize:11, fontFamily:"'Cinzel',serif", letterSpacing:"0.08em" }}>✓ CAMPAIGN SUBMITTED</div>}

                <form onSubmit={handleCreate}>
                  <Field label="MESSAGE" hint="required">
                    <textarea className="ops-focus" value={createForm.message}
                      onChange={e => setCreateForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Describe the campaign request…"
                      rows={4} required
                      style={{ ...inputSx, resize:"vertical", lineHeight:1.6 }} />
                  </Field>

                  <Field label="REQUESTED DATE / TIME" hint="defaults to now — change if needed">
                    <input type="datetime-local" className="ops-focus"
                      value={createForm.requestedAt}
                      onChange={e => setCreateForm(f => ({ ...f, requestedAt: e.target.value }))}
                      style={{ ...inputSx, colorScheme:"dark" }} />
                  </Field>

                  <div style={{ borderTop:`1px solid ${T.subtle}`, paddingTop:20, marginTop:6 }}>
                    <GoldBtn type="submit" disabled={creating || !teamId} style={{ width:"100%", padding:"13px" }}>
                      {creating ? "SUBMITTING…" : !teamId ? "NO TEAM ASSIGNED" : "SUBMIT CAMPAIGN"}
                    </GoldBtn>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {updateTarget && (
        <UpdateModal campaign={updateTarget} onClose={() => setUpdateTarget(null)} onSave={handleUpdate} />
      )}
    </div>
  );
}