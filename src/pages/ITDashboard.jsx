// src/pages/ITDashboard.jsx
/**
 * FIXES applied in this version:
 *  1. LOGOUT: Uses useLogout hook (logout + navigate).
 *  2. SCHEDULED CAMPAIGNS: Reactive `now` state + justFired check.
 *  3. Daily tasks fetched on mount.
 *
 * NEW — Overlay Notification System (IT only):
 *  When a new campaign (campaign:it_queued) or daily task (dailytask:queued)
 *  arrives via socket:
 *    a) A three-tone chime plays via Web Audio API.
 *    b) A native OS-level browser notification appears above ALL applications,
 *       even when the user is on a different tab or another app entirely.
 *       It uses `requireInteraction: true` so it persists until dismissed.
 *    c) An in-app full-screen overlay card appears on top of the dashboard
 *       (z-index 99999) and blocks interaction until the user either
 *       Acknowledges or Dismisses it.
 *  Multiple notifications queue up — each must be dismissed individually.
 */
import { useEffect, useState, useCallback, useMemo } from "react";

import useCampaignStore from "../stores/useCampaignStore.js";
import useAuthStore     from "../stores/useAuthStore.js";
import useNotifStore    from "../stores/useNotificationStore.js";
import { useSocket }    from "../hooks/useSocket.js";
import { useLogout }    from "../hooks/useLogout.js";
import api              from "../api/axios.js";

import { fmt, initials } from "../utils/formatters.js";
import AckModal          from "../components/campaigns/AckModal.jsx";
import {
  requestNotificationPermission,
  triggerAlert,
} from "../utils/itNotifications.js";

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
            <p style={{ margin:0, fontFamily:"var(--ff-mono)", fontSize:13, color:"var(--accent)" }}>{task.time}</p>
          </div>
          <div className="field-group">
            <label className="field-label">Your Message (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Add any notes about this task completion…" rows={3}/>
          </div>
          <p style={{ margin:0, fontSize:11, color:"var(--muted)", fontFamily:"var(--ff-mono)" }}>
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

/* ─── Overlay Notification Card ──────────────────────────────────────────── */
/**
 * Full-screen overlay that intercepts all user interaction until dismissed.
 * Renders above every element in the app (z-index 99999).
 *
 * Props:
 *  notif   — { id, type:"campaign"|"task", title, body, item }
 *  onAck   — user clicked "Acknowledge Now" (opens ack modal)
 *  onClose — user clicked "Dismiss"
 */
function OverlayNotif({ notif, onAck, onClose }) {
  const isCampaign = notif.type === "campaign";

  return (
    <div
      style={{
        position:        "fixed",
        inset:           0,
        zIndex:          99999,
        background:      "rgba(18, 17, 12, 0.82)",
        backdropFilter:  "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         24,
        animation:       "itOverlayIn 0.3s cubic-bezier(.22,1,.36,1) both",
      }}
    >
      <style>{`
        @keyframes itOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes itCardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes itPulseRing {
          0%   { transform: scale(1);   opacity: 0.9; }
          70%  { transform: scale(1.7); opacity: 0;   }
          100% { transform: scale(1.7); opacity: 0;   }
        }
        @keyframes itBounceIn {
          0%   { transform: scale(0.3); }
          50%  { transform: scale(1.07); }
          70%  { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
      `}</style>

      <div
        style={{
          width:        "100%",
          maxWidth:     480,
          background:   "var(--surface)",
          border:       `1px solid ${isCampaign ? "rgba(42,96,72,0.35)" : "rgba(26,79,110,0.35)"}`,
          borderRadius: 20,
          overflow:     "hidden",
          boxShadow:    isCampaign
            ? "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(42,96,72,0.15), 0 0 60px rgba(42,96,72,0.08)"
            : "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(26,79,110,0.15), 0 0 60px rgba(26,79,110,0.08)",
          animation:    "itCardIn 0.35s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        {/* ── Coloured top bar ── */}
        <div style={{
          height:     4,
          background: isCampaign
            ? "linear-gradient(90deg, var(--accent), #3a7a5a)"
            : "linear-gradient(90deg, var(--info), #2a6a8e)",
        }}/>

        {/* ── Header ── */}
        <div style={{
          padding:       "28px 28px 20px",
          background:    "var(--surface2)",
          borderBottom:  "1px solid var(--border)",
          display:       "flex",
          alignItems:    "flex-start",
          gap:           18,
        }}>
          {/* Pulsing icon */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              position:      "absolute",
              inset:         0,
              borderRadius:  "50%",
              background:    isCampaign ? "var(--accent-lt)" : "var(--info-lt)",
              animation:     "itPulseRing 1.6s ease-out infinite",
            }}/>
            <div style={{
              width:           52,
              height:          52,
              borderRadius:    "50%",
              background:      isCampaign ? "var(--accent-lt)" : "var(--info-lt)",
              border:          `2px solid ${isCampaign ? "var(--accent)" : "var(--info)"}`,
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              fontSize:        24,
              position:        "relative",
              animation:       "itBounceIn 0.5s cubic-bezier(.22,1,.36,1) 0.1s both",
            }}>
              {isCampaign ? "📋" : "🗓"}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Eyebrow */}
            <p style={{
              margin:        "0 0 5px",
              fontSize:      10,
              fontFamily:    "var(--ff-mono)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color:         isCampaign ? "var(--accent)" : "var(--info)",
              fontWeight:    600,
            }}>
              {isCampaign ? "New Campaign Assigned" : "Daily Task Due"}
            </p>
            <h2 style={{
              margin:        "0 0 4px",
              fontSize:      20,
              fontWeight:    700,
              color:         "var(--text)",
              fontFamily:    "var(--ff-display)",
              letterSpacing: "-0.02em",
              lineHeight:    1.2,
            }}>
              {notif.title}
            </h2>
            <p style={{
              margin:   0,
              fontSize: 12,
              color:    "var(--muted)",
              fontFamily: "var(--ff-mono)",
            }}>
              Received at {new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true })}
            </p>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 28px" }}>
          {/* Message / Task content */}
          <div style={{
            padding:      "14px 16px",
            background:   "var(--surface3)",
            border:       "1px solid var(--border)",
            borderRadius: 10,
            marginBottom: 16,
          }}>
            <p style={{
              margin:      0,
              fontSize:    8,
              fontFamily:  "var(--ff-mono)",
              letterSpacing:"0.1em",
              textTransform:"uppercase",
              color:       "var(--muted)",
              marginBottom: 7,
            }}>
              {isCampaign ? "PM Note / Message" : "Task Description"}
            </p>
            <p style={{
              margin:     0,
              fontSize:   14,
              color:      "var(--ink)",
              lineHeight: 1.65,
              wordBreak:  "break-word",
              fontFamily: "var(--ff-body)",
            }}>
              {notif.body || "—"}
            </p>
          </div>

          {/* Scheduled time (campaigns) */}
          {isCampaign && notif.item?.scheduleAt && (
            <div style={{
              display:      "flex",
              alignItems:   "center",
              gap:          8,
              padding:      "10px 14px",
              background:   "var(--accent-lt)",
              borderRadius: 8,
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 14 }}>🕐</span>
              <div>
                <p style={{ margin:0, fontSize:10, fontFamily:"var(--ff-mono)", color:"var(--accent)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>Scheduled At</p>
                <p style={{ margin:0, fontSize:12, fontFamily:"var(--ff-mono)", color:"var(--accent)", fontWeight:600 }}>{fmt(notif.item.scheduleAt)}</p>
              </div>
            </div>
          )}

          {/* Daily task time */}
          {!isCampaign && notif.item?.time && (
            <div style={{
              display:      "flex",
              alignItems:   "center",
              gap:          8,
              padding:      "10px 14px",
              background:   "var(--info-lt)",
              borderRadius: 8,
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 14 }}>⏰</span>
              <div>
                <p style={{ margin:0, fontSize:10, fontFamily:"var(--ff-mono)", color:"var(--info)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>Scheduled Daily At</p>
                <p style={{ margin:0, fontSize:12, fontFamily:"var(--ff-mono)", color:"var(--info)", fontWeight:600 }}>{notif.item.time} IST</p>
              </div>
            </div>
          )}

          {/* Attention banner */}
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          8,
            padding:      "10px 14px",
            background:   "rgba(143,66,12,0.08)",
            border:       "1px solid rgba(143,66,12,0.2)",
            borderRadius: 8,
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
            <p style={{ margin:0, fontSize:12, color:"var(--warn)", lineHeight:1.5, fontFamily:"var(--ff-body)" }}>
              This notification requires your attention. Acknowledge to confirm receipt, or dismiss to handle it later from the queue.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex:         1,
                padding:      "12px",
                borderRadius: 10,
                border:       "1.5px solid var(--border2)",
                background:   "none",
                fontFamily:   "var(--ff-body)",
                fontSize:     13,
                fontWeight:   500,
                color:        "var(--muted)",
                cursor:       "pointer",
                transition:   "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.background = "var(--surface2)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "none"; }}
            >
              Dismiss
            </button>

            <button
              onClick={() => onAck(notif)}
              style={{
                flex:         2,
                padding:      "12px",
                borderRadius: 10,
                border:       "1.5px solid transparent",
                background:   isCampaign
                  ? "linear-gradient(135deg, var(--accent), #3a7a5a)"
                  : "linear-gradient(135deg, var(--info), #2a6a8e)",
                fontFamily:   "var(--ff-body)",
                fontSize:     14,
                fontWeight:   600,
                color:        "#fff",
                cursor:       "pointer",
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                gap:          8,
                boxShadow:    isCampaign
                  ? "0 4px 16px rgba(42,96,72,0.25)"
                  : "0 4px 16px rgba(26,79,110,0.25)",
                transition:   "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
            >
              <span>✓</span>
              Acknowledge Now
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding:      "12px 28px",
          background:   "var(--surface2)",
          borderTop:    "1px solid var(--border)",
          display:      "flex",
          alignItems:   "center",
          gap:          6,
        }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", animation:"itPulseRing 1.6s ease-out infinite", flexShrink:0 }}/>
          <p style={{ margin:0, fontSize:11, color:"var(--muted)", fontFamily:"var(--ff-mono)" }}>
            IT Portal · Campaign Management System
          </p>
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
  const { user, role } = useAuthStore();
  const addNotification = useNotifStore(s => s.addNotification);
  const unread          = useNotifStore(s => s.unread);

  const handleLogout = useLogout();

  const [activeSection, setActiveSection] = useState("campaigns");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  const [ackTarget,  setAckTarget]  = useState(null);
  const [ackLoading, setAckLoading] = useState(false);

  const [dailyTasks,     setDailyTasks]     = useState([]);
  const [taskAckTarget,  setTaskAckTarget]  = useState(null);
  const [taskAckLoading, setTaskAckLoading] = useState(false);
  const [taskFetching,   setTaskFetching]   = useState(false);

  const [toasts,     setToasts]     = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // ── Overlay notification queue ─────────────────────────────────────────────
  // Each entry: { id, type:"campaign"|"task", title, body, item }
  const [overlayQueue, setOverlayQueue] = useState([]);

  // The topmost (first) overlay is shown; others queue behind it.
  const currentOverlay = overlayQueue[0] ?? null;

  // ── Request notification permission on mount ──────────────────────────────
  useEffect(() => {
    requestNotificationPermission().then(granted => {
      if (!granted) {
        console.info("[ITNotif] Native notifications not granted — in-app overlay only.");
      }
    });
  }, []);

  // ── Push a new overlay notification ──────────────────────────────────────
  const pushOverlay = useCallback((notif) => {
    const id = Date.now() + Math.random();

    // Focus the window/tab (Chrome supports this; other browsers may ignore it)
    try { window.focus(); } catch (_) {}

    // Sound + native OS notification
    triggerAlert(
      notif.title,
      notif.body,
      // onClick: bring user back to tab
      () => { try { window.focus(); } catch (_) {} },
    );

    setOverlayQueue(prev => [...prev, { ...notif, id }]);
  }, []);

  // ── Dismiss top overlay ───────────────────────────────────────────────────
  const dismissOverlay = useCallback(() => {
    setOverlayQueue(prev => prev.slice(1));
  }, []);

  // ── Acknowledge from overlay (opens ack modal, dismisses overlay) ─────────
  const ackFromOverlay = useCallback((notif) => {
    dismissOverlay();
    if (notif.type === "campaign") {
      setAckTarget(notif.item);
    } else if (notif.type === "task") {
      setTaskAckTarget(notif.item);
    }
  }, [dismissOverlay]);

  // ── Reactive now state — zero-polling schedule lock ───────────────────────
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

  // ── Fetch daily tasks on mount ────────────────────────────────────────────
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

  // ── Socket handlers ───────────────────────────────────────────────────────
  useSocket({
    "campaign:it_queued": c => {
      useCampaignStore.setState(s => {
        const exists = s.campaigns.some(x => x._id === c._id);
        return { campaigns: exists ? s.campaigns.map(x => x._id===c._id ? c : x) : [c,...s.campaigns] };
      });

      const msgPreview = (c.pmMessage || c.message || "New campaign assigned").slice(0, 120);
      addNotification(`📋 New campaign in queue: "${msgPreview}${msgPreview.length >= 120 ? "…" : ""}"`);

      // ── Overlay + sound + native notification ──
      pushOverlay({
        type:  "campaign",
        title: "New Campaign Assigned",
        body:  c.pmMessage || c.message?.slice(0, 200) || "A new campaign requires your acknowledgement.",
        item:  c,
      });
    },

    "campaign:updated": c => {
      useCampaignStore.setState(s => ({ campaigns: s.campaigns.map(x => x._id===c._id ? c : x) }));
    },

    "campaign:it_ack": c => {
      useCampaignStore.setState(s => ({ campaigns: s.campaigns.map(x => x._id===c._id ? c : x) }));
    },

    "campaign:deleted": d => {
      useCampaignStore.setState(s => ({ campaigns: s.campaigns.filter(x => x._id !== d._id) }));
    },

    "campaign:schedule_fired": c => {
      useCampaignStore.setState(s => ({ campaigns: s.campaigns.map(x => x._id===c._id ? c : x) }));
    },

    "dailytask:queued": task => {
      setDailyTasks(prev => {
        const exists = prev.some(t => t._id === task._id);
        return exists ? prev : [task, ...prev];
      });

      const taskPreview = (task.task || "Daily task needs acknowledgement").slice(0, 100);
      addNotification(`🗓 Daily task due: "${taskPreview}${taskPreview.length >= 100 ? "…" : ""}"`);

      // ── Overlay + sound + native notification ──
      pushOverlay({
        type:  "task",
        title: "Daily Task Due Now",
        body:  task.task?.slice(0, 200) || "A scheduled daily task requires your acknowledgement.",
        item:  task,
      });
    },
  });

  // ── 60-second auto-refresh fallback ──────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => getCampaign().catch(console.error), 60_000);
    return () => clearInterval(id);
  }, [getCampaign]);

  // ── Derived campaign list ─────────────────────────────────────────────────
  const itCampaigns = useMemo(() => campaigns.filter(c => {
    if (c.action !== "approve") return false;
    if (c.status  === "cancel") return false;
    if (c.acknowledgement)      return false;
    if (c.scheduleAt) return new Date(c.scheduleAt).getTime() <= now;
    return true;
  }), [campaigns, now]);

  const doneCount    = useMemo(() => campaigns.filter(c => c.acknowledgement === "done").length, [campaigns]);
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
    pushToast("Campaigns refreshed");
  };

  // ── Campaign acknowledge ──────────────────────────────────────────────────
  const handleAck = async ({ acknowledgement, itMessage }) => {
    if (!ackTarget) return;
    setAckLoading(true);
    try {
      const doneAt = new Date().toLocaleString("en-IN", {
        day:"2-digit", month:"2-digit", year:"numeric",
        hour:"2-digit", minute:"2-digit", hour12:false,
      });
      const finalMessage = itMessage
        ? `${itMessage}\n\nDone at ${doneAt}`
        : `Done at ${doneAt}`;
      await updateCampaign(ackTarget._id, { acknowledgement, itMessage: finalMessage });
      if (acknowledgement === "done") {
        addNotification(`✅ IT: Campaign "${ackTarget.message?.slice(0,30)}…" marked Done by ${user}`);
        pushToast("Campaign acknowledged as Done. PMs & owner notified.");
      } else {
        addNotification(`⚠ IT: "${ackTarget.message?.slice(0,30)}…" marked Not Done — Reason: ${itMessage}`);
        pushToast("Campaign marked Not Done.", "warn");
      }
      setAckTarget(null);
    } catch {
      pushToast("Failed to update. Please retry.", "warn");
    } finally { setAckLoading(false); }
  };

  // ── Daily task acknowledge ────────────────────────────────────────────────
  const handleTaskAck = async (taskId, message) => {
    setTaskAckLoading(true);
    try {
      await api.post("/task/acknowledge", { id: taskId, message });
      setDailyTasks(prev => prev.filter(t => t._id !== taskId));
      setTaskAckTarget(null);
      pushToast("Daily task acknowledged. PMs notified.");
      addNotification(`✅ IT: Daily task acknowledged by ${user}`);
    } catch (err) {
      pushToast(err?.response?.data?.message || "Failed to acknowledge task.", "warn");
    } finally { setTaskAckLoading(false); }
  };

  // ── Nav ───────────────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    { id:"campaigns",      label:"Campaigns",      icon:"📋", count: pendingCount     },
    { id:"schedule-tasks", label:"Schedule Tasks", icon:"🗓", count: dailyTasks.length },
  ];

  return (
    <div className="it-root" style={{ height:"100vh", overflow:"hidden" }}>
      <div className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)}/>

      {/* ── Sidebar ── */}
      <aside className={`it-sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">Campaign<i style={{ fontStyle:"normal", opacity:0.4 }}>.</i></div>
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
            <button key={item.id}
              className={`nav-item ${activeSection===item.id ? "active" : ""}`}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}>
              <span className="nav-icon">{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.count > 0 && (
                <span style={{
                  padding:"1px 7px", borderRadius:99,
                  background: activeSection===item.id ? "var(--accent)" : "var(--surface3)",
                  color: activeSection===item.id ? "#fff" : "var(--muted)",
                  fontSize:10, fontFamily:"var(--ff-mono)", fontWeight:700,
                }}>
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
      <div className="it-main" style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <header className="it-header">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span/><span/><span/>
          </button>
          <h1 className="header-title">
            {activeSection === "campaigns" ? "Scheduled Campaigns" : "Schedule Tasks"}
          </h1>
          <span className="header-badge">
            {activeSection === "campaigns" ? `${pendingCount} Pending` : `${dailyTasks.length} Due`}
          </span>

          {/* Notification bell with pending-overlay count */}
          <div style={{ position:"relative" }}>
            <div
              className="notif-bell"
              title={`${unread} unread notifications`}
              onClick={() => pushToast(`You have ${unread} notification(s)`)}
            >
              🔔
              {unread > 0 && <span className="notif-dot"/>}
            </div>
            {/* Overlay queue count badge */}
            {overlayQueue.length > 0 && (
              <span style={{
                position:      "absolute",
                top:           -6,
                right:         -6,
                minWidth:      18,
                height:        18,
                borderRadius:  99,
                background:    "var(--danger)",
                color:         "#fff",
                fontSize:      10,
                fontFamily:    "var(--ff-mono)",
                fontWeight:    700,
                display:       "flex",
                alignItems:    "center",
                justifyContent:"center",
                padding:       "0 4px",
                border:        "2px solid var(--bg)",
              }}>
                {overlayQueue.length}
              </span>
            )}
          </div>
        </header>

        {/* ════════════════ CAMPAIGNS ════════════════ */}
        {activeSection === "campaigns" && (
          <div className="it-content" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div className="stats-row" style={{ flexShrink:0 }}>
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
                <div className="stat-value">{campaigns.filter(c => c.action==="approve").length}</div>
                <div className="stat-sub">Approved by PM (all time)</div>
              </div>
            </div>

            <div className="section-head" style={{ flexShrink:0 }}>
              <span className="section-title">Request Queue</span>
              <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? "⟳ Refreshing…" : "⟳ Refresh"}
              </button>
            </div>

            <div className="table-wrap" style={{ flex:1, overflow:"auto" }}>
              {itCampaigns.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">✅</div>
                  <div className="table-empty-text">No campaigns due yet. Queue is clear.</div>
                </div>
              ) : (
                <table>
                  <thead style={{ position:"sticky", top:0, zIndex:1, background:"var(--surface2)" }}>
                    <tr>
                      <th>PM Note</th>
                      <th>Scheduled At</th>
                      <th>Status</th>
                      <th>Action</th>
                      <th>Acknowledge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itCampaigns.map(c => (
                      <tr key={c._id}>
                        <td style={{ maxWidth:320, wordBreak:"break-word", whiteSpace:"pre-wrap", lineHeight:1.6, padding:"16px 18px" }}>
                          {c.pmMessage || "—"}
                        </td>
                        <td className="time-cell" style={{ padding:"16px 18px" }}>{fmt(c.scheduleAt)}</td>
                        <td style={{ padding:"16px 18px" }}><StatusBadge value={c.status}/></td>
                        <td style={{ padding:"16px 18px" }}><StatusBadge value={c.action}/></td>
                        <td style={{ padding:"16px 18px" }}>
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

        {/* ════════════════ SCHEDULE TASKS ════════════════ */}
        {activeSection === "schedule-tasks" && (
          <div className="it-content" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div className="stats-row" style={{ gridTemplateColumns:"repeat(2,1fr)", flexShrink:0 }}>
              <div className="stat-card">
                <div className="stat-label">Due Now</div>
                <div className="stat-value">{dailyTasks.length}</div>
                <div className="stat-sub">Daily tasks awaiting acknowledgement</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Status</div>
                <div className="stat-value" style={{ fontSize:22, color:"var(--accent)" }}>
                  {dailyTasks.length === 0 ? "✓ Clear" : "⏳ Pending"}
                </div>
                <div className="stat-sub">
                  {dailyTasks.length === 0
                    ? "All tasks acknowledged for today"
                    : `${dailyTasks.length} task(s) need attention`}
                </div>
              </div>
            </div>

            <div className="section-head" style={{ flexShrink:0 }}>
              <span className="section-title">Today's Task Queue</span>
              <button className="refresh-btn" onClick={fetchDueTasks} disabled={taskFetching}>
                {taskFetching ? "⟳ Loading…" : "⟳ Refresh"}
              </button>
            </div>

            <div className="table-wrap" style={{ flex:1, overflow:"auto" }}>
              {taskFetching ? (
                <div className="table-empty">
                  <div className="table-empty-icon" style={{ fontSize:28 }}>⏳</div>
                  <div className="table-empty-text">Loading tasks…</div>
                </div>
              ) : dailyTasks.length === 0 ? (
                <div className="table-empty">
                  <div className="table-empty-icon">✅</div>
                  <div className="table-empty-text">No tasks due right now. Check back at the scheduled times.</div>
                </div>
              ) : (
                <table>
                  <thead style={{ position:"sticky", top:0, zIndex:1, background:"var(--surface2)" }}>
                    <tr>
                      <th>Task</th>
                      <th>Scheduled Time</th>
                      <th>Created By</th>
                      <th>Acknowledge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyTasks.map(t => {
                      const creatorName = typeof t.createdBy === "object" ? t.createdBy?.username : "PM";
                      return (
                        <tr key={t._id}>
                          <td style={{ maxWidth:400, wordBreak:"break-word", whiteSpace:"pre-wrap", lineHeight:1.6, padding:"16px 18px" }}>
                            {t.task}
                          </td>
                          <td className="time-cell" style={{ padding:"16px 18px" }}>{t.time}</td>
                          <td style={{ padding:"16px 18px", fontSize:13 }}>{creatorName}</td>
                          <td style={{ padding:"16px 18px" }}>
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
      </div>

      {/* ── Ack modals ── */}
      {ackTarget && (
        <AckModal campaign={ackTarget} onClose={() => setAckTarget(null)} onConfirm={handleAck} loading={ackLoading}/>
      )}
      {taskAckTarget && (
        <TaskAckModal task={taskAckTarget} onClose={() => setTaskAckTarget(null)} onConfirm={handleTaskAck} loading={taskAckLoading}/>
      )}

      {/* ── Overlay notification (topmost in queue) ── */}
      {currentOverlay && (
        <OverlayNotif
          notif={currentOverlay}
          onClose={dismissOverlay}
          onAck={ackFromOverlay}
        />
      )}

      {/* ── Toast strip ── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type==="warn" ? "warn" : ""}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}