/**
 * ManagerDashboard
 *
 * HOW "Sent to IT" works — same two-path design as PPCDashboard.
 * The justFired fix in the now-state useEffect covers PATH B where
 * campaign:schedule_fired arrives via socket and clears the PATH-A timeout.
 * See PPCDashboard.jsx comments for full explanation.
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
  <th style={{ padding:"10px 16px", textAlign:"left", fontSize:8.5, fontWeight:600, color:"#706658", letterSpacing:"0.14em", fontFamily:"'Cinzel',serif", textTransform:"uppercase", whiteSpace:"nowrap" }}>
    {children}
  </th>
);

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

  // ── now state with justFired fix ───────────────────────────────────────────
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const currentReal = Date.now();

    // PATH B fix: when campaign:schedule_fired arrives and patches campaigns,
    // the cleanup clears our pending timeout. Detect this and update now immediately.
    const justFired = campaigns.some(c =>
      c.scheduleAt &&
      new Date(c.scheduleAt).getTime() > now &&       // was "future" per stale state
      new Date(c.scheduleAt).getTime() <= currentReal  // is now past in real time
    );

    if (justFired) {
      setNow(currentReal);
      return;
    }

    // PATH A: normal timeout for the next future scheduleAt
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

  // ── Socket handlers ────────────────────────────────────────────────────────
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
    // PATH B: patches local campaigns → triggers justFired check → setNow() → "Sent to IT"
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
    { id:"tasks", label: "Team Tasks", count: campaigns.length },
    { id:"create",    label:"Create Task" },
    { id:"team",      label:"Team Members",   count: ppcMembers.length },
  ];
  const pad = isMobile ? "16px 14px" : "22px 28px";

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:T.bg, color:T.text, fontFamily:"'DM Sans',sans-serif" }}>
      <OpsGlobalStyles/>
      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, zIndex:7999, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)" }}/>}

      <DashboardSidebar brandSub="MANAGER PANEL" navItems={NAV} activeSection={activeSection}
        onNavigate={goTo} user={user} role="manager" onLogout={handleLogout}
        isMobile={isMobile} open={sidebarOpen}
        extra={<TeamChip teamInfo={teamInfo} memberCount={ppcMembers.length}/>}/>

      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflowY:"auto", overflowX:"hidden" }}>
        <DashboardHeader isMobile={isMobile}
          onMenuToggle={() => setSidebarOpen(v => !v)} sidebarOpen={sidebarOpen}
          title={{ campaigns:"Team Campaigns", create:"Create Task", team:"Team Members" }[activeSection] || "Dashboard"}
          subLabel="MANAGER PANEL"/>

        {pageError && (
          <div style={{ margin:"16px 28px 0", padding:"11px 16px", background:T.redBg, border:`1px solid ${T.red}44`, borderRadius:8, color:T.red, fontSize:12 }}>
            {pageError}
          </div>
        )}

        {/* ── CAMPAIGNS ── */}
        {activeSection === "tasks" && (
          <div style={{ padding:pad, flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
            <FilterCardsGrid cards={FILTER_CARDS} stats={stats} activeId={statusFilter}
              onSelect={id => setStatusFilter(p => p===id ? null : id)} isMobile={isMobile}/>

            <div style={{ background:T.bgCard, border:`1px solid ${T.subtle}`, borderRadius:10, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.3)", flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
              <TableToolbar title="TEAM TaskS" count={filtered.length} search={searchQuery} onSearch={setSearchQuery}
                activeFilter={statusFilter} onClearFilter={() => setStatusFilter(null)} isMobile={isMobile}/>

              <div style={{ flex:1, overflow:"auto", minHeight:0 }}>
                {camLoading ? (
                  <div style={{ padding:"56px 20px", textAlign:"center", color:T.muted }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", border:`2px solid ${T.subtle}`, borderTopColor:T.gold, margin:"0 auto 14px", animation:"opsSpinner .8s linear infinite" }}/>
                    <p style={{ margin:0, fontSize:13 }}>Loading…</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <EmptyState
                    headline="No Records Found"
                    sub={searchQuery || statusFilter ? "Adjust search or filter." : "No team campaigns yet."}
                    action={!searchQuery && !statusFilter ? <GoldBtn variant="outline" onClick={() => goTo("create")}>Create Task</GoldBtn> : null}/>
                ) : (
                  <table style={{ width:"100%", borderCollapse:"collapse", minWidth:760 }}>
                    <thead style={{ position:"sticky", top:0, zIndex:1 }}>
                      <tr style={{ borderBottom:`1px solid ${T.subtle}`, background:`${T.bg}ee` }}>
                        {COLS.map(h => <Th key={h}>{h}</Th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, i) => {
                        const creatorName = typeof c.createdBy === "object" ? c.createdBy?.username : null;
                        const creatorId   = typeof c.createdBy === "object" ? c.createdBy?._id : c.createdBy;
                        const isOwn       = !teamInfo?.members?.find(m => String(m._id) === String(creatorId));
                        const isApproved  = c.action === "approve";

                        // `now` is always current (justFired fix in useEffect above)
                        const scheduleReached = !c.scheduleAt || new Date(c.scheduleAt).getTime() <= now;

                        // (isApproved && scheduleReached) mirrors CampaignsTable — PM approval keeps
                        // status as "transfer" so without this condition the Update button never locks.
                        const isClosed    = c.status==="cancel"||c.status==="done"||c.status==="not done"||c.action==="cancel"||Boolean(c.acknowledgement)||(isApproved && scheduleReached);

                        // Allow edit: not closed AND (pending OR approved-but-schedule-not-yet-fired)
                        const canUpdate = !isClosed && (c.status==="transfer" || (isApproved && !scheduleReached));

                        const ticketLabel = isApproved && scheduleReached && !c.acknowledgement ? "Sent to IT"
                          : isApproved && !scheduleReached                                       ? "Scheduled"
                          : c.status==="cancel"||c.action==="cancel"                             ? "Cancelled"
                          : c.status==="not done"                                                ? "Not Done"
                          : "Closed";

                        const ticketColor = isApproved && scheduleReached && !c.acknowledgement ? T.teal
                          : isApproved && !scheduleReached                                       ? T.purple
                          : c.status==="cancel"||c.action==="cancel"                             ? T.red
                          : c.status==="not done"                                                ? T.amber
                          : T.green;

                        return (
                          <tr key={c._id} className="ops-row"
                            style={{ borderBottom:`1px solid ${T.subtle}22`, background: i%2===1 ? `${T.bgCard}80` : "transparent" }}>
                            <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                                <div style={{ width:24, height:24, borderRadius:"50%", background: isOwn ? T.goldDim : T.purpleBg, border:`1px solid ${isOwn ? T.gold : T.purple}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color: isOwn ? T.gold : T.purple, fontFamily:"'Cinzel',serif", flexShrink:0 }}>
                                  {initials(creatorName || user || "M")}
                                </div>
                                <span style={{ fontSize:12, color: isOwn ? T.gold : T.text }}>{creatorName || user || "—"}</span>
                              </div>
                            </td>
                            <td style={{ padding:"12px 16px", minWidth:160, maxWidth:280 }}>
                              <p style={{ margin:0, fontSize:12, color:T.text, lineHeight:1.55, wordBreak:"break-word", whiteSpace:"pre-wrap" }}>{c.message}</p>
                            </td>
                            <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                              <span style={{ fontSize:11, color:T.muted, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(c.requestedAt)}</span>
                            </td>
                            <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                              <StatusBadge value={c.status} meta={STATUS_META}/>
                            </td>
                            <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
                              {c.action ? <StatusBadge value={c.action} meta={ACTION_META}/> : <PendingBadge/>}
                            </td>
                            <td style={{ padding:"12px 16px", whiteSpace:"nowrap" }}>
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
                )}
              </div>

              {!camLoading && filtered.length > 0 && (
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
        )}

        {/* ── CREATE ── */}
        {activeSection === "create" && (
          <div style={{ padding:pad, flex:1 }}>
            <div style={{ maxWidth:560 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", marginBottom:20, background:T.bgCard, border:`1px solid ${teamId ? T.subtle : T.red+"44"}`, borderRadius:8 }}>
                <span style={{ width:7, height:7, borderRadius:"50%", flexShrink:0, background: teamId ? T.green : T.red, boxShadow: teamId ? `0 0 8px ${T.green}` : "none" }}/>
                <div>
                  <p style={{ margin:0, fontSize:9, color:T.muted, letterSpacing:"0.14em", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>{teamId ? "Team Resolved" : "Team Not Found"}</p>
                  <p style={{ margin:"2px 0 0", fontSize:11, color: teamId ? T.gold : T.red, fontFamily:"'JetBrains Mono',monospace" }}>
                    {teamId ? `${String(teamId).slice(0,24)}…` : "Please wait or refresh"}
                  </p>
                </div>
              </div>
              <div style={{ background:T.bgCard, border:`1px solid ${T.subtle}`, borderRadius:10, padding: isMobile ? "22px 18px" : "28px 28px 24px", boxShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>
                <p style={{ margin:"0 0 4px", fontSize:8, letterSpacing:"0.22em", color:"rgba(200,168,74,0.6)", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>New Request</p>
                <h2 style={{ margin:"0 0 22px", fontSize:18, fontWeight:600, color:T.white, fontFamily:"'Cinzel',serif" }}>Create Task</h2>
                {createError && <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:18, background:T.redBg, border:`1px solid ${T.red}44`, color:T.red, fontSize:12 }}>{createError}</div>}
                {createOk && <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:18, background:T.greenBg, border:`1px solid ${T.green}44`, color:T.green, fontSize:12, display:"flex", alignItems:"center", gap:8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Campaign created
                </div>}
                <form onSubmit={handleCreate}>
                  <Field label="Message" hint="required">
                    <textarea className="ops-focus" value={createForm.message} onChange={e => setCreateForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe the task request…" rows={4} required style={{ ...inputSx, borderRadius:8, resize:"vertical", lineHeight:1.6 }}/>
                  </Field>
                  <Field label="Requested Date / Time" hint="defaults to now">
                    <input type="datetime-local" className="ops-focus" value={createForm.requestedAt} onChange={e => setCreateForm(f => ({ ...f, requestedAt: e.target.value }))} style={{ ...inputSx, borderRadius:8, colorScheme:"dark" }}/>
                  </Field>
                  <div style={{ borderTop:`1px solid ${T.subtle}`, paddingTop:20, marginTop:6 }}>
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
          <div style={{ padding:pad, flex:1, overflowY:"auto" }}>
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:24, alignItems:"start" }}>
              <div style={{ background:T.bgCard, border:`1px solid ${T.subtle}`, borderRadius:10, padding:"24px 22px", boxShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>
                <p style={{ margin:"0 0 4px", fontSize:8, letterSpacing:"0.22em", color:"rgba(200,168,74,0.6)", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>Add Member</p>
                <h2 style={{ margin:"0 0 20px", fontSize:16, fontWeight:600, color:T.white, fontFamily:"'Cinzel',serif" }}>Add PPC Member</h2>
                {userError && <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, background:T.redBg, border:`1px solid ${T.red}44`, color:T.red, fontSize:12 }}>{userError}</div>}
                {userOk && <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, background:T.greenBg, border:`1px solid ${T.green}44`, color:T.green, fontSize:12, display:"flex", alignItems:"center", gap:8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  PPC member added
                </div>}
                <form onSubmit={handleCreateUser}>
                  <Field label="Username" hint="required">
                    <input className="ops-focus" type="text" value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value }))} placeholder="e.g. john_doe" required style={{ ...inputSx, borderRadius:8 }}/>
                  </Field>
                  <Field label="Email" hint="@satkartar.com or @skinrange.com">
                    <input className="ops-focus" type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="user@satkartar.com" required style={{ ...inputSx, borderRadius:8 }}/>
                  </Field>
                  <Field label="Password" hint="required">
                    <input className="ops-focus" type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••••" required style={{ ...inputSx, borderRadius:8 }}/>
                  </Field>
                  <div style={{ borderTop:`1px solid ${T.subtle}`, paddingTop:18, marginTop:2 }}>
                    <GoldBtn type="submit" disabled={creatingUser} style={{ width:"100%", padding:"12px" }}>
                      {creatingUser ? "Adding…" : "Add PPC Member"}
                    </GoldBtn>
                  </div>
                </form>
              </div>

              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <p style={{ margin:0, fontSize:8, color:T.muted, letterSpacing:"0.2em", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>Team Members</p>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ padding:"2px 9px", borderRadius:99, background:T.goldDim, border:`1px solid ${T.goldBorder}`, fontSize:9, color:T.gold, fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>{ppcMembers.length}</span>
                    <GoldBtn variant="outline" onClick={loadTeamInfo} style={{ padding:"5px 12px", fontSize:9 }}>Refresh</GoldBtn>
                  </div>
                </div>
                {teamLoading ? (
                  <div style={{ padding:"40px 20px", textAlign:"center", color:T.muted }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${T.subtle}`, borderTopColor:T.gold, margin:"0 auto 12px", animation:"opsSpinner .8s linear infinite" }}/>
                    Loading…
                  </div>
                ) : ppcMembers.length === 0 ? (
                  <div style={{ padding:"40px 20px", textAlign:"center", background:T.bgCard, border:`1px solid ${T.subtle}`, borderRadius:10 }}>
                    <p style={{ margin:0, fontSize:13, color:T.white, fontFamily:"'Cinzel',serif" }}>No PPC Members Yet</p>
                    <p style={{ margin:"6px 0 0", fontSize:12, color:T.muted }}>Add your first member using the form.</p>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {ppcMembers.map(u => (
                      <UserCard key={u._id} user={u}
                        campaignCount={campaigns.filter(c => {
                          const id = typeof c.createdBy === "object" ? c.createdBy?._id : c.createdBy;
                          return String(id) === String(u._id);
                        }).length}
                        onDelete={target => setDeleteTarget(target)}/>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {updateTarget && <UpdateModal campaign={updateTarget} onClose={() => setUpdateTarget(null)} onSave={handleUpdate}/>}
      {deleteTarget && <DeleteUserModal target={deleteTarget} title="Remove PPC Member" onClose={() => setDeleteTarget(null)} onConfirm={id => handleDeleteUser(id)}/>}
    </div>
  );
}