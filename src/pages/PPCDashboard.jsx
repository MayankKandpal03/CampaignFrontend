/**
 * PPCDashboard — Nature-inspired light theme.
 * All business logic, state management, and API calls unchanged.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import useAuthStore  from "../stores/useAuthStore.js";
import useNotifStore from "../stores/useNotificationStore.js";
import { useResponsive }            from "../hooks/useResponsive.js";
import { useCampaigns }             from "../hooks/useCampaigns.js";
import { useLogout }                from "../hooks/useLogout.js";
import { T }              from "../constants/theme.js";
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

const COLS = ["Message", "Requested Time", "Status", "PM Action", "Ticket State"];

const Th = ({ children }) => (
  <th className="px-4 py-2.5 text-left text-[8.5px] font-semibold text-[#8a8475] tracking-[0.14em] font-['Fraunces',serif] uppercase whitespace-nowrap">
    {children}
  </th>
);

const INPUT_CLS =
  "ops-focus w-full box-border bg-[#faf8f5] border border-[#e8e5de] rounded-lg " +
  "text-[#2d2a24] text-[13px] px-[14px] py-[11px] outline-none " +
  "font-['DM_Sans',sans-serif] transition-[border-color,box-shadow] duration-200";

export default function PPCDashboard() {
  const user            = useAuthStore(s => s.user);
  const storedTeamId    = useAuthStore(s => s.teamId);
  const addNotification = useNotifStore(s => s.addNotification);
  const handleLogout    = useLogout();
  const isMobile        = useResponsive();
  const { campaigns, getCampaign, createCampaign, updateCampaign } = useCampaigns({ onNotification: addNotification });

  const [loading,       setLoading]       = useState(true);
  const [pageError,     setPageError]     = useState("");
  const [activeSection, setActiveSection] = useState("tasks");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [filtersOpen,   setFiltersOpen]   = useState(false);
  const [statusFilter,  setStatusFilter]  = useState(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [updateTarget,  setUpdateTarget]  = useState(null);
  const [createForm,    setCreateForm]    = useState({ message:"", requestedAt: toLocalISO(new Date()) });
  const [creating,      setCreating]      = useState(false);
  const [createError,   setCreateError]   = useState("");
  const [createOk,      setCreateOk]      = useState(false);

  const [now, setNow] = useState(Date.now());
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

  useEffect(() => {
    (async () => {
      try   { await getCampaign(); }
      catch { setPageError("Failed to load campaigns. Please refresh."); }
      finally { setLoading(false); }
    })();
  }, []); // eslint-disable-line

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
    if (section === "create") setCreateForm({ message:"", requestedAt: toLocalISO(new Date()) });
  };

  const handleFilterSelect = useCallback(id => {
    setStatusFilter(p => p === id ? null : id);
    if (isMobile) setFiltersOpen(false);
  }, [isMobile]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError(""); setCreateOk(false);
    if (!teamId)                    { setCreateError("Team not assigned. Contact your manager."); return; }
    if (!createForm.message.trim()) { setCreateError("Task message is required."); return; }
    setCreating(true);
    try {
      await createCampaign({ message: createForm.message.trim(), requestedAt: localToUTC(createForm.requestedAt), teamId });
      setCreateForm({ message:"", requestedAt: toLocalISO(new Date()) });
      setCreateOk(true);
      setTimeout(() => { setActiveSection("tasks"); setCreateOk(false); }, 1800);
    } catch (err) {
      setCreateError(err?.response?.data?.message || "Failed to create campaign.");
    } finally { setCreating(false); }
  };

  const handleUpdate = useCallback(async (id, data) => { await updateCampaign(id, data); }, [updateCampaign]);

  const NAV = [
    { id:"tasks", label:"My Tasks", count: campaigns.length },
    { id:"create", label:"Create Task" },
  ];

  const pad = isMobile ? "16px 14px" : "22px 28px";

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf8f4] text-[#2d2a24] font-['DM_Sans',sans-serif]">
      <OpsGlobalStyles/>

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-7999 bg-black/20 backdrop-blur-sm" />
      )}

      <DashboardSidebar
        brandSub="PPC PANEL" navItems={NAV} activeSection={activeSection}
        onNavigate={goTo} user={user} role="ppc" onLogout={handleLogout}
        isMobile={isMobile} open={sidebarOpen}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
        <DashboardHeader
          isMobile={isMobile}
          onMenuToggle={() => setSidebarOpen(v => !v)} sidebarOpen={sidebarOpen}
          title={activeSection === "create" ? "Create Task" : "My Tasks"}
          subLabel="PPC PANEL"
        />

        {pageError && (
          <div className="mx-7 mt-4 px-4 py-2.75 bg-[rgba(184,48,48,0.06)] border border-[rgba(184,48,48,0.15)] rounded-lg text-[#b83030] text-xs">
            {pageError}
          </div>
        )}

        {/* ── CAMPAIGNS ── */}
        {activeSection === "tasks" && (
          <div style={{ padding: pad }} className="flex-1 flex flex-col min-h-0">

            {isMobile && (
              <button
                onClick={() => setFiltersOpen(v => !v)}
                style={{
                  display:"inline-flex", alignItems:"center", gap:8,
                  marginBottom: filtersOpen ? 12 : 18, padding:"7px 14px",
                  borderRadius:99, cursor:"pointer",
                  background: filtersOpen ? T.goldDim : "transparent",
                  border:`1px solid ${filtersOpen ? T.gold : T.subtle}`,
                  color: filtersOpen ? T.gold : T.muted,
                  fontSize:9, letterSpacing:"0.14em",
                  fontFamily:"'Fraunces',serif", textTransform:"uppercase", transition:"all .18s ease",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                {statusFilter ? FILTER_CARDS.find(f => f.id === statusFilter)?.label : "Filter"} {filtersOpen ? "▲" : "▼"}
              </button>
            )}

            <FilterCardsGrid
              cards={FILTER_CARDS} stats={stats} activeId={statusFilter}
              onSelect={handleFilterSelect} isMobile={isMobile} visible={!isMobile || filtersOpen}
            />

            <div className="bg-white border border-[#e8e5de] rounded-[10px] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex-1 flex flex-col min-h-0">
              <TableToolbar
                title="MY TASKS" count={filtered.length} search={searchQuery} onSearch={setSearchQuery}
                activeFilter={statusFilter} onClearFilter={() => setStatusFilter(null)} isMobile={isMobile}
              />

              <div className="flex-1 overflow-auto min-h-0">
                {loading ? (
                  <div className="py-14 px-5 text-center text-[#8a8475]">
                    <div className="w-8 h-8 rounded-full border-2 border-[#e8e5de] border-t-[#2a6048] mx-auto mb-3.5 animate-[opsSpinner_0.8s_linear_infinite]" />
                    <p className="m-0 text-[13px]">Loading…</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <EmptyState
                    headline="No Records Found"
                    sub={searchQuery || statusFilter ? "Try adjusting your search or filter." : "Create your first campaign to get started."}
                    action={!searchQuery && !statusFilter ? <GoldBtn onClick={() => goTo("create")} variant="outline">Create Task</GoldBtn> : null}
                  />
                ) : (
                  <table className="w-full border-collapse min-w-155">
                    <thead className="sticky top-0 z-1">
                      <tr style={{ borderBottom:"1px solid #e8e5de", background:"#f8f7f4" }}>
                        {COLS.map(h => <Th key={h}>{h}</Th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, i) => {
                        const isApproved      = c.action === "approve";
                        const scheduleReached = !c.scheduleAt || new Date(c.scheduleAt).getTime() <= now;
                        const isClosed        = c.status==="cancel" || c.status==="done" || c.status==="not done" || c.action==="cancel" || Boolean(c.acknowledgement) || (isApproved && scheduleReached);
                        const canUpdate       = !isClosed && (c.status === "transfer" || (isApproved && !scheduleReached));

                        const ticketLabel = isApproved && scheduleReached && !c.acknowledgement ? "Sent to IT"
                          : isApproved && !scheduleReached                                       ? "Scheduled"
                          : c.status==="cancel" || c.action==="cancel"                           ? "Cancelled"
                          : c.status==="not done"                                                ? "Not Done"
                          : "Closed";

                        const ticketColor = isApproved && scheduleReached && !c.acknowledgement ? T.teal
                          : isApproved && !scheduleReached                                       ? T.purple
                          : c.status==="cancel" || c.action==="cancel"                           ? T.red
                          : c.status==="not done"                                                ? T.amber
                          : T.green;

                        return (
                          <tr
                            key={c._id}
                            className="ops-row"
                            style={{ borderBottom:"1px solid #e8e5de", background: i%2===1 ? "#f8f7f4" : "transparent" }}
                          >
                            <td className="p-[13px_16px] min-w-50 max-w-85">
                              <p className="m-0 text-xs text-[#2d2a24] leading-[1.6] wrap-break-word whitespace-pre-wrap">
                                {c.message}
                              </p>
                            </td>
                            <td className="p-[13px_16px] whitespace-nowrap">
                              <span className="text-[11px] text-[#8a8475] font-['JetBrains_Mono',monospace]">
                                {fmt(c.requestedAt)}
                              </span>
                            </td>
                            <td className="p-[13px_16px] whitespace-nowrap">
                              <StatusBadge value={c.status} meta={STATUS_META}/>
                            </td>
                            <td className="p-[13px_16px] whitespace-nowrap">
                              {c.action ? <StatusBadge value={c.action} meta={ACTION_META}/> : <PendingBadge/>}
                            </td>
                            <td className="p-[13px_16px] whitespace-nowrap">
                              {canUpdate ? (
                                <button
                                  className="ops-upd px-3 py-1 rounded-full bg-[rgba(143,66,12,0.08)] border border-[rgba(143,66,12,0.18)] text-[#8f420c] text-[9px] font-bold tracking-widest cursor-pointer font-['Fraunces',serif] uppercase"
                                  onClick={() => setUpdateTarget(c)}
                                >
                                  Update
                                </button>
                              ) : (
                                <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:9, letterSpacing:"0.1em", fontWeight:700, color:ticketColor, fontFamily:"'Fraunces',serif", textTransform:"uppercase" }}>
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
                )}
              </div>

              {!loading && filtered.length > 0 && (
                <div className="px-4.5 py-2.25 border-t border-[#e8e5de] flex justify-between bg-[#f8f7f4] shrink-0">
                  <span className="text-[9px] text-[#8a8475] font-['JetBrains_Mono',monospace]">
                    {filtered.length} of {campaigns.length} tasks
                  </span>
                  <span className="text-[9px] text-[#8a8475] font-['JetBrains_Mono',monospace] flex items-center gap-1.25">
                    <span className="w-1 h-1 rounded-full bg-[#2a6048] animate-[opsPulse_2s_infinite]"/>
                    Live updates active
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CREATE ── */}
        {activeSection === "create" && (
          <div style={{ padding: pad }} className="flex-1">
            <div className="max-w-140">
              {/* Team status indicator */}
              <div className={`flex items-center gap-2.5 p-[10px_16px] mb-5 bg-white rounded-lg border ${teamId ? "border-[#e8e5de]" : "border-[rgba(184,48,48,0.2)]"}`}>
                <span style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, background: teamId ? T.green : T.red, boxShadow: teamId ? `0 0 8px ${T.green}` : "none" }}/>
                <span className={`text-xs font-['JetBrains_Mono',monospace] ${teamId ? "text-[#8a8475]" : "text-[#b83030]"}`}>
                  {teamId ? "Team assigned ✓" : "No team assigned — contact your manager"}
                </span>
              </div>

              {/* Form card */}
              <div
                className="bg-white border border-[#e8e5de] rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                style={{ padding: isMobile ? "22px 18px" : "28px 28px 24px" }}
              >
                <p className="m-0 mb-1 text-[8px] tracking-[0.22em] text-[rgba(42,96,72,0.6)] font-['Fraunces',serif] uppercase">
                  New Request
                </p>
                <h2 className="m-0 mb-5.5 text-lg font-semibold text-[#1a1810] font-['Fraunces',serif]">
                  Create Task
                </h2>

                {createError && (
                  <div className="px-3.5 py-2.5 rounded-lg mb-4.5 bg-[rgba(184,48,48,0.06)] border border-[rgba(184,48,48,0.15)] text-[#b83030] text-xs">
                    {createError}
                  </div>
                )}
                {createOk && (
                  <div className="px-3.5 py-2.5 rounded-lg mb-4.5 bg-[rgba(42,96,72,0.08)] border border-[rgba(42,96,72,0.15)] text-[#2a6048] text-xs flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Task submitted successfully
                  </div>
                )}

                <form onSubmit={handleCreate}>
                  <Field label="Message" hint="required">
                    <textarea
                      className={`${INPUT_CLS} resize-y leading-relaxed`}
                      value={createForm.message}
                      onChange={e => setCreateForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Describe the task request…"
                      rows={4}
                      required
                    />
                  </Field>
                  <Field label="Requested Date / Time" hint="defaults to now">
                    <input
                      type="datetime-local"
                      className={INPUT_CLS}
                      style={{ colorScheme: "light" }}
                      value={createForm.requestedAt}
                      onChange={e => setCreateForm(f => ({ ...f, requestedAt: e.target.value }))}
                    />
                  </Field>
                  <div className="border-t border-[#e8e5de] pt-5 mt-1.5">
                    <GoldBtn type="submit" disabled={creating || !teamId} style={{ width:"100%", padding:"13px" }}>
                      {creating ? "Submitting…" : !teamId ? "No Team Assigned" : "Submit Task"}
                    </GoldBtn>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {updateTarget && (
        <UpdateModal campaign={updateTarget} onClose={() => setUpdateTarget(null)} onSave={handleUpdate}/>
      )}
    </div>
  );
}