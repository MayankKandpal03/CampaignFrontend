// src/pages/ITDashboard.jsx
/**
 * CROSS-TAB NOTIFICATION ARCHITECTURE
 * ────────────────────────────────────
 * React overlays are scoped to this component tree and cannot appear over
 * other browser tabs or applications. Two mechanisms handle this:
 *
 * 1. Native OS Notification (Notification API)
 *    Shows an OS-level alert above ALL windows, even when the browser is
 *    minimised or the user is on a completely different website.
 *    → Requires explicit "granted" permission from the user.
 *    → A visible permission banner is shown until the user grants it.
 *    → Clicking the OS notification focuses this tab; the in-app overlay
 *      then appears automatically because the queue persists in state.
 *
 * 2. BroadcastChannel API
 *    Synchronises overlay state across multiple IT dashboard tabs open
 *    in the SAME browser. If the IT user has the dashboard open in two
 *    tabs, both will show the overlay even if only one tab's socket fires.
 *
 * OVERLAY PERSISTENCE:
 *    overlayQueue is kept in state — items are never auto-dismissed.
 *    If the user is on Gmail and the OS notification fires, when they
 *    click it and return to this tab the overlay is still queued and
 *    renders immediately. Only "Dismiss" or "Acknowledge Now" removes it.
 *
 * NOTIFICATION BELL:
 *    Uses the same NotifPanel + useNotifStore as PPC/PM dashboards.
 */
import { useEffect, useState, useCallback, useMemo, useRef } from "react";

import useCampaignStore from "../stores/useCampaignStore.js";
import useAuthStore     from "../stores/useAuthStore.js";
import useNotifStore    from "../stores/useNotificationStore.js";
import { useSocket }    from "../hooks/useSocket.js";
import { useLogout }    from "../hooks/useLogout.js";
import api              from "../api/axios.js";

import { fmt, initials } from "../utils/formatters.js";
import AckModal          from "../components/campaigns/AckModal.jsx";
import NotifPanel        from "../components/common/NotifPanel.jsx";
import {
  requestNotificationPermission,
  getNotificationPermission,
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

/* ─── Notification Permission Banner ─────────────────────────────────────── */
function NotifPermissionBanner({ permission, onRequest }) {
  if (permission === "granted" || permission === "unsupported") return null;
  const isDenied = permission === "denied";
  return (
    <div style={{
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      gap:            12,
      padding:        "10px 28px",
      background:     isDenied ? "var(--danger-lt)" : "var(--warn-lt)",
      borderBottom:   `1px solid ${isDenied ? "rgba(184,48,48,0.2)" : "rgba(143,66,12,0.2)"}`,
      flexWrap:       "wrap",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
        <span style={{ fontSize:16 }}>{isDenied ? "🔕" : "🔔"}</span>
        <div>
          <p style={{ margin:0, fontSize:12, fontWeight:500, color: isDenied ? "var(--danger)" : "var(--warn)", fontFamily:"var(--ff-body)" }}>
            {isDenied
              ? "Desktop notifications are blocked — you won't be alerted on other tabs."
              : "Enable desktop notifications to receive alerts when you're on other tabs or apps."}
          </p>
          {isDenied && (
            <p style={{ margin:"2px 0 0", fontSize:11, color:"var(--muted)", fontFamily:"var(--ff-mono)" }}>
              To re-enable: click the 🔒 lock icon in your browser address bar → Notifications → Allow
            </p>
          )}
        </div>
      </div>
      {!isDenied && (
        <button
          onClick={onRequest}
          style={{
            padding:"7px 16px", borderRadius:"var(--radius-sm)",
            border:"1.5px solid var(--warn)", background:"var(--warn-lt)",
            color:"var(--warn)", fontFamily:"var(--ff-body)", fontSize:12,
            fontWeight:600, cursor:"pointer", whiteSpace:"nowrap",
            transition:"all 0.15s ease", flexShrink:0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background="var(--warn)"; e.currentTarget.style.color="#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background="var(--warn-lt)"; e.currentTarget.style.color="var(--warn)"; }}
        >
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

/* ─── Persistent Overlay Notification Card ───────────────────────────────── */
/**
 * This overlay renders OVER everything on the IT tab.
 * It is intentionally not dismissible by clicking outside — the user
 * must either "Dismiss" (defers to queue) or "Acknowledge Now".
 * When the user comes back from another tab (having clicked the OS
 * notification), this is still in the queue and renders immediately.
 */
function OverlayNotif({ notif, queueLength, onAck, onClose }) {
  const isCampaign = notif.type === "campaign";
  const accentColor = isCampaign ? "var(--accent)" : "var(--info)";
  const accentBg    = isCampaign ? "var(--accent-lt)" : "var(--info-lt)";

  return (
    <div style={{
      position:        "fixed",
      inset:           0,
      zIndex:          99999,
      background:      "rgba(18,17,12,0.85)",
      backdropFilter:  "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      padding:         24,
      animation:       "itOverlayIn 0.3s cubic-bezier(.22,1,.36,1) both",
    }}>
      <style>{`
        @keyframes itOverlayIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes itCardIn     { from { opacity:0; transform:translateY(24px) scale(0.96) } to { opacity:1; transform:none } }
        @keyframes itPulseRing  { 0%{transform:scale(1);opacity:.9} 70%{transform:scale(1.7);opacity:0} 100%{transform:scale(1.7);opacity:0} }
        @keyframes itBounceIn   { 0%{transform:scale(.3)} 50%{transform:scale(1.07)} 70%{transform:scale(.96)} 100%{transform:scale(1)} }
        @keyframes itShake      { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-4px)} 40%{transform:translateX(4px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
      `}</style>

      <div style={{
        width:        "100%",
        maxWidth:     500,
        background:   "var(--surface)",
        border:       `1px solid ${isCampaign ? "rgba(42,96,72,0.4)" : "rgba(26,79,110,0.4)"}`,
        borderRadius: 20,
        overflow:     "hidden",
        boxShadow:    "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        animation:    "itCardIn 0.35s cubic-bezier(.22,1,.36,1) both",
      }}>
        {/* Top color bar */}
        <div style={{
          height:     4,
          background: isCampaign
            ? "linear-gradient(90deg,var(--accent),#3a7a5a)"
            : "linear-gradient(90deg,var(--info),#2a6a8e)",
        }}/>

        {/* Header */}
        <div style={{
          padding:    "24px 28px 18px",
          background: "var(--surface2)",
          borderBottom: "1px solid var(--border)",
          display:    "flex",
          alignItems: "flex-start",
          gap:        16,
        }}>
          {/* Animated icon */}
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{
              position:"absolute", inset:0, borderRadius:"50%",
              background: accentBg,
              animation: "itPulseRing 1.6s ease-out infinite",
            }}/>
            <div style={{
              width:46, height:46, borderRadius:"50%",
              background: accentBg,
              border: `2px solid ${accentColor}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, position:"relative",
              animation: "itBounceIn 0.5s cubic-bezier(.22,1,.36,1) 0.1s both",
            }}>
              {isCampaign ? "📋" : "🗓"}
            </div>
          </div>

          <div style={{ flex:1, minWidth:0 }}>
            <p style={{
              margin:"0 0 4px",
              fontSize:10, fontFamily:"var(--ff-mono)",
              letterSpacing:"0.1em", textTransform:"uppercase",
              color: accentColor, fontWeight:600,
            }}>
              {isCampaign ? "🔴 New Campaign Assigned" : "⏰ Daily Task Due Now"}
            </p>
            <h2 style={{
              margin:"0 0 3px", fontSize:19, fontWeight:700,
              color:"var(--text)", fontFamily:"var(--ff-display)",
              letterSpacing:"-0.02em", lineHeight:1.2,
            }}>
              {notif.title}
            </h2>
            <p style={{ margin:0, fontSize:11, color:"var(--muted)", fontFamily:"var(--ff-mono)" }}>
              Received {new Date().toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true })}
              {queueLength > 1 && (
                <span style={{
                  marginLeft:8, padding:"1px 8px", borderRadius:99,
                  background:"var(--danger-lt)", color:"var(--danger)",
                  border:"1px solid rgba(184,48,48,0.2)", fontSize:10,
                }}>
                  +{queueLength - 1} more waiting
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:"20px 28px" }}>
          {/* Message */}
          <div style={{
            padding:"13px 16px",
            background:"var(--surface3)", border:"1px solid var(--border)",
            borderRadius:10, marginBottom:14,
          }}>
            <p style={{
              margin:"0 0 6px", fontSize:8, fontFamily:"var(--ff-mono)",
              letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)",
            }}>
              {isCampaign ? "PM Note / Message" : "Task Description"}
            </p>
            <p style={{
              margin:0, fontSize:14, color:"var(--ink)",
              lineHeight:1.65, wordBreak:"break-word", fontFamily:"var(--ff-body)",
            }}>
              {notif.body || "—"}
            </p>
          </div>

          {/* Schedule pill */}
          {isCampaign && notif.item?.scheduleAt && (
            <div style={{
              display:"flex", alignItems:"center", gap:9,
              padding:"10px 14px", background: accentBg,
              borderRadius:8, marginBottom:14,
            }}>
              <span style={{ fontSize:14 }}>🕐</span>
              <div>
                <p style={{ margin:0, fontSize:9, fontFamily:"var(--ff-mono)", color:accentColor, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:1 }}>Scheduled At</p>
                <p style={{ margin:0, fontSize:12, fontFamily:"var(--ff-mono)", color:accentColor, fontWeight:600 }}>{fmt(notif.item.scheduleAt)}</p>
              </div>
            </div>
          )}
          {!isCampaign && notif.item?.time && (
            <div style={{
              display:"flex", alignItems:"center", gap:9,
              padding:"10px 14px", background: accentBg,
              borderRadius:8, marginBottom:14,
            }}>
              <span style={{ fontSize:14 }}>⏰</span>
              <div>
                <p style={{ margin:0, fontSize:9, fontFamily:"var(--ff-mono)", color:accentColor, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:1 }}>Scheduled Daily At</p>
                <p style={{ margin:0, fontSize:12, fontFamily:"var(--ff-mono)", color:accentColor, fontWeight:600 }}>{notif.item.time} IST</p>
              </div>
            </div>
          )}

          {/* Warning */}
          <div style={{
            display:"flex", gap:10, alignItems:"flex-start",
            padding:"10px 14px",
            background:"rgba(143,66,12,0.07)", border:"1px solid rgba(143,66,12,0.18)",
            borderRadius:8, marginBottom:20,
          }}>
            <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>⚠️</span>
            <p style={{ margin:0, fontSize:12, color:"var(--warn)", lineHeight:1.55, fontFamily:"var(--ff-body)" }}>
              This notification requires your attention. Acknowledge to confirm, or dismiss to handle it later from the queue.
            </p>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:10 }}>
            <button
              onClick={onClose}
              style={{
                flex:1, padding:"12px", borderRadius:10,
                border:"1.5px solid var(--border2)", background:"none",
                fontFamily:"var(--ff-body)", fontSize:13, fontWeight:500,
                color:"var(--muted)", cursor:"pointer", transition:"all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.color="var(--ink)"; e.currentTarget.style.background="var(--surface2)"; }}
              onMouseLeave={e => { e.currentTarget.style.color="var(--muted)"; e.currentTarget.style.background="none"; }}
            >
              Dismiss (handle later)
            </button>
            <button
              onClick={() => onAck(notif)}
              style={{
                flex:2, padding:"12px", borderRadius:10,
                border:"1.5px solid transparent",
                background: isCampaign
                  ? "linear-gradient(135deg,var(--accent),#3a7a5a)"
                  : "linear-gradient(135deg,var(--info),#2a6a8e)",
                fontFamily:"var(--ff-body)", fontSize:14, fontWeight:600,
                color:"#fff", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                transition:"all 0.15s ease",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity="0.9"; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity="1"; e.currentTarget.style.transform="none"; }}
            >
              <span style={{ fontSize:16 }}>✓</span> Acknowledge Now
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding:"10px 28px",
          background:"var(--surface2)", borderTop:"1px solid var(--border)",
          display:"flex", alignItems:"center", gap:6,
        }}>
          <span style={{
            width:6, height:6, borderRadius:"50%",
            background: accentColor,
            animation: "itPulseRing 1.6s ease-out infinite",
            flexShrink:0,
          }}/>
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
  const markRead        = useNotifStore(s => s.markRead);

  const handleLogout = useLogout();

  const [activeSection, setActiveSection] = useState("campaigns");
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [showNotifs,    setShowNotifs]    = useState(false);   // ← NotifPanel toggle
  const [ackTarget,     setAckTarget]     = useState(null);
  const [ackLoading,    setAckLoading]    = useState(false);
  const [dailyTasks,    setDailyTasks]    = useState([]);
  const [taskAckTarget, setTaskAckTarget] = useState(null);
  const [taskAckLoading,setTaskAckLoading]= useState(false);
  const [taskFetching,  setTaskFetching]  = useState(false);
  const [toasts,        setToasts]        = useState([]);
  const [refreshing,    setRefreshing]    = useState(false);

  /**
   * overlayQueue — items are only removed by explicit user action
   * (Dismiss or Acknowledge Now). This means if the user is on another
   * tab when the OS notification fires, clicking it returns them to this
   * tab where the overlay is still queued and renders immediately.
   */
  const [overlayQueue, setOverlayQueue] = useState([]);

  // ── Notification permission state ─────────────────────────────────────────
  const [notifPermission, setNotifPermission] = useState(() =>
    getNotificationPermission()
  );

  // ── Close NotifPanel on outside click ─────────────────────────────────────
  const notifBellRef = useRef(null);
  useEffect(() => {
    if (!showNotifs) return;
    const handler = (e) => {
      if (notifBellRef.current && !notifBellRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotifs]);

  // ── BroadcastChannel for cross-tab overlay sync ────────────────────────────
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
      import("../utils/itNotifications.js").then(m => m.playNotificationSound());
    };
    return () => { bc.close(); bcRef.current = null; };
  }, []);

  const currentOverlay = overlayQueue[0] ?? null;

  // ── Permission request ─────────────────────────────────────────────────────
  const handleRequestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? "granted" : "denied");
  }, []);

  // ── Push overlay (persists until user action) ──────────────────────────────
  const pushOverlay = useCallback((notif) => {
    const entry = { ...notif, id: Date.now() + Math.random() };

    // OS-level notification — visible above ALL apps/tabs
    triggerAlert(
      entry.title,
      entry.body,
      () => { try { window.focus(); } catch (_) {} },
    );

    // In-app overlay queue (persists when returning from another tab)
    setOverlayQueue(prev => [...prev, entry]);

    // Broadcast to other IT tabs in same browser
    bcRef.current?.postMessage({ type: "overlay_push", notif: entry });
  }, []);

  const dismissOverlay = useCallback(() => {
    setOverlayQueue(prev => prev.slice(1));
  }, []);

  const ackFromOverlay = useCallback((notif) => {
    dismissOverlay();
    if (notif.type === "campaign") setAckTarget(notif.item);
    else if (notif.type === "task") setTaskAckTarget(notif.item);
  }, [dismissOverlay]);

  // ── Reactive now state ─────────────────────────────────────────────────────
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
    const id = setTimeout(() => setNow(Date.now()), nextTime - currentReal + 200);
    return () => clearTimeout(id);
  }, [campaigns, now]);

  // ── Fetch daily tasks ──────────────────────────────────────────────────────
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

  // ── Socket handlers ────────────────────────────────────────────────────────
  useSocket({
    /**
     * campaign:it_queued fires in two cases:
     *   (A) PM approves with a past/no schedule → immediate delivery
     *   (B) Server-side timer fires for a future-scheduled campaign
     * In both cases, IT receives the overlay + OS notification.
     */
    "campaign:it_queued": c => {
      useCampaignStore.setState(s => {
        const exists = s.campaigns.some(x => x._id === c._id);
        return {
          campaigns: exists
            ? s.campaigns.map(x => x._id === c._id ? c : x)
            : [c, ...s.campaigns],
        };
      });
      const msgPreview = (c.pmMessage || c.message || "New campaign assigned").slice(0, 120);
      addNotification(`📋 New campaign in queue: "${msgPreview}${msgPreview.length >= 120 ? "…" : ""}"`);
      pushOverlay({
        type:  "campaign",
        title: "New Campaign Assigned",
        body:  c.pmMessage || c.message?.slice(0, 200) || "A new campaign requires your acknowledgement.",
        item:  c,
      });
    },
    "campaign:updated": c => {
      useCampaignStore.setState(s => ({
        campaigns: s.campaigns.map(x => x._id === c._id ? c : x),
      }));
    },
    "campaign:it_ack": c => {
      useCampaignStore.setState(s => ({
        campaigns: s.campaigns.map(x => x._id === c._id ? c : x),
      }));
    },
    "campaign:deleted": d => {
      useCampaignStore.setState(s => ({
        campaigns: s.campaigns.filter(x => x._id !== d._id),
      }));
    },
    "campaign:schedule_fired": c => {
      useCampaignStore.setState(s => ({
        campaigns: s.campaigns.map(x => x._id === c._id ? c : x),
      }));
    },
    "dailytask:queued": task => {
      setDailyTasks(prev => {
        const exists = prev.some(t => t._id === task._id);
        return exists ? prev : [task, ...prev];
      });
      const taskPreview = (task.task || "Daily task needs acknowledgement").slice(0, 100);
      addNotification(`🗓 Daily task due: "${taskPreview}${taskPreview.length >= 100 ? "…" : ""}"`);
      pushOverlay({
        type:  "task",
        title: "Daily Task Due Now",
        body:  task.task?.slice(0, 200) || "A scheduled daily task requires your acknowledgement.",
        item:  task,
      });
    },
  });

  // ── 60-second auto-refresh fallback ───────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => getCampaign().catch(console.error), 60_000);
    return () => clearInterval(id);
  }, [getCampaign]);

  // ── Derived campaign list ──────────────────────────────────────────────────
  const itCampaigns = useMemo(() => campaigns.filter(c => {
    if (c.action !== "approve") return false;
    if (c.status  === "cancel") return false;
    if (c.acknowledgement)      return false;
    if (c.scheduleAt) return new Date(c.scheduleAt).getTime() <= now;
    return true;
  }), [campaigns, now]);

  const doneCount    = useMemo(() => campaigns.filter(c => c.acknowledgement === "done").length, [campaigns]);
  const pendingCount = itCampaigns.length;

  // ── Toast helpers ──────────────────────────────────────────────────────────
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

  // ── Campaign acknowledge ───────────────────────────────────────────────────
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
        addNotification(`✅ Campaign "${ackTarget.message?.slice(0,30)}…" marked Done by ${user}`);
        pushToast("Campaign acknowledged as Done. PMs & owner notified.");
      } else {
        addNotification(`⚠ "${ackTarget.message?.slice(0,30)}…" marked Not Done — Reason: ${itMessage}`);
        pushToast("Campaign marked Not Done.", "warn");
      }
      setAckTarget(null);
    } catch {
      pushToast("Failed to update. Please retry.", "warn");
    } finally { setAckLoading(false); }
  };

  // ── Daily task acknowledge ─────────────────────────────────────────────────
  const handleTaskAck = async (taskId, message) => {
    setTaskAckLoading(true);
    try {
      await api.post("/task/acknowledge", { id: taskId, message });
      setDailyTasks(prev => prev.filter(t => t._id !== taskId));
      setTaskAckTarget(null);
      pushToast("Daily task acknowledged. PMs notified.");
      addNotification(`✅ Daily task acknowledged by ${user}`);
    } catch (err) {
      pushToast(err?.response?.data?.message || "Failed to acknowledge task.", "warn");
    } finally { setTaskAckLoading(false); }
  };

  // ── Nav ────────────────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    { id:"campaigns",      label:"Campaigns",      icon:"📋", count: pendingCount     },
    { id:"schedule-tasks", label:"Schedule Tasks", icon:"🗓", count: dailyTasks.length },
  ];

  // Combined pending count for bell badge
  const totalPending = pendingCount + dailyTasks.length;

  return (
    <div className="it-root" style={{ height:"100vh", overflow:"hidden" }}>
      <div
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

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
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? "active" : ""}`}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.count > 0 && (
                <span style={{
                  padding:"1px 7px", borderRadius:99,
                  background: activeSection === item.id ? "var(--accent)" : "var(--surface3)",
                  color:      activeSection === item.id ? "#fff"          : "var(--muted)",
                  fontSize:10, fontFamily:"var(--ff-mono)", fontWeight:700,
                }}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span>↩</span> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="it-main" style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Permission banner */}
        <NotifPermissionBanner
          permission={notifPermission}
          onRequest={handleRequestPermission}
        />

        {/* ── Header ── */}
        <header className="it-header">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span/><span/><span/>
          </button>

          <h1 className="header-title">
            {activeSection === "campaigns" ? "Scheduled Campaigns" : "Schedule Tasks"}
          </h1>

          <span className="header-badge">
            {activeSection === "campaigns"
              ? `${pendingCount} Pending`
              : `${dailyTasks.length} Due`}
          </span>

          {/* ── Notification Bell — matches PPC/PM style ── */}
          <div style={{ position:"relative" }} ref={notifBellRef}>
            <button
              onClick={() => {
                setShowNotifs(v => !v);
                if (!showNotifs) markRead();
              }}
              title={`${unread} unread notifications`}
              style={{
                width:46, height:36, borderRadius:"var(--radius-sm)",
                border:     showNotifs ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                background: showNotifs ? "var(--accent-lt)"          : "var(--surface)",
                cursor:     "pointer",
                display:    "flex", alignItems:"center", justifyContent:"center",
                transition: "all 0.18s ease",
                position:   "relative", flexShrink:0,
                boxShadow:  showNotifs ? "0 2px 8px rgba(42,96,72,0.15)" : "var(--shadow-sm)",
              }}
              onMouseEnter={e => {
                if (!showNotifs) {
                  e.currentTarget.style.borderColor  = "var(--border2)";
                  e.currentTarget.style.background   = "var(--surface2)";
                }
              }}
              onMouseLeave={e => {
                if (!showNotifs) {
                  e.currentTarget.style.borderColor  = "var(--border)";
                  e.currentTarget.style.background   = "var(--surface)";
                }
              }}
              aria-label="Notifications"
            >
              {/* Bell icon */}
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={showNotifs ? "var(--accent)" : "var(--muted)"}
                strokeWidth="2"
              >
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
              </svg>

              {/* Unread count badge */}
              {unread > 0 && (
                <span style={{
                  position:   "absolute",
                  top:        -4, right: -4,
                  minWidth:   16, height: 16,
                  borderRadius: 99,
                  background: "var(--danger)",
                  color:      "#fff",
                  fontSize:   9,
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 700,
                  display:    "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding:    "0 3px",
                  border:     "2px solid var(--bg)",
                }}>
                  {unread > 99 ? "99+" : unread}
                </span>
              )}

              {/* Overlay queue indicator */}
              {overlayQueue.length > 0 && unread === 0 && (
                <span style={{
                  position:   "absolute",
                  top:        -4, right: -4,
                  width:      10, height: 10,
                  borderRadius: "50%",
                  background: "var(--warn)",
                  border:     "2px solid var(--bg)",
                  animation:  "itPulseRing 1.4s ease-out infinite",
                }}/>
              )}
            </button>

            {/* NotifPanel — same component as PPC/PM dashboards */}
            <NotifPanel
              open={showNotifs}
              onClose={() => setShowNotifs(false)}
              width={310}
            />
          </div>
        </header>

        {/* ══════════════ CAMPAIGNS ══════════════ */}
        {activeSection === "campaigns" && (
          <div
            className="it-content"
            style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}
          >
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
                <div className="stat-value">{campaigns.filter(c => c.action === "approve").length}</div>
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
                          <button className="ack-btn" onClick={() => setAckTarget(c)}>
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

        {/* ══════════════ SCHEDULE TASKS ══════════════ */}
        {activeSection === "schedule-tasks" && (
          <div
            className="it-content"
            style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}
          >
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
                      const creatorName = typeof t.createdBy === "object"
                        ? t.createdBy?.username
                        : "PM";
                      return (
                        <tr key={t._id}>
                          <td style={{ maxWidth:400, wordBreak:"break-word", whiteSpace:"pre-wrap", lineHeight:1.6, padding:"16px 18px" }}>
                            {t.task}
                          </td>
                          <td className="time-cell" style={{ padding:"16px 18px" }}>{t.time}</td>
                          <td style={{ padding:"16px 18px", fontSize:13 }}>{creatorName}</td>
                          <td style={{ padding:"16px 18px" }}>
                            <button className="ack-btn" onClick={() => setTaskAckTarget(t)}>
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

      {/* ── Ack modals ── */}
      {ackTarget && (
        <AckModal
          campaign={ackTarget}
          onClose={() => setAckTarget(null)}
          onConfirm={handleAck}
          loading={ackLoading}
        />
      )}
      {taskAckTarget && (
        <TaskAckModal
          task={taskAckTarget}
          onClose={() => setTaskAckTarget(null)}
          onConfirm={handleTaskAck}
          loading={taskAckLoading}
        />
      )}

      {/**
       * Persistent overlay notification (topmost in queue).
       * Survives tab switches — when the user returns from Gmail (or any
       * other app) after clicking the OS notification, this is still here.
       * Only removed by "Dismiss (handle later)" or "Acknowledge Now".
       */}
      {currentOverlay && (
        <OverlayNotif
          notif={currentOverlay}
          queueLength={overlayQueue.length}
          onClose={dismissOverlay}
          onAck={ackFromOverlay}
        />
      )}

      {/* ── Toast strip ── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type === "warn" ? "warn" : ""}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}