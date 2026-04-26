// src/pages/PMDashboard.jsx
// CHANGES:
//  - Layout: height:100vh, main overflowY:auto (scrollbar always in viewport).
//  - campaign:schedule_fired socket event updates campaign in local state.
//  - Smart setTimeout for `now` (no 10s polling).
//  - Daily Tasks section fetch runs immediately on section activation
//    (unchanged) — IT fix is in ITDashboard.
import { useEffect, useState, useCallback, useMemo } from "react";
import useAuthStore  from "../stores/useAuthStore.js";
import useNotifStore from "../stores/useNotificationStore.js";
import { useResponsive }                   from "../hooks/useResponsive.js";
import { useSocket }                       from "../hooks/useSocket.js";
import { useLogout }                       from "../hooks/useLogout.js";
import { T, inputSx }                     from "../constants/theme.js";
import { OPEN_REQUEST_FILTER_CARDS, CLOSED_REQUEST_FILTER_CARDS } from "../constants/filterCards.js";
import { fmt }                             from "../utils/formatters.js";
import { fetchCampaigns, updateCampaign }  from "../services/campaignService.js";
import { fetchUsers, deleteUser }          from "../services/userService.js";
import api                                 from "../api/axios.js";
import OpsGlobalStyles  from "../components/common/OpsGlobalStyles.jsx";
import GoldBtn          from "../components/common/GoldBtn.jsx";
import Field            from "../components/common/Field.jsx";
import DashboardSidebar from "../components/layout/DashboardSidebar.jsx";
import DashboardHeader  from "../components/layout/DashboardHeader.jsx";
import ActionModal      from "../components/campaigns/ActionModal.jsx";
import CampaignsTable   from "../components/campaigns/CampaignsTable.jsx";
import DeleteUserModal  from "../components/users/DeleteUserModal.jsx";
import CreateUserForm   from "../components/users/CreateUserForm.jsx";
import PMUserSection    from "../components/users/PMUserSection.jsx";

export default function PMDashboard() {
  const user            = useAuthStore(s => s.user);
  const addNotification = useNotifStore(s => s.addNotification);
  const handleLogout    = useLogout();
  const isMobile        = useResponsive();

  const [activeSection, setActiveSection] = useState("campaigns");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [campaigns,     setCampaigns]     = useState([]);
  const [camLoading,    setCamLoading]    = useState(true);
  const [actionTarget,  setActionTarget]  = useState(null);
  const [users,         setUsers]         = useState([]);
  const [userLoading,   setUserLoading]   = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);

  // Daily Tasks state
  const [dailyTasks,     setDailyTasks]     = useState([]);
  const [taskLoading,    setTaskLoading]    = useState(false);
  const [taskForm,       setTaskForm]       = useState({ task:"", time:"" });
  const [taskCreating,   setTaskCreating]   = useState(false);
  const [taskError,      setTaskError]      = useState("");
  const [taskOk,         setTaskOk]         = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  // Socket handlers
  useSocket({
    "campaign:created": c => {
      setCampaigns(p => p.some(x => x._id===c._id) ? p : [c,...p]);
      addNotification(`Campaign created by ${c.performerName||"someone"}`);
    },
    "campaign:updated": c => {
      setCampaigns(p => p.map(x => x._id===c._id ? c : x));
      addNotification(c.status==="cancel"||c.action==="cancel"
        ? `Campaign cancelled by ${c.performerName||"someone"}`
        : `Campaign updated by ${c.performerName||"someone"}`);
    },
    "campaign:it_queued": c => {
      setCampaigns(p => p.map(x => x._id===c._id ? c : x));
      addNotification(`Campaign approved by ${c.performerName||"PM"} — sent to IT`);
    },
    // Patch campaign when server timer fires — keeps table state accurate
    "campaign:schedule_fired": c => {
      setCampaigns(p => p.map(x => x._id===c._id ? c : x));
    },
    "campaign:deleted": d => setCampaigns(p => p.filter(x => x._id!==d._id)),
    "campaign:it_ack": c => {
      setCampaigns(p => p.map(x => x._id===c._id ? c : x));
      addNotification(c.acknowledgement==="done"
        ? `${c.performerName||"IT"} completed campaign`
        : `${c.performerName||"IT"} could not complete campaign`);
    },
    "dailytask:acked": t => {
      setDailyTasks(prev => prev.map(task => task._id===t._id ? { ...task, itResponse: t.itResponse } : task));
      addNotification(`✅ ${t.performerName||"IT"} acknowledged daily task`);
    },
  });

  // Campaign load
  const loadCampaigns = useCallback(async () => {
    setCamLoading(true);
    try { setCampaigns(await fetchCampaigns()); }
    catch { addNotification("Failed to load campaigns"); }
    finally { setCamLoading(false); }
  }, [addNotification]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  // User load
  const loadUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      const data = await fetchUsers();
      if (data) { setUsers(data); }
      else {
        const map = new Map();
        campaigns.forEach(c => {
          if (c.createdBy) {
            const u = typeof c.createdBy==="object" ? c.createdBy : { _id: c.createdBy };
            if (!map.has(u._id)) map.set(u._id, u);
          }
        });
        setUsers([...map.values()]);
      }
    } finally { setUserLoading(false); }
  }, [campaigns]);

  useEffect(() => { if (activeSection==="users") loadUsers(); }, [activeSection, loadUsers]);

  // Daily task load
  const loadDailyTasks = useCallback(async () => {
    setTaskLoading(true);
    try {
      const res = await api.get("/task/list");
      setDailyTasks(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to load daily tasks:", err);
    } finally { setTaskLoading(false); }
  }, []);

  useEffect(() => {
    if (activeSection==="daily-tasks") loadDailyTasks();
  }, [activeSection, loadDailyTasks]);

  // Derived data
  const openRequests = useMemo(() => campaigns.filter(c => !c.action||c.action==="approve"), [campaigns]);
  const closedRequests = useMemo(() => campaigns.filter(c => c.status==="cancel"||c.action==="cancel"||c.status==="done"||c.status==="not done"), [campaigns]);
  const totalUsers = useMemo(() => users.filter(u => ["manager","ppc","it"].includes(u.role)).length, [users]);
  const activeTasks = useMemo(() => dailyTasks.filter(t => t.isSchedule!==false), [dailyTasks]);

  const goTo = section => { setActiveSection(section); setSidebarOpen(false); };

  const handleAction = useCallback(async (campaignId, { action, pmMessage, scheduleAt }) => {
    const updated = await updateCampaign(campaignId, { action, pmMessage, scheduleAt });
    if (updated) setCampaigns(prev => prev.map(c => c._id===updated._id ? updated : c));
  }, []);

  const handleDeleteUser   = useCallback(async id => { await deleteUser(id); setUsers(prev => prev.filter(u => u._id!==id)); }, []);
  const handleUserCreated  = useCallback(() => { if (activeSection==="users") loadUsers(); }, [activeSection, loadUsers]);

  const handleCreateTask = useCallback(async (e) => {
    e.preventDefault();
    setTaskError(""); setTaskOk(false);
    if (!taskForm.task.trim()||!taskForm.time) { setTaskError("Task description and scheduled time are required."); return; }
    setTaskCreating(true);
    try {
      await api.post("/task/create", { task: taskForm.task.trim(), time: taskForm.time });
      setTaskOk(true);
      setTaskForm({ task:"", time:"" });
      await loadDailyTasks();
      setTimeout(() => setTaskOk(false), 3000);
    } catch (err) {
      setTaskError(err?.response?.data?.message || "Failed to create task.");
    } finally { setTaskCreating(false); }
  }, [taskForm, loadDailyTasks]);

  const handleDeactivateTask = useCallback(async id => {
    setDeactivatingId(id);
    try {
      await api.post("/task/deactivate", { id });
      setDailyTasks(prev => prev.map(t => t._id===id ? { ...t, isSchedule:false } : t));
    } catch (err) { console.error("Failed to deactivate task:", err); }
    finally { setDeactivatingId(null); }
  }, []);

  const NAV = [
    { id:"campaigns",       label:"Campaigns",       count: campaigns.length      },
    { id:"users",           label:"Users",           count: totalUsers            },
    { id:"manage-users",    label:"Manage Users"                                  },
    { id:"open-requests",   label:"Open Requests",   count: openRequests.length   },
    { id:"closed-requests", label:"Closed Requests", count: closedRequests.length },
    { id:"daily-tasks",     label:"Daily Tasks",     count: activeTasks.length    },
  ];

  const SECTION_TITLE = {
    campaigns:"Campaigns", users:"Users", "manage-users":"Manage Users",
    "open-requests":"Open Requests", "closed-requests":"Closed Requests", "daily-tasks":"Daily Tasks",
  };

  const pad = isMobile ? "16px 14px" : "22px 28px";

  const InfoBar = ({ color, message }) => (
    <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:20, padding:"12px 18px", background:T.bgCard, border:`1px solid ${color}25`, borderRadius:8, flexShrink:0 }}>
      <span style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0, boxShadow:`0 0 8px ${color}` }}/>
      <p style={{ margin:0, fontSize:12, color:T.muted, lineHeight:1.6 }}>{message}</p>
    </div>
  );

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:T.bg, color:T.text, fontFamily:"'DM Sans',sans-serif" }}>
      <OpsGlobalStyles/>
      {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, zIndex:7999, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)" }}/>}

      <DashboardSidebar brandSub="PM PANEL" navItems={NAV} activeSection={activeSection}
        onNavigate={goTo} user={user} role="process manager" onLogout={handleLogout}
        isMobile={isMobile} open={sidebarOpen}/>

      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflowY:"auto", overflowX:"hidden" }}>
        <DashboardHeader isMobile={isMobile} onMenuToggle={() => setSidebarOpen(v => !v)} sidebarOpen={sidebarOpen}
          title={SECTION_TITLE[activeSection]||"Dashboard"} subLabel="PROCESS MANAGER"/>

        {/* Campaigns — CampaignsTable owns its own scroll */}
        {activeSection==="campaigns" && (
          <div style={{ padding:pad, flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
            <CampaignsTable campaigns={campaigns} loading={camLoading} onAction={setActionTarget} isMobile={isMobile} title="ALL CAMPAIGNS" showActionBtn/>
          </div>
        )}

        {activeSection==="users" && (
          <div style={{ padding:pad, flex:1, overflowY:"auto" }}>
            <PMUserSection users={users} loading={userLoading} onDelete={target => setDeleteTarget(target)} onRefresh={loadUsers}/>
          </div>
        )}

        {activeSection==="manage-users" && (
          <div style={{ padding:pad, flex:1, overflowY:"auto" }}>
            <div style={{ maxWidth:540 }}>
              <InfoBar color={T.gold} message="As a Process Manager, you can create Manager, IT, and other Process Manager accounts."/>
              <div style={{ background:T.bgCard, border:`1px solid ${T.subtle}`, borderRadius:10, padding: isMobile ? "22px 18px" : "28px 28px 24px", boxShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>
                <p style={{ margin:"0 0 4px", fontSize:8, letterSpacing:"0.22em", color:"rgba(200,168,74,0.6)", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>New Account</p>
                <h2 style={{ margin:"0 0 22px", fontSize:18, fontWeight:600, color:T.white, fontFamily:"'Cinzel',serif" }}>Create User Account</h2>
                <CreateUserForm allowedRoles={["manager","process manager","it"]} onSuccess={handleUserCreated}/>
              </div>
            </div>
          </div>
        )}

        {activeSection==="open-requests" && (
          <div style={{ padding:pad, flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
            <InfoBar color={T.teal} message={<>Campaigns <strong style={{color:T.amber}}>awaiting your review</strong> or <strong style={{color:T.teal}}>approved</strong> and waiting for IT.</>}/>
            <CampaignsTable campaigns={openRequests} loading={camLoading} onAction={setActionTarget} isMobile={isMobile} title="OPEN · PENDING & APPROVED" showActionBtn filterCards={OPEN_REQUEST_FILTER_CARDS}/>
          </div>
        )}

        {activeSection==="closed-requests" && (
          <div style={{ padding:pad, flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
            <InfoBar color={T.muted} message="Closed campaigns — marked Done, Not Done, or Cancelled."/>
            <CampaignsTable campaigns={closedRequests} loading={camLoading} onAction={setActionTarget} isMobile={isMobile} title="CLOSED · DONE, NOT DONE & CANCELLED" showActionBtn={false} filterCards={CLOSED_REQUEST_FILTER_CARDS}/>
          </div>
        )}

        {/* DAILY TASKS */}
        {activeSection==="daily-tasks" && (
          <div style={{ padding:pad, flex:1, overflowY:"auto" }}>
            <InfoBar color={T.purple} message="Schedule recurring daily tasks for IT. Each task is automatically delivered to IT at the specified time every day."/>
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:24, alignItems:"start" }}>
              {/* Create form */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.subtle}`, borderRadius:10, padding:"24px 22px", boxShadow:"0 2px 12px rgba(0,0,0,0.3)" }}>
                <p style={{ margin:"0 0 4px", fontSize:8, letterSpacing:"0.22em", color:"rgba(200,168,74,0.6)", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>New Schedule</p>
                <h2 style={{ margin:"0 0 20px", fontSize:16, fontWeight:600, color:T.white, fontFamily:"'Cinzel',serif" }}>Create Daily Task</h2>
                {taskError && <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, background:T.redBg, border:`1px solid ${T.red}44`, color:T.red, fontSize:12 }}>{taskError}</div>}
                {taskOk && (
                  <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:16, background:T.greenBg, border:`1px solid ${T.green}44`, color:T.green, fontSize:12, display:"flex", alignItems:"center", gap:8 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Daily task scheduled successfully
                  </div>
                )}
                <form onSubmit={handleCreateTask}>
                  <Field label="Task Description" hint="required">
                    <textarea className="ops-focus" value={taskForm.task} onChange={e => setTaskForm(f => ({ ...f, task: e.target.value }))} placeholder="Describe the daily task for IT…" rows={4} required style={{ ...inputSx, borderRadius:8, resize:"vertical", lineHeight:1.6 }}/>
                  </Field>
                  <Field label="Daily Delivery Time" hint="24-hour IST — sent to IT every day at this time">
                    <input type="time" className="ops-focus" value={taskForm.time} onChange={e => setTaskForm(f => ({ ...f, time: e.target.value }))} required style={{ ...inputSx, borderRadius:8, colorScheme:"dark" }}/>
                  </Field>
                  <div style={{ borderTop:`1px solid ${T.subtle}`, paddingTop:18, marginTop:2 }}>
                    <GoldBtn type="submit" disabled={taskCreating} style={{ width:"100%", padding:"12px" }}>
                      {taskCreating ? "Scheduling…" : "Schedule Daily Task"}
                    </GoldBtn>
                  </div>
                </form>
              </div>

              {/* Task list */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <p style={{ margin:0, fontSize:8, color:T.muted, letterSpacing:"0.2em", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>Scheduled Tasks</p>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ padding:"2px 9px", borderRadius:99, background:T.purpleBg, border:`1px solid ${T.purple}44`, fontSize:9, color:T.purple, fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>
                      {activeTasks.length} active
                    </span>
                    <GoldBtn variant="outline" onClick={loadDailyTasks} style={{ padding:"5px 12px", fontSize:9 }}>Refresh</GoldBtn>
                  </div>
                </div>

                {taskLoading ? (
                  <div style={{ padding:"40px 20px", textAlign:"center", color:T.muted }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${T.subtle}`, borderTopColor:T.gold, margin:"0 auto 12px", animation:"opsSpinner .8s linear infinite" }}/>
                    Loading…
                  </div>
                ) : dailyTasks.length === 0 ? (
                  <div style={{ padding:"40px 20px", textAlign:"center", background:T.bgCard, border:`1px solid ${T.subtle}`, borderRadius:10 }}>
                    <p style={{ margin:0, fontSize:13, color:T.white, fontFamily:"'Cinzel',serif" }}>No Daily Tasks Yet</p>
                    <p style={{ margin:"6px 0 0", fontSize:12, color:T.muted }}>Create your first daily task using the form.</p>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {dailyTasks.map(task => {
                      const isActive = task.isSchedule !== false;
                      const ackCount = task.itResponse?.length ?? 0;
                      return (
                        <div key={task._id} style={{ background:T.bgCard, border:`1px solid ${isActive ? T.purpleBg : T.subtle}`, borderLeft:`3px solid ${isActive ? T.purple : T.muted}`, borderRadius:8, padding:"14px 16px", opacity: isActive ? 1 : 0.55 }}>
                          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:10 }}>
                            <p style={{ margin:0, fontSize:13, color:T.text, lineHeight:1.55, flex:1, wordBreak:"break-word" }}>{task.task}</p>
                            {isActive && (
                              <button onClick={() => handleDeactivateTask(task._id)} disabled={deactivatingId===task._id}
                                style={{ padding:"3px 10px", borderRadius:4, background:T.redBg, border:`1px solid ${T.red}44`, color:T.red, fontSize:9, fontWeight:700, letterSpacing:"0.1em", cursor:"pointer", fontFamily:"'Cinzel',serif", flexShrink:0, opacity: deactivatingId===task._id ? 0.5 : 1 }}>
                                {deactivatingId===task._id ? "…" : "DEACTIVATE"}
                              </button>
                            )}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                            <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:T.purple, fontFamily:"'JetBrains Mono',monospace" }}>🕐 {task.time} daily</span>
                            <span style={{ fontSize:11, color:T.muted, fontFamily:"'JetBrains Mono',monospace" }}>{ackCount} acknowledgement{ackCount!==1?"s":""}</span>
                            <span style={{ padding:"2px 8px", borderRadius:99, fontSize:9, fontWeight:700, letterSpacing:"0.1em", fontFamily:"'Cinzel',serif", background: isActive ? T.purpleBg : T.subtle, color: isActive ? T.purple : T.muted, border:`1px solid ${isActive ? T.purple+"44" : "transparent"}` }}>
                              {isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                          {ackCount > 0 && (() => {
                            const latest = task.itResponse[task.itResponse.length-1];
                            return (
                              <div style={{ marginTop:10, padding:"8px 12px", background:T.bgInput, borderRadius:6, border:`1px solid ${T.subtle}` }}>
                                <p style={{ margin:"0 0 3px", fontSize:8, color:T.muted, letterSpacing:"0.12em", fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>Latest IT Response</p>
                                <p style={{ margin:0, fontSize:11, color:T.teal, lineHeight:1.5, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{latest.message}</p>
                                <p style={{ margin:"4px 0 0", fontSize:9, color:T.muted, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(latest.acknowledgedAt)}</p>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {actionTarget && <ActionModal campaign={actionTarget} onClose={() => setActionTarget(null)} onSave={handleAction}/>}
      {deleteTarget  && <DeleteUserModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={id => handleDeleteUser(id)}/>}
    </div>
  );
}