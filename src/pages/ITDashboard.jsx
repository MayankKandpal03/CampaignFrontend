// src/pages/ITDashboard.jsx
/**
 * ITDashboard — updated.
 *
 * CHANGES:
 *  1. Sidebar nav — "Campaigns" + "Schedule Tasks" sections
 *  2. Campaigns section — removed "Requested At" column, added padding,
 *     PM Note cell now shows the FULL message (no truncation / ellipsis)
 *  3. "Done at [time]" automatically appended to every IT acknowledgement
 *     (both campaigns and daily tasks)
 *  4. Schedule Tasks section — daily tasks delivered via socket appear here;
 *     IT can acknowledge each one with a message
 */
import { useEffect, useState, useCallback } from "react";

import useCampaignStore from "../stores/useCampaignStore.js";
import useAuthStore     from "../stores/useAuthStore.js";
import useNotifStore    from "../stores/useNotificationStore.js";
import { useSocket }    from "../hooks/useSocket.js";
import api              from "../api/axios.js";

import { fmt, initials } from "../utils/formatters.js";
import AckModal          from "../components/campaigns/AckModal.jsx";

import "../styles/it.css";

/* ─── Local StatusBadge (IT uses CSS classes) ────────────────────────────── */
function StatusBadge({ value }) {
  const map = {
    approve:    ["badge-approve",  "Approved"],
    done:       ["badge-done",     "Done"],
    cancel:     ["badge-cancel",   "Cancelled"],
    transfer:   ["badge-transfer", "Transfer"],
    "not done": ["badge-notdone",  "Not Done"],
    pending:    ["badge-pending",  "Pending"],
  };
  const [cls, label] = map[value] || ["badge-pending", value || "—"];
  return <span className={`badge ${cls}`}>{label}</span>;
}

/* ─── Simple Daily Task Ack Modal ─────────────────────────────────────────── */
function TaskAckModal({ task, onClose, onConfirm, loading }) {
  const [message, setMessage] = useState("");

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Acknowledge Daily Task</div>
            <div className="modal-subtitle">
              {task.task?.slice(0, 70)}{task.task?.length > 70 ? "…" : ""}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="field-group">
            <label className="field-label">Scheduled Time</label>
            <p style={{ margin: 0, fontFamily: "var(--ff-mono)", fontSize: 13, color: "var(--accent)" }}>
              {task.time}
            </p>
          </div>

          <div className="field-group">
            <label className="field-label">Your Message (optional)</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add any notes about this task completion…"
              rows={3}
            />
          </div>

          <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", fontFamily: "var(--ff-mono)" }}>
            ℹ "Done at [time]" will be appended automatically.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Discard
          </button>
          <button
            className="btn btn-confirm"
            disabled={loading}
            onClick={() => onConfirm(task._id, message)}
          >
            {loading ? "Saving…" : "Confirm Done →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function ITDashboard() {
  const campaigns      = useCampaignStore(s => s.campaigns);
  const getCampaign    = useCampaignStore(s => s.getCampaign);
  const updateCampaign = useCampaignStore(s => s.updateCampaign);
  const { user, role, logout } = useAuthStore();
  const addNotification = useNotifStore(s => s.addNotification);
  const unread          = useNotifStore(s => s.unread);

  // ── Sidebar navigation ─────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState("campaigns");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  // ── Campaign acknowledgement ────────────────────────────────────────────────
  const [ackTarget,  setAckTarget]  = useState(null);
  const [ackLoading, setAckLoading] = useState(false);

  // ── Daily tasks state ───────────────────────────────────────────────────────
  const [dailyTasks,    setDailyTasks]    = useState([]);   // tasks in IT queue
  const [taskAckTarget, setTaskAckTarget] = useState(null);
  const [taskAckLoading,setTaskAckLoading]= useState(false);
  const [taskFetching,  setTaskFetching]  = useState(false);

  // ── Toasts ─────────────────────────────────────────────────────────────────
  const [toasts,     setToasts]     = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // ── Initial campaign fetch ─────────────────────────────────────────────────
  useEffect(() => { getCampaign().catch(console.error); }, [getCampaign]);

  // ── Load due daily tasks when section activates ────────────────────────────
  const fetchDueTasks = useCallback(async () => {
    setTaskFetching(true);
    try {
      const res = await api.get("/task/list");
      setDailyTasks(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to fetch daily tasks:", err);
    } finally {
      setTaskFetching(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === "schedule-tasks") {
      fetchDueTasks();
    }
  }, [activeSection, fetchDueTasks]);

  // ── Real-time socket handlers ──────────────────────────────────────────────
  useSocket({
    // Campaign events
    "campaign:it_queued": (c) => {
      useCampaignStore.setState((s) => {
        const exists = s.campaigns.some((x) => x._id === c._id);
        return {
          campaigns: exists
            ? s.campaigns.map((x) => (x._id === c._id ? c : x))
            : [c, ...s.campaigns],
        };
      });
      addNotification(
        `📋 New campaign in queue: "${c.message?.slice(0, 40)}${c.message?.length > 40 ? "…" : ""}"`
      );
    },
    "campaign:updated": (c) => {
      useCampaignStore.setState((s) => ({
        campaigns: s.campaigns.map((x) => (x._id === c._id ? c : x)),
      }));
    },
    "campaign:it_ack": (c) => {
      useCampaignStore.setState((s) => ({
        campaigns: s.campaigns.map((x) => (x._id === c._id ? c : x)),
      }));
    },
    "campaign:deleted": (d) => {
      useCampaignStore.setState((s) => ({
        campaigns: s.campaigns.filter((x) => x._id !== d._id),
      }));
    },

    // Daily task events — push task into the IT queue
    "dailytask:queued": (task) => {
      setDailyTasks((prev) => {
        const exists = prev.some((t) => t._id === task._id);
        return exists ? prev : [task, ...prev];
      });
      addNotification(
        `🗓 Daily task due: "${task.task?.slice(0, 40)}${task.task?.length > 40 ? "…" : ""}"`
      );
      pushToast(
        `Daily task arrived: "${task.task?.slice(0, 40)}${task.task?.length > 40 ? "…" : ""}"`,
      );
    },
  });

  // ── 60-second auto-refresh for campaigns ──────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => getCampaign().catch(console.error), 60_000);
    return () => clearInterval(id);
  }, [getCampaign]);

  // ── Derived campaign list ──────────────────────────────────────────────────
  const now = Date.now();
  const itCampaigns = campaigns.filter((c) => {
    if (c.action !== "approve")  return false;
    if (c.status  === "cancel")  return false;
    if (c.acknowledgement)       return false;
    if (c.scheduleAt) {
      return new Date(c.scheduleAt).getTime() <= now;
    }
    return true;
  });

  const doneCount    = campaigns.filter((c) => c.acknowledgement === "done").length;
  const pendingCount = itCampaigns.length;

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const pushToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await getCampaign().catch(console.error);
    setRefreshing(false);
    pushToast("Campaigns refreshed");
  };

  // ── Campaign acknowledgement ── appends "Done at [time]" ──────────────────
  const handleAck = async ({ acknowledgement, itMessage }) => {
    if (!ackTarget) return;
    setAckLoading(true);
    try {
      // Build "Done at" timestamp
      const doneAt = new Date().toLocaleString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
      });
      const finalMessage = itMessage
        ? `${itMessage}\n\nDone at ${doneAt}`
        : `Done at ${doneAt}`;

      await updateCampaign(ackTarget._id, { acknowledgement, itMessage: finalMessage });

      if (acknowledgement === "done") {
        addNotification(
          `✅ IT: Campaign "${ackTarget.message?.slice(0, 30)}…" marked Done by ${user}`
        );
        pushToast("Campaign acknowledged as Done. PMs & owner notified.");
      } else {
        addNotification(
          `⚠ IT: "${ackTarget.message?.slice(0, 30)}…" marked Not Done — Reason: ${itMessage}`
        );
        pushToast("Campaign marked Not Done.", "warn");
      }
      setAckTarget(null);
    } catch {
      pushToast("Failed to update. Please retry.", "warn");
    } finally {
      setAckLoading(false);
    }
  };

  // ── Daily task acknowledgement ── appends "Done at [time]" ────────────────
  const handleTaskAck = async (taskId, message) => {
    setTaskAckLoading(true);
    try {
      await api.post("/task/acknowledge", { id: taskId, message });
      // Remove task from local queue — it will come back tomorrow via socket
      setDailyTasks((prev) => prev.filter((t) => t._id !== taskId));
      setTaskAckTarget(null);
      pushToast("Daily task acknowledged. PMs notified.");
      addNotification(`✅ IT: Daily task acknowledged by ${user}`);
    } catch (err) {
      pushToast(
        err?.response?.data?.message || "Failed to acknowledge task.",
        "warn",
      );
    } finally {
      setTaskAckLoading(false);
    }
  };

  const NAV_ITEMS = [
    { id: "campaigns",      label: "Campaigns",      icon: "📋", count: pendingCount },
    { id: "schedule-tasks", label: "Schedule Tasks", icon: "🗓", count: dailyTasks.length },
  ];

  return (
    <div className="it-root">
      <div
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside className={`it-sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">
            Campaign<i style={{ fontStyle: "normal", opacity: 0.4 }}>.</i>
          </div>
          <div className="sidebar-brand-sub">IT Portal</div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initials(user || "IT")}</div>
          <div>
            <div className="user-info-name">{user || "IT User"}</div>
            <div className="user-info-role">{role}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.count > 0 && (
                <span style={{
                  padding:      "1px 7px",
                  borderRadius: 99,
                  background:   activeSection === item.id ? "var(--accent)" : "var(--surface3)",
                  color:        activeSection === item.id ? "#fff" : "var(--muted)",
                  fontSize:     10,
                  fontFamily:   "var(--ff-mono)",
                  fontWeight:   700,
                }}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <span>↩</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="it-main">
        <header className="it-header">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span /><span /><span />
          </button>
          <h1 className="header-title">
            {activeSection === "campaigns" ? "Scheduled Campaigns" : "Schedule Tasks"}
          </h1>
          <span className="header-badge">
            {activeSection === "campaigns"
              ? `${pendingCount} Pending`
              : `${dailyTasks.length} Due`}
          </span>
          <div
            className="notif-bell"
            title={`${unread} unread notifications`}
            onClick={() => pushToast(`You have ${unread} notification(s)`)}
          >
            🔔
            {unread > 0 && <span className="notif-dot" />}
          </div>
        </header>

        {/* ════════════════ CAMPAIGNS SECTION ════════════════ */}
        {activeSection === "campaigns" && (
          <div className="it-content">
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Pending Action</div>
                <div className="stat-value">{pendingCount}</div>
                <div className="stat-sub">Scheduled &amp; awaiting acknowledgement</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{doneCount}</div>
                <div className="stat-sub">Acknowledged as done</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Approved</div>
                <div className="stat-value">
                  {campaigns.filter((c) => c.action === "approve").length}
                </div>
                <div className="stat-sub">Approved by PM (all time)</div>
              </div>
            </div>

            <div className="section-head">
              <span className="section-title">Request Queue</span>
              <button
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? "⟳ Refreshing…" : "⟳ Refresh"}
              </button>
            </div>

            <div className="table-wrap">
              {itCampaigns.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">✅</div>
                  <div className="table-empty-text">
                    No campaigns due yet. Queue is clear.
                  </div>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      {/* "Requested At" column removed as requested */}
                      <th>PM Note</th>
                      <th>Scheduled At</th>
                      <th>Status</th>
                      <th>Action</th>
                      <th>Acknowledge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itCampaigns.map((c) => (
                      <tr key={c._id}>
                        {/*
                          FIX: Show full PM note — removed msg-cell class (which
                          applied max-width + overflow:hidden + text-overflow:ellipsis).
                          The note now wraps naturally. Added padding for readability.
                        */}
                        <td style={{
                          maxWidth:   320,
                          wordBreak:  "break-word",
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.6,
                          padding:    "16px 18px",
                        }}>
                          {c.pmMessage || "—"}
                        </td>
                        <td className="time-cell" style={{ padding: "16px 18px" }}>
                          {fmt(c.scheduleAt)}
                        </td>
                        <td style={{ padding: "16px 18px" }}>
                          <StatusBadge value={c.status} />
                        </td>
                        <td style={{ padding: "16px 18px" }}>
                          <StatusBadge value={c.action} />
                        </td>
                        <td style={{ padding: "16px 18px" }}>
                          <button
                            className="ack-btn"
                            onClick={() => setAckTarget(c)}
                          >
                            ✓ Acknowledge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ════════════════ SCHEDULE TASKS SECTION ════════════════ */}
        {activeSection === "schedule-tasks" && (
          <div className="it-content">
            <div className="stats-row" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
              <div className="stat-card">
                <div className="stat-label">Due Now</div>
                <div className="stat-value">{dailyTasks.length}</div>
                <div className="stat-sub">Daily tasks awaiting acknowledgement</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Status</div>
                <div className="stat-value" style={{ fontSize: 22, color: "var(--accent)" }}>
                  {dailyTasks.length === 0 ? "✓ Clear" : "⏳ Pending"}
                </div>
                <div className="stat-sub">
                  {dailyTasks.length === 0
                    ? "All tasks acknowledged for today"
                    : `${dailyTasks.length} task(s) need attention`}
                </div>
              </div>
            </div>

            <div className="section-head">
              <span className="section-title">Today's Task Queue</span>
              <button
                className="refresh-btn"
                onClick={fetchDueTasks}
                disabled={taskFetching}
              >
                {taskFetching ? "⟳ Loading…" : "⟳ Refresh"}
              </button>
            </div>

            <div className="table-wrap">
              {taskFetching ? (
                <div className="table-empty">
                  <div className="table-empty-icon" style={{ fontSize: 28 }}>⏳</div>
                  <div className="table-empty-text">Loading tasks…</div>
                </div>
              ) : dailyTasks.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">✅</div>
                  <div className="table-empty-text">
                    No tasks due right now. Check back at the scheduled times.
                  </div>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Scheduled Time</th>
                      <th>Created By</th>
                      <th>Acknowledge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyTasks.map((t) => {
                      const creatorName =
                        typeof t.createdBy === "object"
                          ? t.createdBy?.username
                          : "PM";
                      return (
                        <tr key={t._id}>
                          <td style={{
                            maxWidth:   400,
                            wordBreak:  "break-word",
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.6,
                            padding:    "16px 18px",
                          }}>
                            {t.task}
                          </td>
                          <td className="time-cell" style={{ padding: "16px 18px" }}>
                            {t.time}
                          </td>
                          <td style={{ padding: "16px 18px", fontSize: 13 }}>
                            {creatorName}
                          </td>
                          <td style={{ padding: "16px 18px" }}>
                            <button
                              className="ack-btn"
                              onClick={() => setTaskAckTarget(t)}
                            >
                              ✓ Acknowledge
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Campaign Ack Modal ── */}
      {ackTarget && (
        <AckModal
          campaign={ackTarget}
          onClose={() => setAckTarget(null)}
          onConfirm={handleAck}
          loading={ackLoading}
        />
      )}

      {/* ── Daily Task Ack Modal ── */}
      {taskAckTarget && (
        <TaskAckModal
          task={taskAckTarget}
          onClose={() => setTaskAckTarget(null)}
          onConfirm={handleTaskAck}
          loading={taskAckLoading}
        />
      )}

      {/* ── Toast notifications ── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === "warn" ? "warn" : ""}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}