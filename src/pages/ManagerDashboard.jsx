/**
 * ManagerDashboard — Tailwind CSS refactor.
 * Static layout/color/spacing → Tailwind arbitrary values.
 * Inline style kept only for dynamic/runtime values.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import useAuthStore  from "../stores/useAuthStore.js";
import useNotifStore from "../stores/useNotificationStore.js";
import { useResponsive } from "../hooks/useResponsive.js";
import { useSocket }     from "../hooks/useSocket.js";
import { useLogout }     from "../hooks/useLogout.js";
import { useTeam }       from "../hooks/useTeam.js";
import { T, inputSx }              from "../constants/theme.js";
import { STATUS_META, ACTION_META } from "../constants/statusMeta.js";
import { FILTER_CARDS }             from "../constants/filterCards.js";
import { fmt, initials, toLocalISO, localToUTC } from "../utils/formatters.js";
import { fetchCampaigns, createCampaign as createCampaignService, updateCampaign as updateCampaignService } from "../services/campaignService.js";
import { createUser, deleteUser } from "../services/userService.js";
import OpsGlobalStyles  from "../components/common/OpsGlobalStyles.jsx";
import StatusBadge      from "../components/common/StatusBadge.jsx";
import PendingBadge     from "../components/common/PendingBadge.jsx";
import EmptyState       from "../components/common/EmptyState.jsx";
import GoldBtn          from "../components/common/GoldBtn.jsx";
import Field            from "../components/common/Field.jsx";
import DashboardSidebar from "../components/layout/DashboardSidebar.jsx";
import DashboardHeader  from "../components/layout/DashboardHeader.jsx";
import TeamChip         from "../components/layout/TeamChip.jsx";
import FilterCardsGrid  from "../components/campaigns/FilterCardsGrid.jsx";
import TableToolbar     from "../components/campaigns/TableToolbar.jsx";
import UpdateModal      from "../components/campaigns/UpdateModal.jsx";
import DeleteUserModal  from "../components/users/DeleteUserModal.jsx";
import UserCard         from "../components/users/UserCard.jsx";

const COLS = ["Created By","Message","Requested Time","Status","PM Action","Ticket State"];

const Th = ({ children }) => (
  <th className="px-4 py-2.5 text-left text-[8.5px] font-semibold text-[#706658] tracking-[0.14em] font-['Cinzel',serif] uppercase whitespace-nowrap">
    {children}
  </th>
);

// Shared input class — ensures text is always visible (bug fix for black-on-black)
const INPUT_CLS =
  "ops-focus w-full box-border bg-[#0a0908] border border-[#2e2c22] rounded-lg " +
  "text-[#e8ddc8] text-[13px] px-[14px] py-[11px] outline-none " +
  "font-['DM_Sans',sans-serif] transition-[border-color,box-shadow] duration-200";

export default function ManagerDashboard() {
  const user            = useAuthStore(s => s.user);
  const addNotification = useNotifStore(s => s.addNotification);
  const handleLogout    = useLogout();
  const isMobile        = useResponsive();
  const { teamInfo, teamLoading, loadTeamInfo } = useTeam();

  const [campaigns,     setCampaigns]     = useState([]);
  const [camLoading,    setCamLoading]    = useState(true);
  const [pageError,     setPageError]     = useState("");
  const [activeSection, setActiveSection] = useState("tasks");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [updateTarget,  setUpdateTarget]  = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [statusFilter,  setStatusFilter]  = useState(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [createForm,    setCreateForm]    = useState({ message:"", requestedAt: toLocalISO(new Date()) });
  const [creating,      setCreating]      = useState(false);
  const [createError,   setCreateError]   = useState("");
  const [createOk,      setCreateOk]      = useState(false);
  const [userForm,      setUserForm]      = useState({ username:"", email:"", password:"" });
  const [creatingUser,  setCreatingUser]  = useState(false);
  const [userError,     setUserError]     = useState("");
  const [userOk,        setUserOk]        = useState(false);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const currentReal = Date.now();
    const justFired = campaigns.some(c =>
      c.scheduleAt &&
      new Date(c.scheduleAt).getTime() > now &&
      new Date(c.scheduleAt).getTime() <= currentReal
    );
    if (justFired) { setNow(currentReal); return; }
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

  useSocket({
    "campaign:created": c => {
      setCampaigns(p => p.some(x => x._id===c._id) ? p : [c,...p]);
      addNotification(`Campaign created by ${c.performerName || "someone"}`);
    },
    "campaign:updated": c => {
      setCampaigns(p => p.map(x => x._id===c._id ? c : x));
      addNotification(c.status==="cancel"||c.action==="cancel"
        ? `Campaign cancelled by ${c.performerName || "someone"}`
        : `Campaign updated by ${c.performerName || "someone"}`);
    },
    "campaign:it_queued": c => {
      setCampaigns(p => p.map(x => x._id===c._id ? c : x));
      addNotification(`Campaign approved by ${c.performerName || "PM"} — sent to IT`);
    },
    "campaign:schedule_fired": c => {
      setCampaigns(p => p.map(x => x._id===c._id ? c : x));
    },
    "campaign:it_ack": c => {
      setCampaigns(p => p.map(x => x._id===c._id ? c : x));
      addNotification(c.acknowledgement==="done"
        ? `${c.performerName || "IT"} completed campaign`
        : `${c.performerName || "IT"} could not complete campaign`);
    },
    "campaign:deleted": d => setCampaigns(p => p.filter(x => x._id !== d._id)),
  });

  useEffect(() => {
    (async () => {
      try {
        const [data] = await Promise.all([fetchCampaigns(), loadTeamInfo()]);
        setCampaigns(data);
      } catch { setPageError("Failed to load data. Please refresh."); }
      finally { setCamLoading(false); }
    })();
  }, []); // eslint-disable-line

  const teamId = useMemo(() => {
    if (teamInfo?._id) return teamInfo._id;
    const raw = campaigns[0]?.teamId;
    return (typeof raw === "object" ? raw?._id : raw) || null;
  }, [teamInfo, campaigns]);

  const ppcMembers = useMemo(() => teamInfo?.members?.filter(m => m.role === "ppc") ?? [], [teamInfo]);

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
      list = list.filter(c =>
        c.message?.toLowerCase().includes(q) ||
        (typeof c.createdBy === "object" ? c.createdBy?.username : "")?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [campaigns, statusFilter, searchQuery]);

  const goTo = section => {
    setActiveSection(section); setSidebarOpen(false);
    setCreateError(""); setCreateOk(false); setUserError(""); setUserOk(false);
    if (section === "create") setCreateForm({ message:"", requestedAt: toLocalISO(new Date()) });
  };

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    setCreateError(""); setCreateOk(false);
    if (!teamId)                    { setCreateError("Team not found. Please wait or refresh."); return; }
    if (!createForm.message.trim()) { setCreateError("Task message is required."); return; }
    setCreating(true);
    try {
      const newC = await createCampaignService({ message: createForm.message.trim(), requestedAt: localToUTC(createForm.requestedAt) || undefined, teamId });
      if (newC) setCampaigns(p => p.some(x => x._id===newC._id) ? p : [newC,...p]);
      setCreateForm({ message:"", requestedAt: toLocalISO(new Date()) });
      setCreateOk(true);
      setTimeout(() => { setActiveSection("tasks"); setCreateOk(false); }, 1800);
    } catch (err) {
      setCreateError(err?.response?.data?.message || "Failed to create campaign.");
    } finally { setCreating(false); }
  }, [teamId, createForm]);

  const handleUpdate = useCallback(async (campaignId, data) => {
    const updated = await updateCampaignService(campaignId, data);
    if (updated) setCampaigns(p => p.map(c => c._id===updated._id ? updated : c));
  }, []);

  const handleCreateUser = useCallback(async (e) => {
    e.preventDefault();
    setUserError(""); setUserOk(false);
    if (!userForm.username||!userForm.email||!userForm.password) { setUserError("All fields are required."); return; }
    setCreatingUser(true);
    try {
      await createUser({ ...userForm, role:"ppc" });
      setUserForm({ username:"", email:"", password:"" });
      setUserOk(true);
      await loadTeamInfo();
      setTimeout(() => setUserOk(false), 3000);
    } catch (err) {
      setUserError(err?.response?.data?.message || "Failed to create user.");
    } finally { setCreatingUser(false); }
  }, [userForm, loadTeamInfo]);

  const handleDeleteUser = useCallback(async id => {
    await deleteUser(id);
    await loadTeamInfo();
  }, [loadTeamInfo]);

  const NAV = [
    { id:"tasks",  label: "Team Tasks",    count: campaigns.length },
    { id:"create", label: "Create Task" },
    { id:"team",   label: "Team Members",  count: ppcMembers.length },
  ];

  const pad = isMobile ? "16px 14px" : "22px 28px";

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0b08] text-[#e8ddc8] font-['DM_Sans',sans-serif]">
      <OpsGlobalStyles/>
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-7999 bg-black/75 backdrop-blur-sm"/>
      )}

      <DashboardSidebar
        brandSub="MANAGER PANEL" navItems={NAV} activeSection={activeSection}
        onNavigate={goTo} user={user} role="manager" onLogout={handleLogout}
        isMobile={isMobile} open={sidebarOpen}
        extra={<TeamChip teamInfo={teamInfo} memberCount={ppcMembers.length}/>}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
        <DashboardHeader
          isMobile={isMobile}
          onMenuToggle={() => setSidebarOpen(v => !v)} sidebarOpen={sidebarOpen}
          title={{ tasks:"Team Campaigns", create:"Create Task", team:"Team Members" }[activeSection] || "Dashboard"}
          subLabel="MANAGER PANEL"
        />

        {pageError && (
          <div className="mx-7 mt-4 px-4 py-2.75 bg-[rgba(224,82,82,0.12)] border border-[#e0525244] rounded-lg text-[#e05252] text-xs">
            {pageError}
          </div>
        )}

        {/* ── CAMPAIGNS ── */}
        {activeSection === "tasks" && (
          <div className={`${isMobile ? "px-3.5 py-4" : "px-7 py-5.5"} flex-1 flex flex-col min-h-0`}>
            <FilterCardsGrid
              cards={FILTER_CARDS} stats={stats} activeId={statusFilter}
              onSelect={id => setStatusFilter(p => p===id ? null : id)} isMobile={isMobile}
            />

            <div className="bg-[#141310] border border-[#2e2c22] rounded-[10px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.3)] flex-1 flex flex-col min-h-0">
              <TableToolbar
                title="TEAM TASKS" count={filtered.length} search={searchQuery} onSearch={setSearchQuery}
                activeFilter={statusFilter} onClearFilter={() => setStatusFilter(null)} isMobile={isMobile}
              />

              <div className="flex-1 overflow-auto min-h-0">
                {camLoading ? (
                  <div className="py-14 px-5 text-center text-[#7a7060]">
                    <div className="w-8 h-8 rounded-full border-2 border-[#2e2c22] border-t-[#c9a42a] mx-auto mb-3.5 animate-[opsSpinner_0.8s_linear_infinite]"/>
                    <p className="m-0 text-[13px]">Loading…</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <EmptyState
                    headline="No Records Found"
                    sub={searchQuery || statusFilter ? "Adjust search or filter." : "No team campaigns yet."}
                    action={!searchQuery && !statusFilter ? <GoldBtn variant="outline" onClick={() => goTo("create")}>Create Task</GoldBtn> : null}
                  />
                ) : (
                  <table className="w-full border-collapse min-w-190">
                    <thead className="sticky top-0 z-1">
                      <tr className="border-b border-[#2e2c2222] bg-[#0c0b08ee] sticky-header-row">
                        {COLS.map(h => <Th key={h}>{h}</Th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, i) => {
                        const creatorName   = typeof c.createdBy === "object" ? c.createdBy?.username : null;
                        const creatorId     = typeof c.createdBy === "object" ? c.createdBy?._id : c.createdBy;
                        const isOwn         = !teamInfo?.members?.find(m => String(m._id) === String(creatorId));
                        const isApproved    = c.action === "approve";
                        const scheduleReached = !c.scheduleAt || new Date(c.scheduleAt).getTime() <= now;
                        const isClosed      = c.status==="cancel"||c.status==="done"||c.status==="not done"||c.action==="cancel"||Boolean(c.acknowledgement)||(isApproved && scheduleReached);
                        const canUpdate     = !isClosed && (c.status==="transfer" || (isApproved && !scheduleReached));

                        const ticketLabel = isApproved && scheduleReached && !c.acknowledgement ? "Sent to IT"
                          : isApproved && !scheduleReached ? "Scheduled"
                          : c.status==="cancel"||c.action==="cancel" ? "Cancelled"
                          : c.status==="not done" ? "Not Done"
                          : "Closed";

                        const ticketColor = isApproved && scheduleReached && !c.acknowledgement ? T.teal
                          : isApproved && !scheduleReached ? T.purple
                          : c.status==="cancel"||c.action==="cancel" ? T.red
                          : c.status==="not done" ? T.amber
                          : T.green;

                        return (
                          <tr
                            key={c._id}
                            className={`ops-row border-b border-[rgba(46,44,34,0.13)] ${i%2===1 ? "bg-[rgba(20,19,16,0.5)]" : "bg-transparent"}`}
                          >
                            <td className="p-[12px_16px] whitespace-nowrap">
                              <div className="flex items-center gap-1.75">
                                <div
                                  className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold font-['Cinzel',serif] ${isOwn ? "bg-[rgba(201,164,42,0.13)] border border-[rgba(201,164,42,0.27)] text-[#c9a42a]" : "bg-[rgba(167,139,250,0.11)] border border-[rgba(167,139,250,0.27)] text-[#a78bfa]"}`}
                                >
                                  {initials(creatorName || user || "M")}
                                </div>
                                <span className={`text-xs ${isOwn ? "text-[#c9a42a]" : "text-[#e8ddc8]"}`}>
                                  {creatorName || user || "—"}
                                </span>
                              </div>
                            </td>
                            <td className="p-[12px_16px] min-w-40 max-w-70">
                              <p className="m-0 text-xs text-[#e8ddc8] leading-[1.55] wrap-break-word whitespace-pre-wrap">
                                {c.message}
                              </p>
                            </td>
                            <td className="p-[12px_16px] whitespace-nowrap">
                              <span className="text-[11px] text-[#7a7060] font-['JetBrains_Mono',monospace]">
                                {fmt(c.requestedAt)}
                              </span>
                            </td>
                            <td className="p-[12px_16px] whitespace-nowrap">
                              <StatusBadge value={c.status} meta={STATUS_META}/>
                            </td>
                            <td className="p-[12px_16px] whitespace-nowrap">
                              {c.action ? <StatusBadge value={c.action} meta={ACTION_META}/> : <PendingBadge/>}
                            </td>
                            <td className="p-[12px_16px] whitespace-nowrap">
                              {canUpdate ? (
                                <button
                                  className="ops-upd px-3 py-1 rounded-full bg-[rgba(240,160,48,0.11)] border border-[#f0a03044] text-[#f0a030] text-[9px] font-bold tracking-widest cursor-pointer font-['Cinzel',serif] uppercase"
                                  onClick={() => setUpdateTarget(c)}
                                >
                                  Update
                                </button>
                              ) : (
                              <span className={`inline-flex items-center gap-1 text-[9px] tracking-[0.1em] font-bold font-['Cinzel',serif] uppercase`} style={{ color: ticketColor }}>
                                  <span className="w-1 h-1 rounded-full" style={{ background: ticketColor }}/>
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

              {!camLoading && filtered.length > 0 && (
                <div className="px-4.5-py-2.25rder-t border-[#2e2c2222] flex justify-between bg-[rgba(12,11,8,0.6)] shrink-0">
                  <span className="text-[9px] text-[#7a7060] font-['JetBrains_Mono',monospace]">
                    {filtered.length} of {campaigns.length} tasks
                  </span>
                  <span className="text-[9px] text-[#2e2c22] font-['JetBrains_Mono',monospace] flex items-center gap-1.25">
                    <span className="w-1 h-1 rounded-full bg-[#4cbb7f] animate-[opsPulse_2s_infinite]"/>
                    Live updates active
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CREATE ── */}
        {activeSection === "create" && (
          <div className={`${isMobile ? "px-3.5 py-4" : "px-7 py-5.5"} flex-1`}>
            <div className="max-w-140">
              {/* Team status */}
              <div className={`flex items-center gap-2.5 p-[10px_16px] mb-5 bg-[#141310] rounded-lg border ${teamId ? "border-[#2e2c22]" : "border-[#e0525244]"}`}>
                <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${teamId ? "bg-[#4cbb7f] shadow-[0_0_8px_#4cbb7f]" : "bg-[#e05252]"}`}/>
                <div>
                  <p className="m-0 text-[9px] text-[#7a7060] tracking-[0.14em] font-['Cinzel',serif] uppercase">
                    {teamId ? "Team Resolved" : "Team Not Found"}
                  </p>
                  <p className={`m-0 mt-0.5 text-[11px] font-['JetBrains_Mono',monospace] ${teamId ? "text-[#c9a42a]" : "text-[#e05252]"}`}>
                    {teamId ? `${String(teamId).slice(0,24)}…` : "Please wait or refresh"}
                  </p>
                </div>
              </div>

              <div
                className={`bg-[#141310] border border-[#2e2c22] rounded-[10px] shadow-[0_2px_12px_rgba(0,0,0,0.3)] ${isMobile ? "p-[22px_18px]" : "p-[28px_28px_24px]"}`}
              >
                <p className="m-0 mb-1 text-[8px] tracking-[0.22em] text-[rgba(200,168,74,0.6)] font-['Cinzel',serif] uppercase">New Request</p>
                <h2 className="m-0 mb-5.5 text-lg font-semibold text-[#f5edd8] font-['Cinzel',serif]">Create Task</h2>

                {createError && (
                  <div className="px-3.5 py-2.5 rounded-lg mb-4.5 bg-[rgba(224,82,82,0.12)] border border-[#e0525244] text-[#e05252] text-xs">
                    {createError}
                  </div>
                )}
                {createOk && (
                  <div className="px-3.5 py-2.5 rounded-lg mb-4.5 bg-[rgba(76,187,127,0.11)] border border-[#4cbb7f44] text-[#4cbb7f] text-xs flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Campaign created
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
                      value={createForm.requestedAt}
                      onChange={e => setCreateForm(f => ({ ...f, requestedAt: e.target.value }))}
                    />
                  </Field>
                  <div className="border-t border-[#2e2c22] pt-5 mt-1.5">
                    <GoldBtn type="submit" disabled={creating || !teamId} style={{ width:"100%", padding:"13px" }}>
                      {creating ? "Creating…" : !teamId ? "Loading Team…" : "Create Task"}
                    </GoldBtn>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── TEAM MEMBERS ── */}
        {activeSection === "team" && (
          <div className={`${isMobile ? "px-3.5 py-4" : "px-7 py-5.5"} flex-1 overflow-y-auto`}>
            <div className={`grid gap-6 items-start ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>

              {/* Add member form */}
              <div className="bg-[#141310] border border-[#2e2c22] rounded-[10px] p-[24px_22px] shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                <p className="m-0 mb-1 text-[8px] tracking-[0.22em] text-[rgba(200,168,74,0.6)] font-['Cinzel',serif] uppercase">Add Member</p>
                <h2 className="m-0 mb-5 text-base font-semibold text-[#f5edd8] font-['Cinzel',serif]">Add PPC Member</h2>

                {userError && (
                  <div className="px-3.5 py-2.5 rounded-lg mb-4 bg-[rgba(224,82,82,0.12)] border border-[#e0525244] text-[#e05252] text-xs">
                    {userError}
                  </div>
                )}
                {userOk && (
                  <div className="px-3.5 py-2.5 rounded-lg mb-4 bg-[rgba(76,187,127,0.11)] border border-[#4cbb7f44] text-[#4cbb7f] text-xs flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    PPC member added
                  </div>
                )}

                <form onSubmit={handleCreateUser}>
                  <Field label="Username" hint="required">
                    <input
                      className={INPUT_CLS}
                      type="text"
                      value={userForm.username}
                      onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="e.g. john_doe"
                      required
                    />
                  </Field>
                  <Field label="Email" hint="@satkartar.com or @skinrange.com">
                    <input
                      className={INPUT_CLS}
                      type="email"
                      value={userForm.email}
                      onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="user@satkartar.com"
                      required
                    />
                  </Field>
                  <Field label="Password" hint="required">
                    <input
                      className={INPUT_CLS}
                      type="password"
                      value={userForm.password}
                      onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="••••••••••"
                      required
                    />
                  </Field>
                  <div className="border-t border-[#2e2c22] pt-4.5 mt-0.5">
                    <GoldBtn type="submit" disabled={creatingUser} style={{ width:"100%", padding:"12px" }}>
                      {creatingUser ? "Adding…" : "Add PPC Member"}
                    </GoldBtn>
                  </div>
                </form>
              </div>

              {/* Team members list */}
              <div>
                <div className="flex justify-between items-center mb-3.5">
                  <p className="m-0 text-[8px] text-[#7a7060] tracking-[0.2em] font-['Cinzel',serif] uppercase">Team Members</p>
                  <div className="flex gap-2 items-center">
                    <span className="px-2.25 py-0.5 rounded-full bg-[rgba(201,164,42,0.13)] border border-[rgba(201,164,42,0.20)] text-[9px] text-[#c9a42a] font-['JetBrains_Mono',monospace] font-semibold">
                      {ppcMembers.length}
                    </span>
                    <GoldBtn variant="outline" onClick={loadTeamInfo} style={{ padding:"5px 12px", fontSize:9 }}>Refresh</GoldBtn>
                  </div>
                </div>

                {teamLoading ? (
                  <div className="py-10 px-5 text-center text-[#7a7060]">
                    <div className="w-7 h-7 rounded-full border-2 border-[#2e2c22] border-t-[#c9a42a] mx-auto mb-3 animate-[opsSpinner_0.8s_linear_infinite]"/>
                    Loading…
                  </div>
                ) : ppcMembers.length === 0 ? (
                  <div className="py-10 px-5 text-center bg-[#141310] border border-[#2e2c22] rounded-[10px]">
                    <p className="m-0 text-[13px] text-[#f5edd8] font-['Cinzel',serif]">No PPC Members Yet</p>
                    <p className="m-0 mt-1.5 text-xs text-[#7a7060]">Add your first member using the form.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {ppcMembers.map(u => (
                      <UserCard
                        key={u._id}
                        user={u}
                        campaignCount={campaigns.filter(c => {
                          const id = typeof c.createdBy === "object" ? c.createdBy?._id : c.createdBy;
                          return String(id) === String(u._id);
                        }).length}
                        onDelete={target => setDeleteTarget(target)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {updateTarget && (
        <UpdateModal campaign={updateTarget} onClose={() => setUpdateTarget(null)} onSave={handleUpdate}/>
      )}
      {deleteTarget && (
        <DeleteUserModal
          target={deleteTarget} title="Remove PPC Member"
          onClose={() => setDeleteTarget(null)}
          onConfirm={id => handleDeleteUser(id)}
        />
      )}
    </div>
  );
}