// src/pages/ITDashboard.jsx
import { useEffect, useState, useCallback, useMemo, useRef } from "react";

import useCampaignStore from "../stores/useCampaignStore.js";
import useAuthStore     from "../stores/useAuthStore.js";
import useNotifStore    from "../stores/useNotificationStore.js";
import { useSocket }    from "../hooks/useSocket.js";
import { useLogout }    from "../hooks/useLogout.js";
import { useNotifications } from "../hooks/useNotifications.js";
import api              from "../api/axios.js";

import { fmt, initials } from "../utils/formatters.js";
import AckModal          from "../components/campaigns/AckModal.jsx";
import ITNotifPanel      from "../components/common/ITNotifPanel.jsx";
import {
  triggerAlert,
  unregisterPushSubscription,
} from "../utils/notifications.js";

import "../styles/it.css";

/* ─── Local StatusBadge ──────────────────────────────────────────────────── */
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

/* ─── Notification Permission Banner ─────────────────────────────────────── */
function NotifPermissionBanner({ permission, onRequest }) {
  if (permission === "granted" || permission === "unsupported") return null;
  const isDenied = permission === "denied";
  return (
    <div className={`flex items-center justify-between gap-3 px-7 py-2.5 flex-wrap ${isDenied ? "bg-[var(--danger-lt)] border-b border-[rgba(184,48,48,0.2)]" : "bg-[var(--warn-lt)] border-b border-[rgba(143,66,12,0.2)]"}`}>
      <div className="flex items-center gap-2.25">
        <span className="text-base">{isDenied ? "🔕" : "🔔"}</span>
        <div>
          <p className={`m-0 text-xs font-medium font-[var(--ff-body)] ${isDenied ? "text-[var(--danger)]" : "text-[var(--warn)]"}`}>
            {isDenied
              ? "Desktop notifications are blocked — you won't be alerted on other tabs."
              : "Enable desktop notifications to receive alerts when you're on other tabs or apps."}
          </p>
          {isDenied && (
            <p className="m-0 mt-0.5 text-[11px] text-[var(--muted)] font-[var(--ff-mono)]">
              To re-enable: click the 🔒 lock icon in your browser address bar → Notifications → Allow
            </p>
          )}
        </div>
      </div>
      {!isDenied && (
        <button
          onClick={onRequest}
          className="px-4 py-[7px] rounded-[var(--radius-sm)] border-[1.5px] border-[var(--warn)] bg-[var(--warn-lt)] text-[var(--warn)] font-[var(--ff-body)] text-xs font-semibold cursor-pointer whitespace-nowrap transition-all duration-150 shrink-0 hover:bg-[var(--warn)] hover:text-white">
          Enable Notifications
        </button>
      )}
    </div>
  );
}

/* ─── Daily Task Ack Modal ────────────────────────────────────────────────── */
function TaskAckModal({ task, onClose, onConfirm, loading }) {
  const [message, setMessage] = useState("");
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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
            <p className="m-0 font-[var(--ff-mono)] text-[13px] text-[var(--accent)]">{task.time}</p>
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
          <p className="m-0 text-[11px] text-[var(--muted)] font-[var(--ff-mono)]">
            ℹ "Done at [time]" will be appended automatically.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Discard</button>
          <button className="btn btn-confirm" disabled={loading} onClick={() => onConfirm(task._id, message)}>
            {loading ? "Saving…" : "Confirm Done →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Persistent Overlay Notification Card ───────────────────────────────── */
function OverlayNotif({ notif, queueLength, onAck, onClose }) {
  const isCampaign  = notif.type === "campaign";
  const accentColor = isCampaign ? "var(--accent)" : "var(--info)";
  const accentBg    = isCampaign ? "var(--accent-lt)" : "var(--info-lt)";
  return (
    <div className="fixed inset-0 z-[99999] bg-[rgba(18,17,12,0.85)] backdrop-blur-lg flex items-center justify-center p-6 animate-[itOverlayIn_0.3s_cubic-bezier(.22,1,.36,1)_both]">
      <style>{`
        @keyframes itOverlayIn { from{opacity:0}to{opacity:1} }
        @keyframes itCardIn    { from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none} }
        @keyframes itPulseRing { 0%{transform:scale(1);opacity:.9}70%{transform:scale(1.7);opacity:0}100%{transform:scale(1.7);opacity:0} }
        @keyframes itBounceIn  { 0%{transform:scale(.3)}50%{transform:scale(1.07)}70%{transform:scale(.96)}100%{transform:scale(1)} }
      `}</style>
      <div
        className="w-full max-w-[500px] bg-[var(--surface)] rounded-[20px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.6),0_0_0_1px_rgba(255,255,255,.05)] animate-[itCardIn_.35s_cubic-bezier(.22,1,.36,1)_both]"
        style={{ border: `1px solid ${isCampaign ? "rgba(42,96,72,0.4)" : "rgba(26,79,110,0.4)"}` }}
      >
        <div className="h-1" style={{ background: isCampaign ? "linear-gradient(90deg,var(--accent),#3a7a5a)" : "linear-gradient(90deg,var(--info),#2a6a8e)" }} />
        <div className="px-7 pt-6 pb-4.5 bg-[var(--surface2)] border-b border-[var(--border)] flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full animate-[itPulseRing_1.6s_ease-out_infinite]" style={{ background: accentBg }} />
            <div
              className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-[22px] relative animate-[itBounceIn_.5s_cubic-bezier(.22,1,.36,1)_.1s_both]"
              style={{ background: accentBg, border: `2px solid ${accentColor}` }}
            >
              {isCampaign ? "📋" : "🗓"}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="m-0 mb-1 text-[10px] font-[var(--ff-mono)] tracking-[0.1em] uppercase font-semibold" style={{ color: accentColor }}>
              {isCampaign ? "🔴 New Task Assigned" : "⏰ Daily Task Due Now"}
            </p>
            <h2 className="m-0 mb-0.75 text-[19px] font-bold text-[var(--text)] font-[var(--ff-display)] tracking-[-0.02em] leading-[1.2]">{notif.title}</h2>
            <p className="m-0 text-[11px] text-[var(--muted)] font-[var(--ff-mono)]">
              Received {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              {queueLength > 1 && <span className="ml-2 px-2 py-px rounded-full bg-[var(--danger-lt)] text-[var(--danger)] border border-[rgba(184,48,48,.2)] text-[10px]">+{queueLength - 1} more waiting</span>}
            </p>
          </div>
        </div>
        <div className="px-7 py-5">
          <div className="p-[13px_16px] bg-[var(--surface3)] border border-[var(--border)] rounded-[10px] mb-3.5">
            <p className="m-0 mb-1.5 text-[8px] font-[var(--ff-mono)] tracking-[0.1em] uppercase text-[var(--muted)]">{isCampaign ? "PM Note / Message" : "Task Description"}</p>
            <p className="m-0 text-sm text-[var(--ink)] leading-[1.65] break-words font-[var(--ff-body)]">{notif.body || "—"}</p>
          </div>
          <div className="flex items-start gap-2.25 p-[10px_14px] bg-[rgba(143,66,12,.07)] border border-[rgba(143,66,12,.18)] rounded-lg mb-5">
            <span className="text-sm shrink-0 mt-px">⚠️</span>
            <p className="m-0 text-xs text-[var(--warn)] leading-[1.55] font-[var(--ff-body)]">This notification requires your attention. Acknowledge to confirm, or dismiss to handle it later.</p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 p-3 rounded-[10px] border-[1.5px] border-[var(--border2)] bg-transparent font-[var(--ff-body)] text-[13px] font-medium text-[var(--muted)] cursor-pointer transition-all duration-150 hover:text-[var(--ink)] hover:bg-[var(--surface2)]">
              Dismiss (handle later)
            </button>
            <button
              onClick={() => onAck(notif)}
              className="flex-[2] p-3 rounded-[10px] border-[1.5px] border-transparent text-white font-[var(--ff-body)] text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 shadow-[0_4px_16px_rgba(0,0,0,.15)] hover:opacity-90 hover:-translate-y-px"
              style={{ background: isCampaign ? "linear-gradient(135deg,var(--accent),#3a7a5a)" : "linear-gradient(135deg,var(--info),#2a6a8e)" }}>
              <span className="text-base">✓</span> Acknowledge Now
            </button>
          </div>
        </div>
        <div className="px-7 py-2.5 bg-[var(--surface2)] border-t border-[var(--border)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-[itPulseRing_1.6s_ease-out_infinite]" style={{ background: accentColor }} />
          <p className="m-0 text-[11px] text-[var(--muted)] font-[var(--ff-mono)]">IT Portal · Campaign Management System</p>
        </div>
      </div>
    </div>
  );
}

/* ─── History Table ───────────────────────────────────────────────────────── */
function HistoryTable({ records, loading }) {
  if (loading) {
    return (
      <div className="table-empty">
        <div className="table-empty-icon text-[28px]">⏳</div>
        <div className="table-empty-text">Loading history…</div>
      </div>
    );
  }
  if (records.length === 0) {
    return (
      <div className="table-empty">
        <div className="table-empty-icon">📭</div>
        <div className="table-empty-text">No acknowledged campaigns yet. History will appear here after you acknowledge tasks.</div>
      </div>
    );
  }
  return (
    <table>
      <thead className="sticky top-0 z-[1] bg-[var(--surface2)]">
        <tr>
          <th className="w-[38%]">PM Note</th>
          <th className="w-[18%] whitespace-nowrap">Schedule Time</th>
          <th className="w-[44%]">IT Note</th>
        </tr>
      </thead>
      <tbody>
        {records.map(c => {
          const isDone    = c.acknowledgement === "done";
          const noteColor = isDone ? "var(--accent)" : "var(--warn)";
          return (
            <tr key={c._id}>
              <td className="p-[16px_18px] max-w-0 break-words whitespace-pre-wrap leading-[1.65] align-top">
                {c.pmMessage
                  ? <span className="text-[13px] text-[var(--ink)] font-[var(--ff-body)]">{c.pmMessage}</span>
                  : <span className="text-xs text-[var(--muted)] italic">No PM note</span>}
              </td>
              <td className="time-cell p-[16px_18px] align-top whitespace-nowrap">
                {c.scheduleAt ? fmt(c.scheduleAt) : "—"}
              </td>
              <td
                className="p-[16px_18px] max-w-0 align-top break-words whitespace-pre-wrap leading-[1.65]"
                style={{ borderLeft: `3px solid ${noteColor}` }}
              >
                {c.itMessage
                  ? <span className="text-[13px] text-[var(--ink)] font-[var(--ff-body)]">{c.itMessage}</span>
                  : <span className="text-xs text-[var(--muted)] italic">No IT note</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function ITDashboard() {
  const campaigns      = useCampaignStore(s => s.campaigns);
  const getCampaign    = useCampaignStore(s => s.getCampaign);
  const updateCampaign = useCampaignStore(s => s.updateCampaign);
  const { user, role } = useAuthStore();
  const addNotification = useNotifStore(s => s.addNotification);
  const unread          = useNotifStore(s => s.unread);
  const markRead        = useNotifStore(s => s.markRead);

  // ── Notifications (permission + push registration) ────────────────────────
  const { notifPermission, handleRequestPermission } = useNotifications();

  const _handleLogout = useLogout();
  const handleLogout = useCallback(async () => {
    await unregisterPushSubscription().catch(() => {});
    _handleLogout();
  }, [_handleLogout]);

  const [activeSection,     setActiveSection]     = useState("tasks");
  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [showNotifs,        setShowNotifs]        = useState(false);
  const [ackTarget,         setAckTarget]         = useState(null);
  const [ackLoading,        setAckLoading]        = useState(false);
  const [dailyTasks,        setDailyTasks]        = useState([]);
  const [taskAckTarget,     setTaskAckTarget]     = useState(null);
  const [taskAckLoading,    setTaskAckLoading]    = useState(false);
  const [taskFetching,      setTaskFetching]      = useState(false);
  const [toasts,            setToasts]            = useState([]);
  const [refreshing,        setRefreshing]        = useState(false);
  const [overlayQueue,      setOverlayQueue]      = useState([]);
  const [history,           setHistory]           = useState([]);
  const [historyLoading,    setHistoryLoading]    = useState(false);
  const [historyRefreshing, setHistoryRefreshing] = useState(false);

  const historyLoadedRef = useRef(false);

  // ── History fetch ─────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async (showSpinner = true) => {
    if (showSpinner) setHistoryLoading(true);
    else setHistoryRefreshing(true);
    try {
      const res = await api.get("/campaign/history");
      setHistory(res.data?.data ?? []);
      historyLoadedRef.current = true;
    } catch (err) {
      console.error("Failed to fetch IT history:", err);
    } finally {
      setHistoryLoading(false);
      setHistoryRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === "history") fetchHistory();
  }, [activeSection, fetchHistory]);

  // ── Notification bell click-outside ───────────────────────────────────────
  const notifBellRef = useRef(null);
  useEffect(() => {
    if (!showNotifs) return;
    const handler = e => {
      if (notifBellRef.current && !notifBellRef.current.contains(e.target))
        setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifs]);

  // ── BroadcastChannel (multi-tab overlay sync) ─────────────────────────────
  const bcRef = useRef(null);
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const bc = new BroadcastChannel("it_portal_notifications");
    bcRef.current = bc;
    bc.onmessage = ({ data }) => {
      if (data?.type !== "overlay_push") return;
      const notif = data.notif;
      setOverlayQueue(prev =>
        prev.some(n => n.id === notif.id) ? prev : [...prev, notif]
      );
      import("../utils/notifications.js").then(m => m.playNotificationSound());
    };
    return () => { bc.close(); bcRef.current = null; };
  }, []);

  const currentOverlay = overlayQueue[0] ?? null;

  const pushOverlay = useCallback((notif) => {
    const entry = { ...notif, id: Date.now() + Math.random() };
    setOverlayQueue(prev => [...prev, entry]);
    bcRef.current?.postMessage({ type: "overlay_push", notif: entry });
  }, []);

  const dismissOverlay = useCallback(() => setOverlayQueue(prev => prev.slice(1)), []);
  const ackFromOverlay = useCallback((notif) => {
    dismissOverlay();
    if (notif.type === "campaign") setAckTarget(notif.item);
    else if (notif.type === "task") setTaskAckTarget(notif.item);
  }, [dismissOverlay]);

  // ── Reactive now (schedule display) ──────────────────────────────────────
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
    const id = setTimeout(() => setNow(Date.now()), nextTime - currentReal + 200);
    return () => clearTimeout(id);
  }, [campaigns, now]);

  // ── Fetch daily tasks ─────────────────────────────────────────────────────
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
    getCampaign().catch(console.error);
    fetchDueTasks();
  }, [getCampaign, fetchDueTasks]);

  // Poll every 60s as a fallback
  useEffect(() => {
    const c = setInterval(() => getCampaign().catch(console.error), 60_000);
    const t = setInterval(() => fetchDueTasks(), 60_000);
    return () => { clearInterval(c); clearInterval(t); };
  }, [getCampaign, fetchDueTasks]);

  useEffect(() => {
    if (activeSection === "schedule-tasks") fetchDueTasks();
  }, [activeSection, fetchDueTasks]);

  // ── Socket handlers ───────────────────────────────────────────────────────
  useSocket({
    "campaign:it_queued": c => {
      useCampaignStore.setState(s => {
        const exists = s.campaigns.some(x => x._id === c._id);
        return {
          campaigns: exists
            ? s.campaigns.map(x => x._id === c._id ? c : x)
            : [c, ...s.campaigns],
        };
      });
      const msgPreview = (c.pmMessage || c.message || "New task assigned").slice(0, 120);
      addNotification(`📋 New campaign in queue: "${msgPreview}${msgPreview.length >= 120 ? "…" : ""}"`);
      triggerAlert(
        "📋 New Task Assigned",
        c.pmMessage || c.message?.slice(0, 200) || "A new campaign requires your acknowledgement.",
      );
      pushOverlay({
        type:  "campaign",
        title: "New Task Assigned",
        body:  c.pmMessage || c.message?.slice(0, 200) || "A new campaign requires your acknowledgement.",
        item:  c,
      });
    },

    "campaign:updated": c => {
      useCampaignStore.setState(s => ({
        campaigns: s.campaigns.map(x => x._id === c._id ? c : x),
      }));
    },

    "campaign:schedule_fired": c => {
      useCampaignStore.setState(s => ({
        campaigns: s.campaigns.map(x => x._id === c._id ? c : x),
      }));
    },

    "campaign:it_ack": c => {
      useCampaignStore.setState(s => ({
        campaigns: s.campaigns.map(x => x._id === c._id ? c : x),
      }));
      if (historyLoadedRef.current) {
        setHistory(prev => {
          const exists = prev.some(x => x._id === c._id);
          if (exists) return prev.map(x => x._id === c._id ? c : x);
          return [c, ...prev];
        });
      }
    },

    "campaign:deleted": d => {
      useCampaignStore.setState(s => ({
        campaigns: s.campaigns.filter(x => x._id !== d._id),
      }));
    },

    "dailytask:queued": task => {
      setDailyTasks(prev => {
        const exists = prev.some(t => String(t._id) === String(task._id));
        return exists ? prev : [task, ...prev];
      });
      const taskPreview = (task.task || "Daily task needs acknowledgement").slice(0, 100);
      addNotification(`🗓 Daily task due: "${taskPreview}${taskPreview.length >= 100 ? "…" : ""}"`);
      triggerAlert(
        "⏰ Daily Task Due Now",
        task.task?.slice(0, 200) || "A scheduled daily task requires your acknowledgement.",
      );
      pushOverlay({
        type:  "task",
        title: "Daily Task Due Now",
        body:  task.task?.slice(0, 200) || "A scheduled daily task requires your acknowledgement.",
        item:  task,
      });
    },

    "dailytask:acked": t => {
      setDailyTasks(prev =>
        prev.filter(task => String(task._id) !== String(t._id))
      );
    },
  });

  // ── Derived campaign list ─────────────────────────────────────────────────
  const itCampaigns = useMemo(() => campaigns.filter(c => {
    if (c.action !== "approve") return false;
    if (c.status  === "cancel") return false;
    if (c.acknowledgement)      return false;
    if (c.scheduleAt) return new Date(c.scheduleAt).getTime() <= now;
    return true;
  }), [campaigns, now]);

  const pendingCount = itCampaigns.length;

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const pushToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await getCampaign().catch(console.error);
    setRefreshing(false);
    pushToast("Tasks refreshed");
  };

  // ── Campaign acknowledge ──────────────────────────────────────────────────
  const handleAck = async ({ acknowledgement, itMessage }) => {
    if (!ackTarget) return;
    setAckLoading(true);
    try {
      const doneAt = new Date().toLocaleString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
      });
      const finalMessage = itMessage
        ? `${itMessage}\n\nat ${doneAt} by ${user}`
        : `at ${doneAt} by ${user}`;
      await updateCampaign(ackTarget._id, { acknowledgement, itMessage: finalMessage });
      if (acknowledgement === "done") {
        addNotification(`✅ Campaign "${ackTarget.message?.slice(0, 30)}…" marked Done by ${user}`);
        pushToast("Task acknowledged as Done. PMs & owner notified.");
      } else {
        addNotification(`⚠ "${ackTarget.message?.slice(0, 30)}…" marked Not Done`);
        pushToast("Task marked Not Done.", "warn");
      }
      setAckTarget(null);
    } catch {
      pushToast("Failed to update. Please retry.", "warn");
    } finally {
      setAckLoading(false);
    }
  };

  // ── Daily task acknowledge ────────────────────────────────────────────────
  const handleTaskAck = async (taskId, message) => {
    setTaskAckLoading(true);
    try {
      await api.post("/task/acknowledge", { id: taskId, message });
      setDailyTasks(prev => prev.filter(t => String(t._id) !== String(taskId)));
      setTaskAckTarget(null);
      pushToast("Daily task acknowledged. PMs notified.");
      addNotification(`✅ Daily task acknowledged by ${user}`);
    } catch (err) {
      pushToast(err?.response?.data?.message || "Failed to acknowledge task.", "warn");
    } finally {
      setTaskAckLoading(false);
    }
  };

  // ── Nav ───────────────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    { id: "tasks",          label: "Tasks",          icon: "📋", count: pendingCount      },
    { id: "schedule-tasks", label: "Schedule Tasks", icon: "🗓", count: dailyTasks.length },
    { id: "history",        label: "History",        icon: "🕓", count: history.length    },
  ];

  return (
    <div className="it-root h-screen overflow-hidden">
      <div className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ── Sidebar ── */}
      <aside className={`it-sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">Task<i className="not-italic opacity-40">.</i></div>
          <div className="sidebar-brand-sub">IT Portal</div>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{initials(user || "IT")}</div>
          <div>
            <div className="user-info-name">{user || "IT User"}</div>
            <div className="user-info-role">{role}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.count > 0 && (
                <span className={`px-[7px] py-px rounded-full text-[10px] font-[var(--ff-mono)] font-bold ${activeSection === item.id ? "bg-[var(--accent)] text-white" : "bg-[var(--surface3)] text-[var(--muted)]"}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}><span>↩</span> Sign Out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="it-main flex flex-col overflow-hidden">
        <NotifPermissionBanner permission={notifPermission} onRequest={handleRequestPermission} />

        {/* ── Header ── */}
        <header className="it-header">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span /><span /><span />
          </button>
          <h1 className="header-title">
            {activeSection === "tasks"          && "Scheduled Campaigns"}
            {activeSection === "schedule-tasks" && "Schedule Tasks"}
            {activeSection === "history"        && "Acknowledgement History"}
          </h1>
          <span className="header-badge">
            {activeSection === "tasks"          && `${pendingCount} Pending`}
            {activeSection === "schedule-tasks" && `${dailyTasks.length} Due`}
            {activeSection === "history"        && `${history.length} Records`}
          </span>

          {/* Notification Bell */}
          <div className="relative" ref={notifBellRef}>
            <button
              onClick={() => { setShowNotifs(v => !v); if (!showNotifs) markRead(); }}
              title={`${unread} unread notifications`}
              className={`notif-bell w-[46px] h-9 ${showNotifs ? "border-[1.5px] border-[var(--accent)] bg-[var(--accent-lt)] shadow-[0_2px_8px_rgba(42,96,72,.15)]" : "border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] hover:border-[var(--border2)] hover:bg-[var(--surface2)]"}`}
              aria-label="Notifications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={showNotifs ? "var(--accent)" : "var(--muted)"} strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-[var(--danger)] text-white text-[9px] font-[var(--ff-mono)] font-bold flex items-center justify-center px-[3px] border-2 border-[var(--bg)]">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
              {overlayQueue.length > 0 && unread === 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--warn)] border-2 border-[var(--bg)]" />
              )}
            </button>
            <ITNotifPanel open={showNotifs} onClose={() => setShowNotifs(false)} width={310} />
          </div>
        </header>

        {/* ══════ CAMPAIGNS ══════ */}
        {activeSection === "tasks" && (
          <div className="it-content flex-1 flex flex-col overflow-hidden">
            <div className="section-head shrink-0">
              <span className="section-title">Request Queue</span>
              <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? "⟳ Refreshing…" : "⟳ Refresh"}
              </button>
            </div>
            <div className="table-wrap flex-1 overflow-auto">
              {itCampaigns.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">✅</div>
                  <div className="table-empty-text">No campaigns due yet. Queue is clear.</div>
                </div>
              ) : (
                <table>
                  <thead className="sticky top-0 z-[1] bg-[var(--surface2)]">
                    <tr><th>PM Note</th><th>Scheduled At</th><th>Status</th><th>Action</th><th>Acknowledge</th></tr>
                  </thead>
                  <tbody>
                    {itCampaigns.map(c => (
                      <tr key={c._id}>
                        <td className="max-w-[320px] break-words whitespace-pre-wrap leading-[1.6] p-[16px_18px]">{c.pmMessage || "—"}</td>
                        <td className="time-cell p-[16px_18px]">{fmt(c.scheduleAt)}</td>
                        <td className="p-[16px_18px]"><StatusBadge value={c.status} /></td>
                        <td className="p-[16px_18px]"><StatusBadge value={c.action} /></td>
                        <td className="p-[16px_18px]">
                          <button className="ack-btn" onClick={() => setAckTarget(c)}>✓ Acknowledge</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══════ SCHEDULE TASKS ══════ */}
        {activeSection === "schedule-tasks" && (
          <div className="it-content flex-1 flex flex-col overflow-hidden">
            <div className="section-head shrink-0">
              <span className="section-title">Today's Task Queue</span>
              <button className="refresh-btn" onClick={fetchDueTasks} disabled={taskFetching}>
                {taskFetching ? "⟳ Loading…" : "⟳ Refresh"}
              </button>
            </div>
            <div className="table-wrap flex-1 overflow-auto">
              {taskFetching ? (
                <div className="table-empty">
                  <div className="table-empty-icon text-[28px]">⏳</div>
                  <div className="table-empty-text">Loading tasks…</div>
                </div>
              ) : dailyTasks.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">✅</div>
                  <div className="table-empty-text">No tasks due right now. Check back at the scheduled times.</div>
                </div>
              ) : (
                <table>
                  <thead className="sticky top-0 z-[1] bg-[var(--surface2)]">
                    <tr><th>Task</th><th>Scheduled Time</th><th>Created By</th><th>Acknowledge</th></tr>
                  </thead>
                  <tbody>
                    {dailyTasks.map(t => {
                      const creatorName = typeof t.createdBy === "object" ? t.createdBy?.username : "PM";
                      return (
                        <tr key={t._id}>
                          <td className="max-w-[400px] break-words whitespace-pre-wrap leading-[1.6] p-[16px_18px]">{t.task}</td>
                          <td className="time-cell p-[16px_18px]">{t.time}</td>
                          <td className="p-[16px_18px] text-[13px]">{creatorName}</td>
                          <td className="p-[16px_18px]">
                            <button className="ack-btn" onClick={() => setTaskAckTarget(t)}>✓ Acknowledge</button>
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

        {/* ══════ HISTORY ══════ */}
        {activeSection === "history" && (
          <div className="it-content flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-5 mb-4 px-4 py-2.5 bg-[var(--surface2)] border border-[var(--border)] rounded-[var(--radius-sm)] shrink-0 flex-wrap">
              <span className="text-[11px] text-[var(--muted)] font-[var(--ff-mono)]">IT NOTE border colour:</span>
              <span className="flex items-center gap-1.5 text-[11px] font-[var(--ff-body)] text-[var(--accent)]">
                <span className="inline-block w-[3px] h-3.5 bg-[var(--accent)] rounded-sm" />Done
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-[var(--ff-body)] text-[var(--warn)]">
                <span className="inline-block w-[3px] h-3.5 bg-[var(--warn)] rounded-sm" />Not Done
              </span>
            </div>
            <div className="section-head shrink-0">
              <span className="section-title">Acknowledgement History</span>
              <button className="refresh-btn" onClick={() => fetchHistory(false)} disabled={historyRefreshing}>
                {historyRefreshing ? "⟳ Refreshing…" : "⟳ Refresh"}
              </button>
            </div>
            <div className="table-wrap flex-1 overflow-auto">
              <HistoryTable records={history} loading={historyLoading} />
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {ackTarget     && <AckModal campaign={ackTarget} onClose={() => setAckTarget(null)} onConfirm={handleAck} loading={ackLoading} />}
      {taskAckTarget && <TaskAckModal task={taskAckTarget} onClose={() => setTaskAckTarget(null)} onConfirm={handleTaskAck} loading={taskAckLoading} />}
      {currentOverlay && <OverlayNotif notif={currentOverlay} queueLength={overlayQueue.length} onClose={dismissOverlay} onAck={ackFromOverlay} />}

      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast ${t.type === "warn" ? "warn" : ""}`}>{t.msg}</div>)}
      </div>
    </div>
  );
}