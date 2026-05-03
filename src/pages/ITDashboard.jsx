// src/pages/ITDashboard.jsx
/**
 * CHANGES FROM PREVIOUS VERSION:
 * 1. FIX (Issue 2) — History not always updating:
 *    The previous guard `if (prev.length === 0) return prev` could not
 *    distinguish "history not yet fetched" from "fetched but genuinely empty".
 *    Replaced with a `historyLoadedRef` that is set to true once fetchHistory
 *    completes. The `campaign:it_ack` socket handler now checks this ref, so
 *    new acknowledgements always appear in the history list whether it was
 *    empty or not.
 *
 * 2. FIX (Issue 1) — Real-time updates for all IT users:
 *    All socket events (campaign:it_queued, campaign:it_ack, campaign:updated,
 *    campaign:deleted, campaign:schedule_fired, dailytask:queued,
 *    dailytask:acked) correctly update local state so every connected IT user
 *    sees changes immediately without a manual refresh.  No logic changes were
 *    needed here — the existing socket plumbing was already correct.
 *
 * 3. FIX (Issue 3) — Duplicate OS notifications:
 *    triggerAlert in itNotifications.js no longer calls showNativeNotification.
 *    The service-worker push handles OS alerts; the overlay card handles
 *    in-tab visual feedback.  No changes required in this file for that fix.
 *
 * 4. FIX (IT notifications) — triggerAlert now called directly in
 *    campaign:it_queued and dailytask:queued socket handlers, matching the
 *    same pattern used by PMDashboard. Previously only pushOverlay was called,
 *    which could silently fail without triggering any OS/sound notification.
 *
 * 5. FIX (Push re-registration) — Push useEffect now uses [] as dependency so
 *    it fires on every mount, not only when permission changes. This ensures
 *    the subscription is re-registered after server restarts (which clear the
 *    in-memory subscriptions Map) without requiring the user to grant permission
 *    again. The old [notifPermission] dep meant a user whose permission was
 *    already "granted" from a previous session would never re-subscribe after
 *    a server restart, silently dropping all IT push notifications.
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
import ITNotifPanel      from "../components/common/ITNotifPanel.jsx";
import {
  requestNotificationPermission,
  getNotificationPermission,
  triggerAlert,
  registerPushSubscription,
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
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      gap:12, padding:"10px 28px",
      background:   isDenied ? "var(--danger-lt)" : "var(--warn-lt)",
      borderBottom: `1px solid ${isDenied ? "rgba(184,48,48,0.2)" : "rgba(143,66,12,0.2)"}`,
      flexWrap:"wrap",
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
        <button onClick={onRequest}
          style={{ padding:"7px 16px", borderRadius:"var(--radius-sm)", border:"1.5px solid var(--warn)", background:"var(--warn-lt)", color:"var(--warn)", fontFamily:"var(--ff-body)", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s ease", flexShrink:0 }}
          onMouseEnter={e => { e.currentTarget.style.background="var(--warn)"; e.currentTarget.style.color="#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background="var(--warn-lt)"; e.currentTarget.style.color="var(--warn)"; }}>
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
function OverlayNotif({ notif, queueLength, onAck, onClose }) {
  const isCampaign  = notif.type === "campaign";
  const accentColor = isCampaign ? "var(--accent)" : "var(--info)";
  const accentBg    = isCampaign ? "var(--accent-lt)" : "var(--info-lt)";
  return (
    <div style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(18,17,12,0.85)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, animation:"itOverlayIn 0.3s cubic-bezier(.22,1,.36,1) both" }}>
      <style>{`
        @keyframes itOverlayIn { from{opacity:0}to{opacity:1} }
        @keyframes itCardIn    { from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none} }
        @keyframes itPulseRing { 0%{transform:scale(1);opacity:.9}70%{transform:scale(1.7);opacity:0}100%{transform:scale(1.7);opacity:0} }
        @keyframes itBounceIn  { 0%{transform:scale(.3)}50%{transform:scale(1.07)}70%{transform:scale(.96)}100%{transform:scale(1)} }
      `}</style>
      <div style={{ width:"100%", maxWidth:500, background:"var(--surface)", border:`1px solid ${isCampaign?"rgba(42,96,72,0.4)":"rgba(26,79,110,0.4)"}`, borderRadius:20, overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.05)", animation:"itCardIn .35s cubic-bezier(.22,1,.36,1) both" }}>
        <div style={{ height:4, background: isCampaign?"linear-gradient(90deg,var(--accent),#3a7a5a)":"linear-gradient(90deg,var(--info),#2a6a8e)" }}/>
        <div style={{ padding:"24px 28px 18px", background:"var(--surface2)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"flex-start", gap:16 }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:accentBg, animation:"itPulseRing 1.6s ease-out infinite" }}/>
            <div style={{ width:46, height:46, borderRadius:"50%", background:accentBg, border:`2px solid ${accentColor}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, position:"relative", animation:"itBounceIn .5s cubic-bezier(.22,1,.36,1) .1s both" }}>
              {isCampaign ? "📋" : "🗓"}
            </div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:"0 0 4px", fontSize:10, fontFamily:"var(--ff-mono)", letterSpacing:"0.1em", textTransform:"uppercase", color:accentColor, fontWeight:600 }}>
              {isCampaign ? "🔴 New Task Assigned" : "⏰ Daily Task Due Now"}
            </p>
            <h2 style={{ margin:"0 0 3px", fontSize:19, fontWeight:700, color:"var(--text)", fontFamily:"var(--ff-display)", letterSpacing:"-0.02em", lineHeight:1.2 }}>{notif.title}</h2>
            <p style={{ margin:0, fontSize:11, color:"var(--muted)", fontFamily:"var(--ff-mono)" }}>
              Received {new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",hour12:true})}
              {queueLength > 1 && <span style={{ marginLeft:8, padding:"1px 8px", borderRadius:99, background:"var(--danger-lt)", color:"var(--danger)", border:"1px solid rgba(184,48,48,.2)", fontSize:10 }}>+{queueLength-1} more waiting</span>}
            </p>
          </div>
        </div>
        <div style={{ padding:"20px 28px" }}>
          <div style={{ padding:"13px 16px", background:"var(--surface3)", border:"1px solid var(--border)", borderRadius:10, marginBottom:14 }}>
            <p style={{ margin:"0 0 6px", fontSize:8, fontFamily:"var(--ff-mono)", letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)" }}>{isCampaign?"PM Note / Message":"Task Description"}</p>
            <p style={{ margin:0, fontSize:14, color:"var(--ink)", lineHeight:1.65, wordBreak:"break-word", fontFamily:"var(--ff-body)" }}>{notif.body||"—"}</p>
          </div>
          <div style={{ display:"flex", alignItems:"flex-start", gap:9, padding:"10px 14px", background:"rgba(143,66,12,.07)", border:"1px solid rgba(143,66,12,.18)", borderRadius:8, marginBottom:20 }}>
            <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>⚠️</span>
            <p style={{ margin:0, fontSize:12, color:"var(--warn)", lineHeight:1.55, fontFamily:"var(--ff-body)" }}>This notification requires your attention. Acknowledge to confirm, or dismiss to handle it later.</p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose}
              style={{ flex:1, padding:"12px", borderRadius:10, border:"1.5px solid var(--border2)", background:"none", fontFamily:"var(--ff-body)", fontSize:13, fontWeight:500, color:"var(--muted)", cursor:"pointer", transition:"all .15s ease" }}
              onMouseEnter={e=>{e.currentTarget.style.color="var(--ink)";e.currentTarget.style.background="var(--surface2)";}}
              onMouseLeave={e=>{e.currentTarget.style.color="var(--muted)";e.currentTarget.style.background="none";}}>
              Dismiss (handle later)
            </button>
            <button onClick={() => onAck(notif)}
              style={{ flex:2, padding:"12px", borderRadius:10, border:"1.5px solid transparent", background:isCampaign?"linear-gradient(135deg,var(--accent),#3a7a5a)":"linear-gradient(135deg,var(--info),#2a6a8e)", fontFamily:"var(--ff-body)", fontSize:14, fontWeight:600, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all .15s ease", boxShadow:"0 4px 16px rgba(0,0,0,.15)" }}
              onMouseEnter={e=>{e.currentTarget.style.opacity=".9";e.currentTarget.style.transform="translateY(-1px)";}}
              onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="none";}}>
              <span style={{ fontSize:16 }}>✓</span> Acknowledge Now
            </button>
          </div>
        </div>
        <div style={{ padding:"10px 28px", background:"var(--surface2)", borderTop:"1px solid var(--border)", display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:accentColor, animation:"itPulseRing 1.6s ease-out infinite", flexShrink:0 }}/>
          <p style={{ margin:0, fontSize:11, color:"var(--muted)", fontFamily:"var(--ff-mono)" }}>IT Portal · Campaign Management System</p>
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
        <div className="table-empty-icon" style={{ fontSize:28 }}>⏳</div>
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
      <thead style={{ position:"sticky", top:0, zIndex:1, background:"var(--surface2)" }}>
        <tr>
          <th style={{ width:"38%" }}>PM Note</th>
          <th style={{ width:"18%", whiteSpace:"nowrap" }}>Schedule Time</th>
          <th style={{ width:"44%" }}>IT Note</th>
        </tr>
      </thead>
      <tbody>
        {records.map(c => {
          const isDone    = c.acknowledgement === "done";
          const noteColor = isDone ? "var(--accent)" : "var(--warn)";
          return (
            <tr key={c._id}>
              <td style={{ padding:"16px 18px", maxWidth:0, wordBreak:"break-word", whiteSpace:"pre-wrap", lineHeight:1.65, verticalAlign:"top" }}>
                {c.pmMessage
                  ? <span style={{ fontSize:13, color:"var(--ink)", fontFamily:"var(--ff-body)" }}>{c.pmMessage}</span>
                  : <span style={{ fontSize:12, color:"var(--muted)", fontStyle:"italic" }}>No PM note</span>}
              </td>
              <td className="time-cell" style={{ padding:"16px 18px", verticalAlign:"top", whiteSpace:"nowrap" }}>
                {c.scheduleAt ? fmt(c.scheduleAt) : "—"}
              </td>
              <td style={{ padding:"16px 18px", maxWidth:0, verticalAlign:"top", borderLeft:`3px solid ${noteColor}`, wordBreak:"break-word", whiteSpace:"pre-wrap", lineHeight:1.65 }}>
                {c.itMessage
                  ? <span style={{ fontSize:13, color:"var(--ink)", fontFamily:"var(--ff-body)" }}>{c.itMessage}</span>
                  : <span style={{ fontSize:12, color:"var(--muted)", fontStyle:"italic" }}>No IT note</span>}
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
    if (showSpinner) setHistoryLoading(true); else setHistoryRefreshing(true);
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

  // ── Notification permission ────────────────────────────────────────────────
  const [notifPermission, setNotifPermission] = useState(() => getNotificationPermission());

  // FIX: Use [] so push re-registers on every mount, not only when permission
  // state changes. The server's in-memory subscriptions Map is cleared on every
  // restart; without this fix, IT users already holding "granted" permission
  // would never re-subscribe after a deploy — identical to the PM dashboard fix.
  useEffect(() => {
    if (getNotificationPermission() === "granted") {
      registerPushSubscription().catch(err =>
        console.warn("[Push] Registration failed:", err.message)
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── BroadcastChannel ──────────────────────────────────────────────────────
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

  const handleRequestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(granted ? "granted" : "denied");
  }, []);

  const pushOverlay = useCallback((notif) => {
    const entry = { ...notif, id: Date.now() + Math.random() };
    setOverlayQueue(prev => [...prev, entry]);
    bcRef.current?.postMessage({ type: "overlay_push", notif: entry });
  }, []);

  const dismissOverlay  = useCallback(() => setOverlayQueue(prev => prev.slice(1)), []);
  const ackFromOverlay  = useCallback((notif) => {
    dismissOverlay();
    if (notif.type === "campaign") setAckTarget(notif.item);
    else if (notif.type === "task") setTaskAckTarget(notif.item);
  }, [dismissOverlay]);

  // ── Reactive now ──────────────────────────────────────────────────────────
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

  useEffect(() => {
    const id = setInterval(() => getCampaign().catch(console.error), 60_000);
    return () => clearInterval(id);
  }, [getCampaign]);

  useEffect(() => {
    const id = setInterval(() => fetchDueTasks(), 60_000);
    return () => clearInterval(id);
  }, [fetchDueTasks]);

  useEffect(() => {
    if (activeSection === "schedule-tasks") fetchDueTasks();
  }, [activeSection, fetchDueTasks]);

  // ── Socket handlers ───────────────────────────────────────────────────────
  useSocket({
    // ── Campaign queue ────────────────────────────────────────────────────
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

      // FIX: call triggerAlert directly (sound + OS notification) — same as PMDashboard
      triggerAlert(
        "New Task Assigned",
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

    "campaign:schedule_fired": c => {
      useCampaignStore.setState(s => ({
        campaigns: s.campaigns.map(x => x._id === c._id ? c : x),
      }));
    },

    // ── Daily tasks ────────────────────────────────────────────────────────
    "dailytask:queued": task => {
      setDailyTasks(prev => {
        const exists = prev.some(t => String(t._id) === String(task._id));
        return exists ? prev : [task, ...prev];
      });
      const taskPreview = (task.task || "Daily task needs acknowledgement").slice(0, 100);
      addNotification(`🗓 Daily task due: "${taskPreview}${taskPreview.length >= 100 ? "…" : ""}"`);

      // FIX: call triggerAlert directly (sound + OS notification) — same as PMDashboard
      triggerAlert(
        "Daily Task Due Now",
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
        day:"2-digit", month:"2-digit", year:"numeric",
        hour:"2-digit", minute:"2-digit", hour12:false,
      });
      const finalMessage = itMessage
        ? `${itMessage}\n\nat ${doneAt} by ${user}`
        : `at ${doneAt} by ${user}`;
      await updateCampaign(ackTarget._id, { acknowledgement, itMessage: finalMessage });
      if (acknowledgement === "done") {
        addNotification(`✅ Campaign "${ackTarget.message?.slice(0,30)}…" marked Done by ${user}`);
        pushToast("Task acknowledged as Done. PMs & owner notified.");
      } else {
        addNotification(`⚠ "${ackTarget.message?.slice(0,30)}…" marked Not Done — Reason: ${itMessage}`);
        pushToast("Task marked Not Done.", "warn");
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
      setDailyTasks(prev => prev.filter(t => String(t._id) !== String(taskId)));
      setTaskAckTarget(null);
      pushToast("Daily task acknowledged. PMs notified.");
      addNotification(`✅ Daily task acknowledged by ${user}`);
    } catch (err) {
      pushToast(err?.response?.data?.message || "Failed to acknowledge task.", "warn");
    } finally { setTaskAckLoading(false); }
  };

  // ── Nav ───────────────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    { id:"tasks",          label:"Tasks",          icon:"📋", count: pendingCount      },
    { id:"schedule-tasks", label:"Schedule Tasks", icon:"🗓", count: dailyTasks.length },
    { id:"history",        label:"History",        icon:"🕓", count: history.length    },
  ];

  return (
    <div className="it-root" style={{ height:"100vh", overflow:"hidden" }}>
      <div className={`sidebar-overlay ${sidebarOpen?"show":""}`} onClick={() => setSidebarOpen(false)}/>

      {/* ── Sidebar ── */}
      <aside className={`it-sidebar ${sidebarOpen?"mobile-open":""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">Task<i style={{ fontStyle:"normal", opacity:.4 }}>.</i></div>
          <div className="sidebar-brand-sub">IT Portal</div>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{initials(user||"IT")}</div>
          <div>
            <div className="user-info-name">{user||"IT User"}</div>
            <div className="user-info-role">{role}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`nav-item ${activeSection===item.id?"active":""}`}
              onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}>
              <span className="nav-icon">{item.icon}</span>
              <span style={{ flex:1 }}>{item.label}</span>
              {item.count > 0 && (
                <span style={{ padding:"1px 7px", borderRadius:99, background: activeSection===item.id?"var(--accent)":"var(--surface3)", color: activeSection===item.id?"#fff":"var(--muted)", fontSize:10, fontFamily:"var(--ff-mono)", fontWeight:700 }}>
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
        <NotifPermissionBanner permission={notifPermission} onRequest={handleRequestPermission}/>

        {/* ── Header ── */}
        <header className="it-header">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span/><span/><span/>
          </button>
          <h1 className="header-title">
            {activeSection==="tasks"          && "Scheduled Campaigns"}
            {activeSection==="schedule-tasks" && "Schedule Tasks"}
            {activeSection==="history"        && "Acknowledgement History"}
          </h1>
          <span className="header-badge">
            {activeSection==="tasks"          && `${pendingCount} Pending`}
            {activeSection==="schedule-tasks" && `${dailyTasks.length} Due`}
            {activeSection==="history"        && `${history.length} Records`}
          </span>

          {/* Notification Bell */}
          <div style={{ position:"relative" }} ref={notifBellRef}>
            <button
              onClick={() => { setShowNotifs(v => !v); if (!showNotifs) markRead(); }}
              title={`${unread} unread notifications`}
              style={{ width:46, height:36, borderRadius:"var(--radius-sm)", border: showNotifs?"1.5px solid var(--accent)":"1px solid var(--border)", background: showNotifs?"var(--accent-lt)":"var(--surface)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .18s ease", position:"relative", flexShrink:0, boxShadow: showNotifs?"0 2px 8px rgba(42,96,72,.15)":"var(--shadow-sm)" }}
              onMouseEnter={e => { if (!showNotifs) { e.currentTarget.style.borderColor="var(--border2)"; e.currentTarget.style.background="var(--surface2)"; } }}
              onMouseLeave={e => { if (!showNotifs) { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="var(--surface)"; } }}
              aria-label="Notifications">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={showNotifs?"var(--accent)":"var(--muted)"} strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              {unread > 0 && (
                <span style={{ position:"absolute", top:-4, right:-4, minWidth:16, height:16, borderRadius:99, background:"var(--danger)", color:"#fff", fontSize:9, fontFamily:"var(--ff-mono)", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px", border:"2px solid var(--bg)" }}>
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
              {overlayQueue.length > 0 && unread === 0 && (
                <span style={{ position:"absolute", top:-4, right:-4, width:10, height:10, borderRadius:"50%", background:"var(--warn)", border:"2px solid var(--bg)" }}/>
              )}
            </button>
            <ITNotifPanel open={showNotifs} onClose={() => setShowNotifs(false)} width={310}/>
          </div>
        </header>

        {/* ══════ CAMPAIGNS ══════ */}
        {activeSection==="tasks" && (
          <div className="it-content" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
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
                    <tr><th>PM Note</th><th>Scheduled At</th><th>Status</th><th>Action</th><th>Acknowledge</th></tr>
                  </thead>
                  <tbody>
                    {itCampaigns.map(c => (
                      <tr key={c._id}>
                        <td style={{ maxWidth:320, wordBreak:"break-word", whiteSpace:"pre-wrap", lineHeight:1.6, padding:"16px 18px" }}>{c.pmMessage||"—"}</td>
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

        {/* ══════ SCHEDULE TASKS ══════ */}
        {activeSection==="schedule-tasks" && (
          <div className="it-content" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div className="section-head" style={{ flexShrink:0 }}>
              <span className="section-title">Today's Task Queue</span>
              <button className="refresh-btn" onClick={fetchDueTasks} disabled={taskFetching}>
                {taskFetching ? "⟳ Loading…" : "⟳ Refresh"}
              </button>
            </div>
            <div className="table-wrap" style={{ flex:1, overflow:"auto" }}>
              {taskFetching ? (
                <div className="table-empty"><div className="table-empty-icon" style={{ fontSize:28 }}>⏳</div><div className="table-empty-text">Loading tasks…</div></div>
              ) : dailyTasks.length === 0 ? (
                <div className="table-empty"><div className="table-empty-icon">✅</div><div className="table-empty-text">No tasks due right now. Check back at the scheduled times.</div></div>
              ) : (
                <table>
                  <thead style={{ position:"sticky", top:0, zIndex:1, background:"var(--surface2)" }}>
                    <tr><th>Task</th><th>Scheduled Time</th><th>Created By</th><th>Acknowledge</th></tr>
                  </thead>
                  <tbody>
                    {dailyTasks.map(t => {
                      const creatorName = typeof t.createdBy==="object" ? t.createdBy?.username : "PM";
                      return (
                        <tr key={t._id}>
                          <td style={{ maxWidth:400, wordBreak:"break-word", whiteSpace:"pre-wrap", lineHeight:1.6, padding:"16px 18px" }}>{t.task}</td>
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

        {/* ══════ HISTORY ══════ */}
        {activeSection==="history" && (
          <div className="it-content" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:16, padding:"10px 16px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", flexShrink:0, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--ff-mono)" }}>IT NOTE border colour:</span>
              <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontFamily:"var(--ff-body)", color:"var(--accent)" }}>
                <span style={{ display:"inline-block", width:3, height:14, background:"var(--accent)", borderRadius:2 }}/>Done
              </span>
              <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, fontFamily:"var(--ff-body)", color:"var(--warn)" }}>
                <span style={{ display:"inline-block", width:3, height:14, background:"var(--warn)", borderRadius:2 }}/>Not Done
              </span>
            </div>
            <div className="section-head" style={{ flexShrink:0 }}>
              <span className="section-title">Acknowledgement History</span>
              <button className="refresh-btn" onClick={() => fetchHistory(false)} disabled={historyRefreshing}>
                {historyRefreshing ? "⟳ Refreshing…" : "⟳ Refresh"}
              </button>
            </div>
            <div className="table-wrap" style={{ flex:1, overflow:"auto" }}>
              <HistoryTable records={history} loading={historyLoading}/>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {ackTarget     && <AckModal campaign={ackTarget} onClose={() => setAckTarget(null)} onConfirm={handleAck} loading={ackLoading}/>}
      {taskAckTarget && <TaskAckModal task={taskAckTarget} onClose={() => setTaskAckTarget(null)} onConfirm={handleTaskAck} loading={taskAckLoading}/>}

      {currentOverlay && <OverlayNotif notif={currentOverlay} queueLength={overlayQueue.length} onClose={dismissOverlay} onAck={ackFromOverlay}/>}

      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast ${t.type==="warn"?"warn":""}`}>{t.msg}</div>)}
      </div>
    </div>
  );
}