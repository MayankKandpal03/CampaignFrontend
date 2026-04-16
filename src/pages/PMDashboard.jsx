// src/pages/PMDashboard.jsx
/**
 * PMDashboard — fixed.
 *
 * FIXES vs previous version:
 *
 * 1. Open Requests now shows pending (no PM action) + approved campaigns.
 *    Previously it only showed action==="approve" && !acknowledgement.
 *    Filter cards limited to OPEN_REQUEST_FILTER_CARDS (pending + approved).
 *
 * 2. Closed Requests now shows done + cancelled campaigns only.
 *    Filter cards limited to CLOSED_REQUEST_FILTER_CARDS (done + cancelled).
 *
 * 3. No other logic changed — socket handlers, user CRUD, campaign actions
 *    all remain identical.
 */
import { useEffect, useState, useCallback, useMemo } from "react";

import useAuthStore  from "../stores/useAuthStore.js";
import useNotifStore from "../stores/useNotificationStore.js";

import { useResponsive }                   from "../hooks/useResponsive.js";
import { useSocket }                       from "../hooks/useSocket.js";
import { useLogout }                       from "../hooks/useLogout.js";
import { T }                               from "../constants/theme.js";
import {
  OPEN_REQUEST_CARDS,
  OPEN_REQUEST_FILTER_CARDS,
  CLOSED_REQUEST_FILTER_CARDS,
} from "../constants/filterCards.js";
import { fetchCampaigns, updateCampaign }  from "../services/campaignService.js";
import { fetchUsers, deleteUser }          from "../services/userService.js";

import OpsGlobalStyles  from "../components/common/OpsGlobalStyles.jsx";
import GoldBtn          from "../components/common/GoldBtn.jsx";
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

  const [campaigns,    setCampaigns]    = useState([]);
  const [camLoading,   setCamLoading]   = useState(true);
  const [actionTarget, setActionTarget] = useState(null);

  const [users,        setUsers]        = useState([]);
  const [userLoading,  setUserLoading]  = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Socket ─────────────────────────────────────────────────────────────────
  useSocket({
    "campaign:created": c => {
      setCampaigns(p => {
        if (p.some(x => x._id === c._id)) return p;
        return [c, ...p];
      });
      addNotification(`Campaign created by ${c.performerName || "someone"}`);
    },
    "campaign:updated": c => {
      setCampaigns(p => p.map(x => x._id === c._id ? c : x));
      const msg = c.status === "cancel" || c.action === "cancel"
        ? `Campaign cancelled by ${c.performerName || "someone"}`
        : `Campaign updated by ${c.performerName || "someone"}`;
      addNotification(msg);
    },
    "campaign:it_queued": c => {
      setCampaigns(p => p.map(x => x._id === c._id ? c : x));
      addNotification(`Campaign approved by ${c.performerName || "PM"} — sent to IT`);
    },
    "campaign:deleted": d => setCampaigns(p => p.filter(x => x._id !== d._id)),
    "campaign:it_ack": c => {
      setCampaigns(p => p.map(x => x._id === c._id ? c : x));
      const msg = c.acknowledgement === "done"
        ? `${c.performerName || "IT"} completed campaign`
        : `${c.performerName || "IT"} could not complete campaign`;
      addNotification(msg);
    },
  });

  // ── Load campaigns ─────────────────────────────────────────────────────────
  const loadCampaigns = useCallback(async () => {
    setCamLoading(true);
    try   { setCampaigns(await fetchCampaigns()); }
    catch { addNotification("Failed to load campaigns"); }
    finally { setCamLoading(false); }
  }, [addNotification]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  // ── Load users ─────────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (activeSection === "users") loadUsers();
  }, [activeSection, loadUsers]);

  // ── Derived ────────────────────────────────────────────────────────────────
  /**
   * FIX: Open Requests = campaigns pending PM review OR already approved.
   * Previous: only approved & no-ack campaigns.
   * Now PM can see everything that still needs attention in one place.
   */
  const openRequests = useMemo(() =>
    campaigns.filter(c => !c.action || c.action === "approve")
  , [campaigns]);

  /**
   * FIX: Closed Requests = done OR cancelled only.
   * Previous included acknowledgement-based filter which was redundant.
   */
  const closedRequests = useMemo(() =>
    campaigns.filter(c =>
      c.status === "cancel" || c.action === "cancel" || c.status === "done"
    )
  , [campaigns]);

  const totalUsers = useMemo(() =>
    users.filter(u => ["manager","ppc","it"].includes(u.role)).length
  , [users]);

  const openStats = useMemo(() => ({
    waiting: campaigns.filter(c => c.action === "approve" && !c.acknowledgement).length,
    acked:   campaigns.filter(c => c.action === "approve" && c.acknowledgement === "done").length,
    done:    campaigns.filter(c => c.status === "done").length,
  }), [campaigns]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const goTo = section => { setActiveSection(section); setSidebarOpen(false); };

  const handleAction = useCallback(async (campaignId, { action, pmMessage, scheduleAt }) => {
    const updated = await updateCampaign(campaignId, { action, pmMessage, scheduleAt });
    if (updated) {
      setCampaigns(prev => prev.map(c => c._id === updated._id ? updated : c));
    }
  }, []);

  const handleDeleteUser = useCallback(async id => {
    await deleteUser(id);
    setUsers(prev => prev.filter(u => u._id !== id));
  }, []);

  const handleUserCreated = useCallback(() => {
    if (activeSection === "users") loadUsers();
  }, [activeSection, loadUsers]);

  const NAV = [
    { id: "campaigns",       label: "Campaigns",       count: campaigns.length       },
    { id: "users",           label: "Users",           count: totalUsers             },
    { id: "manage-users",    label: "Manage Users"                                   },
    { id: "open-requests",   label: "Open Requests",   count: openRequests.length   },
    { id: "closed-requests", label: "Closed Requests", count: closedRequests.length },
  ];

  const SECTION_TITLE = {
    campaigns:          "Campaigns",
    users:              "Users",
    "manage-users":     "Manage Users",
    "open-requests":    "Open Requests",
    "closed-requests":  "Closed Requests",
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans',sans-serif" }}>
      <OpsGlobalStyles />

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:"fixed", inset:0, zIndex:7999, background:"rgba(0,0,0,0.72)" }} />
      )}

      <DashboardSidebar brandSub="PM PANEL" navItems={NAV} activeSection={activeSection}
        onNavigate={goTo} user={user} role="process manager" onLogout={handleLogout}
        isMobile={isMobile} open={sidebarOpen} />

      <main style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <DashboardHeader isMobile={isMobile}
          onMenuToggle={() => setSidebarOpen(v => !v)} sidebarOpen={sidebarOpen}
          title={SECTION_TITLE[activeSection] || "Dashboard"}
          subLabel="— PROCESS MANAGER" />

        <div style={{ padding: isMobile ? "16px 14px" : "22px 28px", flex:1 }}>

          {/* ── ALL CAMPAIGNS ─────────────────────────────────────────── */}
          {activeSection === "campaigns" && (
            <div style={{ animation:"opsFadeUp .22s ease" }}>
              <CampaignsTable campaigns={campaigns} loading={camLoading}
                onAction={setActionTarget} isMobile={isMobile}
                title="ALL CAMPAIGNS" showActionBtn />
            </div>
          )}

          {/* ── USERS (3-tab) ──────────────────────────────────────────── */}
          {activeSection === "users" && (
            <div style={{ animation:"opsFadeUp .22s ease" }}>
              <PMUserSection
                users={users}
                loading={userLoading}
                onDelete={target => setDeleteTarget(target)}
                onRefresh={loadUsers} />
            </div>
          )}

          {/* ── MANAGE USERS ──────────────────────────────────────────── */}
          {activeSection === "manage-users" && (
            <div style={{ animation:"opsFadeUp .22s ease", maxWidth:540 }}>
              <div style={{ padding:"13px 18px", marginBottom:22, border:`1px solid ${T.goldBorder}`, borderRadius:4, background:T.bgCard }}>
                <p style={{ margin:0, fontSize:12, color:T.muted, lineHeight:1.6 }}>
                  As a Process Manager, you can create Manager, IT, and other Process Manager accounts.
                </p>
              </div>
              <div style={{ background:T.bgCard, border:`1px solid ${T.goldBorder}`, borderRadius:4, padding: isMobile ? "22px 18px" : "28px 26px 24px" }}>
                <h2 style={{ margin:"0 0 22px", fontSize:15, fontWeight:600, color:T.white, fontFamily:"'Cinzel',serif", letterSpacing:"0.08em" }}>
                  Create User Account
                </h2>
                <CreateUserForm allowedRoles={["manager","process manager","it"]} onSuccess={handleUserCreated} />
              </div>
            </div>
          )}

          {/* ── OPEN REQUESTS ─────────────────────────────────────────── */}
          {activeSection === "open-requests" && (
            <div style={{ animation:"opsFadeUp .22s ease" }}>
              {/* Summary stat row (Waiting IT / IT Done / Done) */}
              <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:20 }}>
                {OPEN_REQUEST_CARDS.map(card => (
                  <div key={card.id} style={{
                    flex:"1 1 0", minWidth:120, padding:"14px 16px 12px", borderRadius:4,
                    background:T.bgCard, border:`1px solid ${T.goldBorder}`, userSelect:"none",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:card.color, flexShrink:0 }} />
                      <span style={{ fontSize:8, fontWeight:700, letterSpacing:"0.18em", color:T.muted, fontFamily:"'Cinzel',serif" }}>
                        {card.label.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize:26, fontWeight:700, color:T.white, fontFamily:"'Cinzel',serif", lineHeight:1 }}>
                      {openStats[card.id] ?? 0}
                    </div>
                    <div style={{ fontSize:9, color:T.muted, marginTop:4 }}>campaigns</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:20, padding:"12px 18px", background:T.bgCard, border:`1px solid ${T.teal}33`, borderRadius:4 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:T.teal, flexShrink:0, boxShadow:`0 0 8px ${T.teal}` }} />
                <p style={{ margin:0, fontSize:12, color:T.muted, lineHeight:1.6 }}>
                  Campaigns <strong style={{ color:T.amber }}>awaiting your review</strong> or{" "}
                  <strong style={{ color:T.teal }}>approved</strong> and waiting for IT.
                </p>
              </div>

              {/* FIX: pass OPEN_REQUEST_FILTER_CARDS — shows only Pending + Approved cards */}
              <CampaignsTable
                campaigns={openRequests}
                loading={camLoading}
                onAction={setActionTarget}
                isMobile={isMobile}
                title="OPEN · PENDING & APPROVED"
                showActionBtn
                filterCards={OPEN_REQUEST_FILTER_CARDS}
              />
            </div>
          )}

          {/* ── CLOSED REQUESTS ───────────────────────────────────────── */}
          {activeSection === "closed-requests" && (
            <div style={{ animation:"opsFadeUp .22s ease" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:20, padding:"12px 18px", background:T.bgCard, border:`1px solid ${T.subtle}`, borderRadius:4 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:T.muted, flexShrink:0 }} />
                <p style={{ margin:0, fontSize:12, color:T.muted, lineHeight:1.6 }}>
                  Closed campaigns — marked Done or Cancelled.
                </p>
              </div>

              {/* FIX: pass CLOSED_REQUEST_FILTER_CARDS — shows only Done + Cancelled cards */}
              <CampaignsTable
                campaigns={closedRequests}
                loading={camLoading}
                onAction={setActionTarget}
                isMobile={isMobile}
                title="CLOSED · DONE & CANCELLED"
                showActionBtn={false}
                filterCards={CLOSED_REQUEST_FILTER_CARDS}
              />
            </div>
          )}
        </div>
      </main>

      {actionTarget && (
        <ActionModal campaign={actionTarget} onClose={() => setActionTarget(null)} onSave={handleAction} />
      )}
      {deleteTarget && (
        <DeleteUserModal target={deleteTarget} onClose={() => setDeleteTarget(null)}
          onConfirm={id => handleDeleteUser(id)} />
      )}
    </div>
  );
}