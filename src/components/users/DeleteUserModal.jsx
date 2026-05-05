/**
 * DeleteUserModal — confirms permanent user removal.
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
      className="fixed inset-0 z-9000 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-linear-to-br from-[#141310] to-[#0c0b08] border border-[rgba(220,82,82,0.3)] rounded-[14px] p-7 w-full max-w-102 shadow-[0_24px_64px_rgba(0,0,0,0.7),0_4px_16px_rgba(0,0,0,0.5),0_0_0_1px_rgba(220,82,82,0.1)] animate-[opsIn_0.24s_cubic-bezier(0.22,1,0.36,1)]">

        {/* Header */}
        <div className="mb-4.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-[7px] bg-[rgba(224,82,82,0.12)] border border-[rgba(224,82,82,0.27)] flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e05252" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <p className="m-0 text-[8px] tracking-[0.2em] text-[#e05252] font-['Cinzel',serif] uppercase">
              Danger Zone
            </p>
          </div>
          <h3 className="m-0 text-[17px] font-semibold text-[#f5edd8] font-['Cinzel',serif]">
            {title}
          </h3>
        </div>

        {/* User preview */}
        <div className="px-3.5 py-3 bg-[#0a0908] border border-[#2e2c22] rounded-lg mb-3.5">
          <p className="m-0 mb-0.75 text-[13px] font-medium text-[#e8ddc8] font-['Cinzel',serif]">{target.username}</p>
          <p className="m-0 mb-2 text-[11px] text-[#7a7060] font-['JetBrains_Mono',monospace]">{target.email}</p>
          {target.role && <RoleBadge role={target.role}/>}
        </div>

        {/* Warning */}
        <div className="px-3.5 py-2.5 bg-[rgba(224,82,82,0.12)] border border-[rgba(224,82,82,0.15)] rounded-lg mb-4.5">
          <p className="m-0 text-xs text-[#f09090] leading-[1.65] font-['DM_Sans',sans-serif]">
            This action is <strong className="text-[#e05252]">permanent</strong>. The user will be removed from all teams and will no longer be able to log in.
          </p>
        </div>

        {err && (
          <div className="px-3.25 py-2.25 bg-[rgba(224,82,82,0.12)] rounded-lg text-[#e05252] text-xs mb-3.5">
            {err}
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.75 rounded-lg cursor-pointer bg-transparent border border-[#2e2c22] text-[#7a7060] text-[11px] tracking-widest font-['Cinzel',serif] uppercase transition-all duration-150 hover:border-[rgba(201,164,42,0.20)] hover:text-[#c9a42a]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handle}
            disabled={busy}
            className="flex-2 py-2.75 rounded-lg bg-[rgba(224,82,82,0.12)] border border-[rgba(224,82,82,0.33)] text-[#e05252] text-[11px] font-bold tracking-[0.12em] font-['Cinzel',serif] uppercase transition-all duration-150 hover:bg-[rgba(220,82,82,0.2)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {busy ? "Deleting…" : "Confirm Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}