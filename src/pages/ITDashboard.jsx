// src/pages/ITDashboard.jsx
/**
 * ITDashboard — updated.
 *
 * CHANGES:
 * 1. Removed "Campaign Message" (PPC message) column — only PM Note shown (req 3a)
 * 2. itCampaigns filter now excludes any acknowledged campaign (done OR not done)
 *    so "not done" campaigns disappear from the queue making them uneditable (req 3b)
 * 3. All other logic unchanged
 */
import { useEffect, useState, useCallback, useRef } from "react";

import useCampaignStore from "../stores/useCampaignStore.js";
import useAuthStore     from "../stores/useAuthStore.js";
import useNotifStore    from "../stores/useNotificationStore.js";
import { useSocket }    from "../hooks/useSocket.js";

import { fmt, initials } from "../utils/formatters.js";
import AckModal          from "../components/campaigns/AckModal.jsx";
import ResetPassword     from "../components/auth/ResetPassword.jsx";

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

export default function ITDashboard() {
  const campaigns      = useCampaignStore(s => s.campaigns);
  const getCampaign    = useCampaignStore(s => s.getCampaign);
  const updateCampaign = useCampaignStore(s => s.updateCampaign);
  const { user, role, logout } = useAuthStore();
  const addNotification = useNotifStore(s => s.addNotification);
  const unread          = useNotifStore(s => s.unread);

  const [tab,         setTab]         = useState("campaigns");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ackTarget,   setAckTarget]   = useState(null);
  const [ackLoading,  setAckLoading]  = useState(false);
  const [toasts,      setToasts]      = useState([]);
  const [refreshing,  setRefreshing]  = useState(false);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => { getCampaign().catch(console.error); }, [getCampaign]);

  // ── Real-time socket handlers ──────────────────────────────────────────────
  useSocket({
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
  });

  // ── 60-second auto-refresh (safety net for server restarts) ───────────────
  useEffect(() => {
    const id = setInterval(() => getCampaign().catch(console.error), 60_000);
    return () => clearInterval(id);
  }, [getCampaign]);

  // ── Derived campaign list ──────────────────────────────────────────────────
  // FIX (req 3b): exclude any campaign that has been acknowledged (done OR not done).
  // Previously only "done" was excluded; "not done" campaigns stayed in the queue.
  const now = Date.now();
  const itCampaigns = campaigns.filter((c) => {
    if (c.action !== "approve")  return false;
    if (c.status  === "cancel")  return false;
    // Exclude once acknowledged — covers both "done" and "not done"
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

  // ── Acknowledge handler ────────────────────────────────────────────────────
  const handleAck = async ({ acknowledgement, itMessage }) => {
    if (!ackTarget) return;
    setAckLoading(true);
    try {
      await updateCampaign(ackTarget._id, { acknowledgement, itMessage });
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

  const NAV = [
    { id: "campaigns", icon: "📋", label: "Scheduled Campaigns" },
    { id: "password",  icon: "🔑", label: "Reset Password"       },
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

        <nav className="sidebar-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`nav-item ${tab === n.id ? "active" : ""}`}
              onClick={() => { setTab(n.id); setSidebarOpen(false); }}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
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
            {tab === "campaigns" ? "Scheduled Campaigns" : "Reset Password"}
          </h1>
          {tab === "campaigns" && (
            <span className="header-badge">{pendingCount} Pending</span>
          )}
          <div
            className="notif-bell"
            title={`${unread} unread notifications`}
            onClick={() => pushToast(`You have ${unread} notification(s)`)}
          >
            🔔
            {unread > 0 && <span className="notif-dot" />}
          </div>
        </header>

        <div className="it-content">

          {/* ── CAMPAIGNS TAB ──────────────────────────────────────────── */}
          {tab === "campaigns" && (
            <>
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
                        {/* req 3a: PPC message removed — only PM Note shown */}
                        <th>PM Note</th>
                        <th>Scheduled At</th>
                        <th>Requested At</th>
                        <th>Status</th>
                        <th>Action</th>
                        <th>Acknowledge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itCampaigns.map((c) => (
                        <tr key={c._id}>
                          {/* PM Note only — PPC message column removed */}
                          <td className="msg-cell" title={c.pmMessage}>
                            {c.pmMessage || "—"}
                          </td>
                          <td className="time-cell">{fmt(c.scheduleAt)}</td>
                          <td className="time-cell">{fmt(c.requestedAt)}</td>
                          <td><StatusBadge value={c.status} /></td>
                          <td><StatusBadge value={c.action} /></td>
                          <td>
                            {/* req 3b: button only visible while in queue;
                                once acknowledged the row is filtered out */}
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
            </>
          )}

          {/* ── RESET PASSWORD TAB ─────────────────────────────────────── */}
          {tab === "password" && <ResetPassword />}
        </div>
      </div>

      {/* ── Modals ── */}
      {ackTarget && (
        <AckModal
          campaign={ackTarget}
          onClose={() => setAckTarget(null)}
          onConfirm={handleAck}
          loading={ackLoading}
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