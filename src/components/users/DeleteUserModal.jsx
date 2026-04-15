/**
 * DeleteUserModal — confirms permanent user removal.
 * Previously copy-pasted into ManagerDashboard and PMDashboard with identical logic.
 * ManagerDashboard called it "Remove PPC Member"; PMDashboard called it "Delete User".
 * Unified with a `title` prop.
 */
import { useState, useEffect } from "react";
import { T } from "../../constants/theme.js";
import RoleBadge from "../common/RoleBadge.jsx";

export default function DeleteUserModal({ target, onClose, onConfirm, title = "Delete User" }) {
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  if (!target) return null;

  const handle = async () => {
    setBusy(true);
    setErr("");
    try {
      await onConfirm(target._id);
      onClose();
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{
        background: T.bgCard, border: `1px solid ${T.red}44`,
        borderRadius: 4, padding: "28px 26px 24px",
        width: "100%", maxWidth: 400,
        animation: "opsIn 0.22s cubic-bezier(.22,1,.36,1)",
      }}>
        <div style={{ marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 8, letterSpacing: "0.22em", color: T.red, fontFamily: "'Cinzel', serif" }}>— DANGER ZONE</p>
          <h3 style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 600, color: T.white, fontFamily: "'Cinzel', serif" }}>{title}</h3>
        </div>

        <div style={{
          padding: "12px 14px", background: T.bgInput,
          border: `1px solid ${T.subtle}`, borderRadius: 3, marginBottom: 16,
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500, color: T.text, fontFamily: "'Cinzel', serif" }}>
            {target.username}
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>
            {target.email}
          </p>
          {target.role && <RoleBadge role={target.role} />}
        </div>

        <div style={{
          padding: "10px 14px", background: T.redBg,
          border: `1px solid ${T.red}33`, borderRadius: 3, marginBottom: 18,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: "#f09090", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
            ⚠ This action is <strong style={{ color: T.red }}>permanent</strong>. The user will be
            removed from all teams and cannot log in.
          </p>
        </div>

        {err && (
          <div style={{
            padding: "9px 13px", background: T.redBg, borderRadius: 3,
            color: T.red, fontSize: 12, marginBottom: 14,
          }}>
            {err}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: "11px", borderRadius: 3, cursor: "pointer",
              background: "transparent", border: `1px solid ${T.subtle}`,
              color: T.muted, fontSize: 11, letterSpacing: "0.1em",
              fontFamily: "'Cinzel', serif", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.goldBorder; e.currentTarget.style.color = T.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.subtle;     e.currentTarget.style.color = T.muted; }}
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handle}
            disabled={busy}
            style={{
              flex: 2, padding: "11px", borderRadius: 3,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
              background: T.redBg, border: `1px solid ${T.red}66`,
              color: T.red, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
              fontFamily: "'Cinzel', serif", transition: "all 0.15s",
            }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.background = "rgba(224,82,82,0.22)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.redBg; }}
          >
            {busy ? "DELETING…" : "CONFIRM DELETE"}
          </button>
        </div>
      </div>
    </div>
  );
}
