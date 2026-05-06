/**
 * UpdateModal — PPC / Manager campaign edit + cancel modal.
 * Nature-inspired light theme.
 */
import { useState, useEffect } from "react";
import { toLocalISO, localToUTC } from "../../utils/formatters.js";
import Field from "../common/Field.jsx";

export default function UpdateModal({ campaign, onClose, onSave }) {
  const [status, setStatus] = useState("transfer");
  const [message, setMessage] = useState(campaign?.message || "");
  const [requestedAt, setRequestedAt] = useState(
    toLocalISO(campaign?.requestedAt) || toLocalISO(new Date()),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  if (!campaign) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    if (status === "transfer" && !message.trim()) { setErr("Message is required."); return; }
    setErr("");
    setBusy(true);
    try {
      await onSave(campaign._id, {
        message: status === "transfer" ? message.trim() : campaign.message,
        status,
        requestedAt: status === "transfer" ? localToUTC(requestedAt) : undefined,
      });
      onClose();
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Update failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "ops-focus w-full box-border bg-[#faf8f5] border border-[#e8e5de] rounded-lg text-[#2d2a24] text-[13px] px-[14px] py-[11px] outline-none font-['DM_Sans',sans-serif] transition-[border-color,box-shadow] duration-200";

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-9000 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white border border-[#e8e5de] rounded-[14px] p-[28px_28px_24px] w-full max-w-117 shadow-[0_12px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.06)] animate-[opsIn_0.24s_cubic-bezier(0.22,1,0.36,1)]">

        {/* Header */}
        <div className="flex justify-between items-start mb-5.5">
          <div>
            <p className="m-0 mb-1.5 text-[8px] tracking-[0.22em] text-[rgba(42,96,72,0.6)] font-['Fraunces',serif] uppercase">
              Update Campaign
            </p>
            <h3 className="m-0 text-[18px] font-semibold text-[#1a1810] font-['Fraunces',serif] tracking-[0.02em]">
              Edit Request
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7.5 h-7.5 rounded-[7px] bg-transparent border border-[#e8e5de] text-[#8a8475] cursor-pointer flex items-center justify-center transition-all duration-150 shrink-0 hover:border-[#b83030] hover:text-[#b83030] hover:bg-[rgba(184,48,48,0.06)]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Current message preview */}
        <div className="px-3.5 py-2.5 bg-[#f8f7f4] border border-[#e8e5de] rounded-lg mb-5">
          <p className="m-0 mb-1 text-[8px] tracking-[0.14em] text-[#8a8475] font-['Fraunces',serif] uppercase">
            Current Message
          </p>
          <p className="m-0 text-xs text-[#2d2a24] leading-relaxed">{campaign.message}</p>
        </div>

        {/* Approved warning */}
        {campaign.action === "approve" && (
          <div className="px-3.5 py-2.5 bg-[rgba(143,66,12,0.06)] border border-[rgba(143,66,12,0.15)] rounded-lg mb-4">
            <p className="m-0 text-xs text-[#8f420c] leading-[1.65] font-['DM_Sans',sans-serif]">
              ⚠ This campaign was approved by the PM. Editing it will{" "}
              <strong>reset the PM approval</strong> — the PM will need to review and approve again.
            </p>
          </div>
        )}

        {err && (
          <div className="px-3.5 py-2.5 bg-[rgba(184,48,48,0.06)] border border-[rgba(184,48,48,0.15)] rounded-lg text-[#b83030] text-xs mb-4 leading-relaxed">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Action toggle */}
          <Field label="Action">
            <div className="flex gap-2.5">
              {[
                { val: "transfer", label: "Edit",   desc: "Update & keep active",  color: "#2a6048", bg: "rgba(42,96,72,0.08)" },
                { val: "cancel",   label: "Cancel",  desc: "Cancel this campaign",  color: "#b83030", bg: "rgba(184,48,48,0.06)"  },
              ].map(({ val, label, desc, color, bg }) => {
                const isActive = status === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStatus(val)}
                    className="flex-1 px-2.5 py-3 rounded-lg cursor-pointer transition-all duration-150"
                    style={{
                      background:  isActive ? bg    : "#f8f7f4",
                      border:      `1px solid ${isActive ? color : "#e8e5de"}`,
                      color:       isActive ? color : "#8a8475",
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = "rgba(42,96,72,0.2)"; e.currentTarget.style.color = "#2a6048"; }}}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = "#e8e5de"; e.currentTarget.style.color = "#8a8475"; }}}
                  >
                    <div className="text-[10px] font-bold tracking-[0.12em] font-['Fraunces',serif] uppercase mb-0.75">{label}</div>
                    <div className="text-[10px] opacity-65 font-['DM_Sans',sans-serif]">{desc}</div>
                  </button>
                );
              })}
            </div>
          </Field>

          {status === "transfer" && (
            <>
              <Field label="Message" hint="required">
                <textarea
                  className={`${inputCls} resize-y leading-relaxed`}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe the task request…"
                  rows={3}
                  required
                />
              </Field>
              <Field label="Requested Date / Time" hint="optional">
                <input
                  type="datetime-local"
                  className={inputCls}
                  style={{ colorScheme: "light" }}
                  value={requestedAt}
                  onChange={e => setRequestedAt(e.target.value)}
                />
              </Field>
            </>
          )}

          {status === "cancel" && (
            <div className="px-3.5 py-3 bg-[rgba(184,48,48,0.06)] border border-[rgba(184,48,48,0.12)] rounded-lg mb-4.5">
              <p className="m-0 text-xs text-[#c85050] leading-[1.65] font-['DM_Sans',sans-serif]">
                ⚠ This will permanently <strong className="text-[#b83030]">cancel</strong> this campaign. This action cannot be undone.
              </p>
            </div>
          )}

          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.75 rounded-lg cursor-pointer bg-transparent border border-[#e8e5de] text-[#8a8475] text-[11px] tracking-widest font-['Fraunces',serif] uppercase transition-all duration-150 hover:border-[rgba(42,96,72,0.2)] hover:text-[#2a6048]"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-2 py-2.75 rounded-lg text-[11px] font-bold tracking-[0.12em] font-['Fraunces',serif] uppercase transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: status === "cancel" ? "rgba(184,48,48,0.08)" : "linear-gradient(135deg, #2a6048, #347a5a)",
                border:     `1px solid ${status === "cancel" ? "rgba(184,48,48,0.25)" : "#2a6048"}`,
                color:      status === "cancel" ? "#b83030" : "#ffffff",
                boxShadow:  status !== "cancel" ? "0 2px 10px rgba(42,96,72,0.18)" : "none",
              }}
            >
              {busy ? "Saving…" : status === "cancel" ? "Confirm Cancel" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}