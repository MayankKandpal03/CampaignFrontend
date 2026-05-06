/**
 * DeleteUserModal — confirms permanent user removal.
 * Nature-inspired light theme.
 */
import { useState, useEffect } from "react";
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
      className="fixed inset-0 z-9000 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white border border-[rgba(184,48,48,0.2)] rounded-[14px] p-7 w-full max-w-102 shadow-[0_12px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.06)] animate-[opsIn_0.24s_cubic-bezier(0.22,1,0.36,1)]">

        {/* Header */}
        <div className="mb-4.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-[7px] bg-[rgba(184,48,48,0.08)] border border-[rgba(184,48,48,0.18)] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b83030" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <p className="m-0 text-[8px] tracking-[0.2em] text-[#b83030] font-['Fraunces',serif] uppercase">
              Danger Zone
            </p>
          </div>
          <h3 className="m-0 text-[17px] font-semibold text-[#1a1810] font-['Fraunces',serif]">
            {title}
          </h3>
        </div>

        {/* User preview */}
        <div className="px-3.5 py-3 bg-[#f8f7f4] border border-[#e8e5de] rounded-lg mb-3.5">
          <p className="m-0 mb-0.75 text-[13px] font-medium text-[#2d2a24] font-['Fraunces',serif]">{target.username}</p>
          <p className="m-0 mb-2 text-[11px] text-[#8a8475] font-['JetBrains_Mono',monospace]">{target.email}</p>
          {target.role && <RoleBadge role={target.role}/>}
        </div>

        {/* Warning */}
        <div className="px-3.5 py-2.5 bg-[rgba(184,48,48,0.06)] border border-[rgba(184,48,48,0.12)] rounded-lg mb-4.5">
          <p className="m-0 text-xs text-[#c85050] leading-[1.65] font-['DM_Sans',sans-serif]">
            This action is <strong className="text-[#b83030]">permanent</strong>. The user will be removed from all teams and will no longer be able to log in.
          </p>
        </div>

        {err && (
          <div className="px-3.25 py-2.25 bg-[rgba(184,48,48,0.06)] rounded-lg text-[#b83030] text-xs mb-3.5">
            {err}
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.75 rounded-lg cursor-pointer bg-transparent border border-[#e8e5de] text-[#8a8475] text-[11px] tracking-widest font-['Fraunces',serif] uppercase transition-all duration-150 hover:border-[rgba(42,96,72,0.2)] hover:text-[#2a6048]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handle}
            disabled={busy}
            className="flex-2 py-2.75 rounded-lg bg-[rgba(184,48,48,0.08)] border border-[rgba(184,48,48,0.25)] text-[#b83030] text-[11px] font-bold tracking-[0.12em] font-['Fraunces',serif] uppercase transition-all duration-150 hover:bg-[rgba(184,48,48,0.14)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {busy ? "Deleting…" : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}