// src/pages/PMDashboard.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import useAuthStore  from "../stores/useAuthStore.js";
import useNotifStore from "../stores/useNotificationStore.js";
import { useResponsive }                   from "../hooks/useResponsive.js";
import { useSocket }                       from "../hooks/useSocket.js";
import { useLogout }                       from "../hooks/useLogout.js";
import { useNotifications }                from "../hooks/useNotifications.js";
import { T }                              from "../constants/theme.js";
import { OPEN_REQUEST_FILTER_CARDS, CLOSED_REQUEST_FILTER_CARDS } from "../constants/filterCards.js";
import { fmt }                             from "../utils/formatters.js";
import { fetchCampaigns, updateCampaign }  from "../services/campaignService.js";
import { fetchUsers, deleteUser }          from "../services/userService.js";
import { triggerAlert }                    from "../utils/notifications.js";
import api                                 from "../api/axios.js";
import OpsGlobalStyles      from "../components/common/OpsGlobalStyles.jsx";
import GoldBtn              from "../components/common/GoldBtn.jsx";
import Field                from "../components/common/Field.jsx";
import DashboardSidebar     from "../components/layout/DashboardSidebar.jsx";
import DashboardHeader      from "../components/layout/DashboardHeader.jsx";
import ActionModal          from "../components/campaigns/ActionModal.jsx";
import CampaignsTable       from "../components/campaigns/CampaignsTable.jsx";
import DeleteUserModal      from "../components/users/DeleteUserModal.jsx";
import CreateUserForm       from "../components/users/CreateUserForm.jsx";
import PMUserSection        from "../components/users/PMUserSection.jsx";
import SavedMessagesSection from "../components/messages/SavedMessagesSection.jsx";

const INPUT_CLS =
  "ops-focus w-full box-border bg-[#0a0908] border border-[#2e2c22] rounded-lg " +
  "text-[#e8ddc8] text-[13px] px-[14px] py-[11px] outline-none " +
  "font-['DM_Sans',sans-serif] transition-[border-color,box-shadow] duration-200";

export default function PMDashboard() {
  const user            = useAuthStore(s => s.user);
  const addNotification = useNotifStore(s => s.addNotification);
  const handleLogout    = useLogout();
  const isMobile        = useResponsive();

  // ── Notifications (permission + push registration) ────────────────────────
  const { notifPermission, handleRequestPermission } = useNotifications();

  const [activeSection, setActiveSection] = useState("tasks");
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
  const [taskForm,       setTaskForm]       = useState({ task: "", time: "" });
  const [taskCreating,   setTaskCreating]   = useState(false);
  const [taskError,      setTaskError]      = useState("");
  const [taskOk,         setTaskOk]         = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  // ── Socket handlers ────────────────────────────────────────────────────────
  useSocket({
    "campaign:created": c => {
      setCampaigns(p => p.some(x => x._id === c._id) ? p : [c, ...p]);
      addNotification(`Campaign created by ${c.performerName || "someone"}`);
      triggerAlert(
        "📋 New Campaign Created",
        `${c.performerName || "Someone"}: ${c.message?.slice(0, 100) || "A new campaign was submitted"}`
      );
    },
    "campaign:updated": c => {
      setCampaigns(p => p.map(x => x._id === c._id ? c : x));
      const isCancelled = c.status === "cancel" || c.action === "cancel";
      const performer   = c.performerName || "Someone";
      const preview     = c.message?.slice(0, 80) || "a campaign";
      if (isCancelled) {
        addNotification(`Campaign cancelled by ${performer}`);
        triggerAlert("❌ Campaign Cancelled", `${performer} cancelled: "${preview}"`);
      } else {
        addNotification(`Campaign updated by ${performer}`);
        triggerAlert("✏️ Campaign Updated", `${performer} edited: "${preview}"`);
      }
    },
    "campaign:it_queued": c => {
      setCampaigns(p => p.map(x => x._id === c._id ? c : x));
      addNotification(`Campaign approved by ${c.performerName || "PM"} — sent to IT`);
    },
    "campaign:schedule_fired": c => {
      setCampaigns(p => p.map(x => x._id === c._id ? c : x));
    },
    "campaign:deleted": d => setCampaigns(p => p.filter(x => x._id !== d._id)),
    "campaign:it_ack": c => {
      setCampaigns(p => p.map(x => x._id === c._id ? c : x));
      const isDone = c.acknowledgement === "done";
      addNotification(isDone
        ? `${c.performerName || "IT"} completed campaign`
        : `${c.performerName || "IT"} could not complete campaign`);
      triggerAlert(
        isDone ? "✅ Campaign Completed" : "⚠️ Campaign Not Done",
        c.itMessage?.slice(0, 100) || c.message?.slice(0, 100) || "IT has responded to a campaign"
      );
    },
    "dailytask:acked": t => {
      setDailyTasks(prev =>
        prev.map(task => task._id === t._id ? { ...task, itResponse: t.itResponse } : task)
      );
      addNotification(`✅ ${t.performerName || "IT"} acknowledged daily task`);
      triggerAlert(
        "✅ Daily Task Acknowledged",
        `${t.performerName || "IT"} completed: ${t.task?.slice(0, 100) || "a scheduled task"}`
      );
    },
  });

  const loadCampaigns = useCallback(async () => {
    setCamLoading(true);
    try { setCampaigns(await fetchCampaigns()); }
    catch { addNotification("Failed to load campaigns"); }
    finally { setCamLoading(false); }
  }, [addNotification]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const loadUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      const data = await fetchUsers();
      if (data) {
        setUsers(data);
      } else {
        const map = new Map();
        campaigns.forEach(c => {
          if (c.createdBy) {
            const u = typeof c.createdBy === "object" ? c.createdBy : { _id: c.createdBy };
            if (!map.has(u._id)) map.set(u._id, u);
          }
        });
        setUsers([...map.values()]);
      }
    } finally { setUserLoading(false); }
  }, [campaigns]);

  useEffect(() => { if (activeSection === "users") loadUsers(); }, [activeSection, loadUsers]);

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
    if (activeSection === "daily-tasks") loadDailyTasks();
  }, [activeSection, loadDailyTasks]);

  const openRequests   = useMemo(() => campaigns.filter(c => !c.action || c.action === "approve"), [campaigns]);
  const closedRequests = useMemo(() => campaigns.filter(c => c.status === "cancel" || c.action === "cancel" || c.status === "done" || c.status === "not done"), [campaigns]);
  const totalUsers     = useMemo(() => users.filter(u => ["manager", "ppc", "it"].includes(u.role)).length, [users]);
  const activeTasks    = useMemo(() => dailyTasks.filter(t => t.isSchedule !== false), [dailyTasks]);

  const goTo = section => { setActiveSection(section); setSidebarOpen(false); };

  const handleAction = useCallback(async (campaignId, { action, pmMessage, scheduleAt }) => {
    const updated = await updateCampaign(campaignId, { action, pmMessage, scheduleAt });
    if (updated) setCampaigns(prev => prev.map(c => c._id === updated._id ? updated : c));
  }, []);

  const handleDeleteUser  = useCallback(async id => {
    await deleteUser(id);
    setUsers(prev => prev.filter(u => u._id !== id));
  }, []);

  const handleUserCreated = useCallback(() => {
    if (activeSection === "users") loadUsers();
  }, [activeSection, loadUsers]);

  const handleCreateTask = useCallback(async (e) => {
    e.preventDefault();
    setTaskError(""); setTaskOk(false);
    if (!taskForm.task.trim() || !taskForm.time) {
      setTaskError("Task description and scheduled time are required.");
      return;
    }
    setTaskCreating(true);
    try {
      await api.post("/task/create", { task: taskForm.task.trim(), time: taskForm.time });
      setTaskOk(true);
      setTaskForm({ task: "", time: "" });
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
      setDailyTasks(prev => prev.map(t => t._id === id ? { ...t, isSchedule: false } : t));
    } catch (err) {
      console.error("Failed to deactivate task:", err);
    } finally { setDeactivatingId(null); }
  }, []);

  const NAV = [
    { id: "tasks",           label: "Tasks",           count: campaigns.length      },
    { id: "users",           label: "Users",           count: totalUsers            },
    { id: "manage-users",    label: "Manage Users"                                  },
    { id: "open-requests",   label: "Open Requests",   count: openRequests.length   },
    { id: "closed-requests", label: "Closed Requests", count: closedRequests.length },
    { id: "daily-tasks",     label: "Daily Tasks",     count: activeTasks.length    },
    { id: "saved-messages",  label: "Saved Messages"                                },
  ];

  const SECTION_TITLE = {
    tasks:            "Tasks",
    users:            "Users",
    "manage-users":   "Manage Users",
    "open-requests":  "Open Requests",
    "closed-requests":"Closed Requests",
    "daily-tasks":    "Daily Tasks",
    "saved-messages": "Saved Messages",
  };

  const InfoBar = ({ color, message }) => (
    <div
      className="flex gap-3 items-center mb-5 px-4.5 py-3 bg-[#141310] rounded-lg shrink-0"
      style={{ border: `1px solid ${color}25` }}
    >
      <span
        className="w-1.75h-[7px] rounded-full shrink-0"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <p className="m-0 text-xs text-[#7a7060] leading-[1.6]">{message}</p>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0b08] text-[#e8ddc8] font-['DM_Sans',sans-serif]">
      <OpsGlobalStyles />
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-7999 bg-black/75 backdrop-blur-sm" />
      )}

      <DashboardSidebar
        brandSub="PM PANEL" navItems={NAV} activeSection={activeSection}
        onNavigate={goTo} user={user} role="process manager" onLogout={handleLogout}
        isMobile={isMobile} open={sidebarOpen}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden">
        <DashboardHeader
          isMobile={isMobile} onMenuToggle={() => setSidebarOpen(v => !v)} sidebarOpen={sidebarOpen}
          title={SECTION_TITLE[activeSection] || "Dashboard"} subLabel="PROCESS MANAGER"
        />

        {/* ── Notification Permission Banner ── */}
        {notifPermission !== "granted" && notifPermission !== "unsupported" && (
          <div className={`px-7 py-2.5 flex justify-between items-center gap-3 flex-wrap border-b ${notifPermission === "denied" ? "bg-[rgba(224,82,82,0.12)] border-[rgba(224,82,82,0.2)]" : "bg-[rgba(240,160,48,0.11)] border-[rgba(240,160,48,0.2)]"}`}>
            <div className="flex items-center gap-2.25">
              <span className="text-[15px]">{notifPermission === "denied" ? "🔕" : "🔔"}</span>
              <div>
                <p className={`m-0 text-xs font-medium ${notifPermission === "denied" ? "text-[#e05252]" : "text-[#f0a030]"}`}>
                  {notifPermission === "denied"
                    ? "Desktop notifications are blocked — you won't receive alerts."
                    : "Enable notifications to get real-time alerts for new campaigns, updates, and IT responses."}
                </p>
                {notifPermission === "denied" && (
                  <p className="m-0 mt-0.5 text-[11px] text-[#7a7060] font-['JetBrains_Mono',monospace]">
                    To re-enable: click the 🔒 lock icon in your browser address bar → Notifications → Allow
                  </p>
                )}
              </div>
            </div>
            {notifPermission !== "denied" && (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-1.5 rounded border border-[#f0a030] bg-transparent text-[#f0a030] text-[11px] font-semibold cursor-pointer font-['Cinzel',serif] tracking-widest whitespace-nowrap transition-all duration-150 hover:bg-[#f0a030] hover:text-[#0c0906] shrink-0"
              >
                ENABLE
              </button>
            )}
          </div>
        )}

        {/* ── TASKS ── */}
        {activeSection === "tasks" && (
          <div className={`${isMobile ? "px-3.5 py-4" : "px-7 py-5.5"} flex-1 flex flex-col min-h-0`}>
            <CampaignsTable campaigns={campaigns} loading={camLoading} onAction={setActionTarget} isMobile={isMobile} title="ALL TASKS" showActionBtn />
          </div>
        )}

        {/* ── USERS ── */}
        {activeSection === "users" && (
          <div className={`${isMobile ? "px-3.5 py-4" : "px-7 py-5.5"} flex-1 overflow-y-auto`}>
            <PMUserSection users={users} loading={userLoading} onDelete={target => setDeleteTarget(target)} onRefresh={loadUsers} />
          </div>
        )}

        {/* ── MANAGE USERS ── */}
        {activeSection === "manage-users" && (
          <div className={`${isMobile ? "px-3.5 py-4" : "px-7 py-5.5"} flex-1 overflow-y-auto`}>
            <div className="max-w-135">
              <InfoBar color={T.gold} message="As a Process Manager, you can create Manager, IT, and other Process Manager accounts." />
              <div className={`bg-[#141310] border border-[#2e2c22] rounded-[10px] shadow-[0_2px_12px_rgba(0,0,0,0.3)] ${isMobile ? "p-[22px_18px]" : "p-[28px_28px_24px]"}`}>
                <p className="m-0 mb-1 text-[8px] tracking-[0.22em] text-[rgba(200,168,74,0.6)] font-['Cinzel',serif] uppercase">New Account</p>
                <h2 className="m-0 mb-5.5 text-lg font-semibold text-[#f5edd8] font-['Cinzel',serif]">Create User Account</h2>
                <CreateUserForm allowedRoles={["manager", "process manager", "it"]} onSuccess={handleUserCreated} />
              </div>
            </div>
          </div>
        )}

        {/* ── OPEN REQUESTS ── */}
        {activeSection === "open-requests" && (
          <div className={`${isMobile ? "px-3.5 py-4" : "px-7 py-5.5"} flex-1 flex flex-col min-h-0`}>
            <InfoBar color={T.teal} message={<>Tasks <strong className="text-[#f0a030]">awaiting your review</strong> or <strong className="text-[#3ecfb2]">approved</strong> and waiting for IT.</>} />
            <CampaignsTable campaigns={openRequests} loading={camLoading} onAction={setActionTarget} isMobile={isMobile} title="OPEN · PENDING & APPROVED" showActionBtn filterCards={OPEN_REQUEST_FILTER_CARDS} />
          </div>
        )}

        {/* ── CLOSED REQUESTS ── */}
        {activeSection === "closed-requests" && (
          <div className={`${isMobile ? "px-3.5 py-4" : "px-7 py-5.5"} flex-1 flex flex-col min-h-0`}>
            <InfoBar color={T.muted} message="Closed campaigns — marked Done, Not Done, or Cancelled." />
            <CampaignsTable campaigns={closedRequests} loading={camLoading} onAction={setActionTarget} isMobile={isMobile} title="CLOSED · DONE, NOT DONE & CANCELLED" showActionBtn={false} filterCards={CLOSED_REQUEST_FILTER_CARDS} />
          </div>
        )}

        {/* ── DAILY TASKS ── */}
        {activeSection === "daily-tasks" && (
          <div className={`${isMobile ? "px-3.5 py-4" : "px-7 py-5.5"} flex-1 overflow-y-auto`}>
            <InfoBar color={T.purple} message="Schedule recurring daily tasks for IT. Each task is automatically delivered to IT at the specified time every day." />
            <div className={`grid gap-6 items-start ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>

              {/* Create form */}
              <div className="bg-[#141310] border border-[#2e2c22] rounded-[10px] p-[24px_22px] shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
                <p className="m-0 mb-1 text-[8px] tracking-[0.22em] text-[rgba(200,168,74,0.6)] font-['Cinzel',serif] uppercase">New Schedule</p>
                <h2 className="m-0 mb-5 text-base font-semibold text-[#f5edd8] font-['Cinzel',serif]">Create Daily Task</h2>
                {taskError && (
                  <div className="px-3.5 py-2.5 rounded-lg mb-4 bg-[rgba(224,82,82,0.12)] border border-[rgba(224,82,82,0.27)] text-[#e05252] text-xs">{taskError}</div>
                )}
                {taskOk && (
                  <div className="px-3.5 py-2.5 rounded-lg mb-4 bg-[rgba(76,187,127,0.11)] border border-[rgba(76,187,127,0.27)] text-[#4cbb7f] text-xs flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    Daily task scheduled successfully
                  </div>
                )}
                <form onSubmit={handleCreateTask}>
                  <Field label="Task Description" hint="required">
                    <textarea
                      className={`${INPUT_CLS} rounded-lg resize-y leading-[1.6]`}
                      value={taskForm.task}
                      onChange={e => setTaskForm(f => ({ ...f, task: e.target.value }))}
                      placeholder="Describe the daily task for IT…"
                      rows={4}
                      required
                    />
                  </Field>
                  <Field label="Daily Delivery Time" hint="24-hour IST — sent to IT every day at this time">
                    <input
                      type="time"
                      className={`${INPUT_CLS} rounded-lg scheme-dark`}
                      value={taskForm.time}
                      onChange={e => setTaskForm(f => ({ ...f, time: e.target.value }))}
                      required
                    />
                  </Field>
                  <div className="border-t border-[#2e2c22] pt-4.5 mt-0.5">
                    <GoldBtn type="submit" disabled={taskCreating} style={{ width: "100%", padding: "12px" }}>
                      {taskCreating ? "Scheduling…" : "Schedule Daily Task"}
                    </GoldBtn>
                  </div>
                </form>
              </div>

              {/* Task list */}
              <div>
                <div className="flex justify-between items-center mb-3.5">
                  <p className="m-0 text-[8px] text-[#7a7060] tracking-[0.2em] font-['Cinzel',serif] uppercase">Scheduled Tasks</p>
                  <div className="flex gap-2 items-center">
                    <span className="px-2.25 py-0.5 rounded-full bg-[rgba(167,139,250,0.11)] border border-[rgba(167,139,250,0.27)] text-[9px] text-[#a78bfa] font-['JetBrains_Mono',monospace] font-semibold">
                      {activeTasks.length} active
                    </span>
                    <GoldBtn variant="outline" onClick={loadDailyTasks} style={{ padding: "5px 12px", fontSize: 9 }}>Refresh</GoldBtn>
                  </div>
                </div>

                {taskLoading ? (
                  <div className="py-10 px-5 text-center text-[#7a7060]">
                    <div className="w-7 h-7 rounded-full border-2 border-[#2e2c22] border-t-[#c9a42a] mx-auto mb-3 animate-[opsSpinner_0.8s_linear_infinite]" />
                    Loading…
                  </div>
                ) : dailyTasks.length === 0 ? (
                  <div className="py-10 px-5 text-center bg-[#141310] border border-[#2e2c22] rounded-[10px]">
                    <p className="m-0 text-[13px] text-[#f5edd8] font-['Cinzel',serif]">No Daily Tasks Yet</p>
                    <p className="m-0 mt-1.5 text-xs text-[#7a7060]">Create your first daily task using the form.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {dailyTasks.map(task => {
                      const isActive = task.isSchedule !== false;
                      const ackCount = task.itResponse?.length ?? 0;
                      return (
                        <div
                          key={task._id}
                          className={`bg-[#141310] rounded-lg p-[14px_16px] border-l-[3px] ${isActive ? "opacity-100" : "opacity-55"}`}
                          style={{
                            border: `1px solid ${isActive ? T.purpleBg : T.subtle}`,
                            borderLeftColor: isActive ? T.purple : T.muted,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <p className="m-0 text-[13px] text-[#e8ddc8] leading-[1.55] flex-1 wrap-break-word">{task.task}</p>
                            {isActive && (
                              <button
                                onClick={() => handleDeactivateTask(task._id)}
                                disabled={deactivatingId === task._id}
                                className={`px-2.5 py-0.75 rounded bg-[rgba(224,82,82,0.12)] border border-[rgba(224,82,82,0.27)] text-[#e05252] text-[9px] font-bold tracking-widest cursor-pointer font-['Cinzel',serif] shrink-0 ${deactivatingId === task._id ? "opacity-50" : "opacity-100"}`}
                              >
                                {deactivatingId === task._id ? "…" : "DEACTIVATE"}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-3.5 flex-wrap">
                            <span className="flex items-center gap-1.25 text-[11px] text-[#a78bfa] font-['JetBrains_Mono',monospace]">🕐 {task.time} daily</span>
                            <span className="text-[11px] text-[#7a7060] font-['JetBrains_Mono',monospace]">{ackCount} acknowledgement{ackCount !== 1 ? "s" : ""}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest font-['Cinzel',serif] ${isActive ? "bg-[rgba(167,139,250,0.11)] text-[#a78bfa] border border-[rgba(167,139,250,0.27)]" : "bg-[#2e2c22] text-[#7a7060] border border-transparent"}`}>
                              {isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                          {ackCount > 0 && (() => {
                            const latest = task.itResponse[task.itResponse.length - 1];
                            return (
                              <div className="mt-2.5 p-[8px_12px] bg-[#0a0908] rounded-md border border-[#2e2c22]">
                                <p className="m-0 mb-0.75 text-[8px] text-[#7a7060] tracking-[0.12em] font-['Cinzel',serif] uppercase">Latest IT Response</p>
                                <p className="m-0 text-[11px] text-[#3ecfb2] leading-normal whitespace-pre-wrap wrap-break-word">{latest.message}</p>
                                <p className="m-0 mt-1 text-[9px] text-[#7a7060] font-['JetBrains_Mono',monospace]">{fmt(latest.acknowledgedAt)}</p>
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

        {/* ── SAVED MESSAGES ── */}
        {activeSection === "saved-messages" && (
          <SavedMessagesSection isMobile={isMobile} />
        )}
      </main>

      {actionTarget && <ActionModal campaign={actionTarget} onClose={() => setActionTarget(null)} onSave={handleAction} />}
      {deleteTarget  && <DeleteUserModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={id => handleDeleteUser(id)} />}
    </div>
  );
}