/**
 * DeleteUserModal — confirms permanent user removal.
 * All logic unchanged. Only styling updated.
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
        position:       "fixed",
        inset:          0,
        zIndex:         9000,
        background:     "rgba(0,0,0,0.8)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        16,
      }}
    >
      <div style={{
        background:   `linear-gradient(160deg, ${T.bgCard}, ${T.bg})`,
        border:       `1px solid rgba(220,82,82,0.3)`,
        borderRadius: 14,
        padding:      "28px 28px 24px",
        width:        "100%",
        maxWidth:     408,
        boxShadow:    `0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(220,82,82,0.1)`,
        animation:    "opsIn 0.24s cubic-bezier(.22,1,.36,1)",
      }}>

        {/* Header */}
        <div style={{marginBottom:18}}>
          <div style={{
            display:     "flex",
            alignItems:  "center",
            gap:         8,
            marginBottom:8,
          }}>
            <div style={{
              width:          28,
              height:         28,
              borderRadius:   7,
              background:     T.redBg,
              border:         `1px solid ${T.red}44`,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <p style={{ margin:0, fontSize:8, letterSpacing:"0.2em", color:T.red, fontFamily:"'Cinzel',serif", textTransform:"uppercase" }}>
              Danger Zone
            </p>
          </div>
          <h3 style={{ margin:0, fontSize:17, fontWeight:600, color:T.white, fontFamily:"'Cinzel',serif" }}>
            {title}
          </h3>
        </div>

        {/* User preview */}
        <div style={{
          padding:"12px 14px", background:T.bgInput,
          border:`1px solid ${T.subtle}`, borderRadius:8, marginBottom:14,
        }}>
          <p style={{ margin:"0 0 3px", fontSize:13, fontWeight:500, color:T.text, fontFamily:"'Cinzel',serif" }}>
            {target.username}
          </p>
          <p style={{ margin:"0 0 8px", fontSize:11, color:T.muted, fontFamily:"'JetBrains Mono',monospace" }}>
            {target.email}
          </p>
          {target.role && <RoleBadge role={target.role}/>}
        </div>

        {/* Warning */}
        <div style={{
          padding:"10px 14px", background:T.redBg,
          border:`1px solid ${T.red}25`, borderRadius:8, marginBottom:18,
        }}>
          <p style={{ margin:0, fontSize:12, color:"#f09090", lineHeight:1.65, fontFamily:"'DM Sans',sans-serif" }}>
            This action is <strong style={{color:T.red}}>permanent</strong>. The user will be removed from all teams and will no longer be able to log in.
          </p>
        </div>

        {err && (
          <div style={{ padding:"9px 13px", background:T.redBg, borderRadius:8, color:T.red, fontSize:12, marginBottom:14 }}>
            {err}
          </div>
        )}

        <div style={{ display:"flex", gap:10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex:1, padding:"11px", borderRadius:8, cursor:"pointer",
              background:"transparent", border:`1px solid ${T.subtle}`,
              color:T.muted, fontSize:11, letterSpacing:"0.1em",
              fontFamily:"'Cinzel',serif", textTransform:"uppercase", transition:"all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.goldBorder; e.currentTarget.style.color = T.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.subtle; e.currentTarget.style.color = T.muted; }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handle}
            disabled={busy}
            style={{
              flex:2, padding:"11px", borderRadius:8,
              cursor:busy ? "not-allowed" : "pointer",
              opacity:busy ? 0.6 : 1,
              background:T.redBg, border:`1px solid ${T.red}55`,
              color:T.red, fontSize:11, fontWeight:700, letterSpacing:"0.12em",
              fontFamily:"'Cinzel',serif", textTransform:"uppercase", transition:"all 0.15s ease",
            }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.background = "rgba(220,82,82,0.2)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.redBg; }}
          >
            {busy ? "Deleting…" : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}