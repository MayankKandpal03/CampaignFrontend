/**
 * ActionModal — PM approves or cancels a campaign.
 * Refactored to nature-inspired light theme.
 * TIMEZONE FIX preserved: convert local datetime to UTC before sending.
 */
import { useState, useEffect } from "react";
import Field from "../common/Field.jsx";
import { fmt, toLocalISO, localToUTC } from "../../utils/formatters.js";

const INPUT_CX =
  "w-full bg-[#faf8f5] border border-[#e8e5de] text-[#2d2a24] text-[13px] px-[14px] py-[11px] outline-none font-['DM_Sans',sans-serif] transition-[border-color,box-shadow] duration-200";

export default function ActionModal({ campaign, onClose, onSave }) {
  const [action, setAction] = useState("approve");
  const [pmMessage, setPmMessage] = useState("");
  const [scheduleAt, setScheduleAt] = useState(
    toLocalISO(campaign?.requestedAt) || toLocalISO(new Date()),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  if (!campaign) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await onSave(campaign._id, {
        action,
        pmMessage: pmMessage.trim() || undefined,
        scheduleAt:
          action === "approve"
            ? localToUTC(scheduleAt) || new Date().toISOString()
            : undefined,
      });
      onClose();
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const ACTIONS = [
    { val: "approve", label: "Approve", desc: "Forward to IT queue",  color: "#2a6048", bg: "rgba(42,96,72,0.08)"  },
    { val: "cancel",  label: "Reject",  desc: "Reject this campaign", color: "#b83030", bg: "rgba(184,48,48,0.08)"  },
  ];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-9000 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white border border-[#e8e5de] rounded-[14px] px-7 pt-7 pb-6 w-full max-w-127.5 shadow-[0_12px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.06)] animate-[opsIn_0.24s_cubic-bezier(.22,1,.36,1)]">

        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="m-0 mb-1.5 text-[8px] tracking-[0.22em] text-[rgba(42,96,72,0.6)] font-['Fraunces',serif] uppercase">
              PM Review
            </p>
            <h3 className="m-0 text-[18px] font-semibold text-[#1a1810] font-['Fraunces',serif] tracking-[0.02em]">
              Campaign Decision
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7.5 h-7.5 rounded-[7px] bg-transparent border border-[#e8e5de] text-[#8a8475] cursor-pointer flex items-center justify-center transition-all duration-150 shrink-0 hover:border-[#b83030] hover:text-[#b83030] hover:bg-[rgba(184,48,48,0.06)]"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Campaign preview */}
        <div className="px-4 py-3 bg-[#f8f7f4] border border-[#e8e5de] rounded-lg mb-5 grid grid-cols-2 gap-x-5 gap-y-2.5">
          <div>
            <p className="m-0 mb-1 text-[8px] tracking-[0.12em] text-[#8a8475] font-['Fraunces',serif] uppercase">Message</p>
            <p className="m-0 text-[12px] text-[#2d2a24] leading-[1.55] wrap-break-word">{campaign.message}</p>
          </div>
          <div>
            <p className="m-0 mb-1 text-[8px] tracking-[0.12em] text-[#8a8475] font-['Fraunces',serif] uppercase">Submitted</p>
            <p className="m-0 text-[11px] text-[#8a8475] font-['JetBrains_Mono',monospace]">{fmt(campaign.createdAt)}</p>
          </div>
        </div>

        {err && (
          <div className="px-3.5 py-2.5 bg-[rgba(184,48,48,0.06)] border border-[rgba(184,48,48,0.15)] rounded-lg text-[#b83030] text-[12px] mb-4">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Decision">
            <div className="flex gap-2.5">
              {ACTIONS.map(({ val, label, desc, color, bg }) => {
                const active = action === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAction(val)}
                    className="flex-1 py-3 px-2.5 rounded-lg cursor-pointer transition-all duration-150"
                    style={{
                      background: active ? bg : "#f8f7f4",
                      border: `1px solid ${active ? color : "#e8e5de"}`,
                      color: active ? color : "#8a8475",
                    }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = `${color}66`; e.currentTarget.style.color = color; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "#e8e5de"; e.currentTarget.style.color = "#8a8475"; } }}
                  >
                    <div className="text-[10px] font-bold tracking-[0.12em] font-['Fraunces',serif] uppercase mb-0.75">{label}</div>
                    <div className="text-[10px] opacity-65 font-['DM_Sans',sans-serif]">{desc}</div>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="PM Message" hint="optional">
            <textarea
              className={`ops-focus ${INPUT_CX} rounded-lg resize-y leading-[1.6]`}
              value={pmMessage}
              onChange={(e) => setPmMessage(e.target.value)}
              placeholder={action === "approve" ? "Add a note for IT (optional)…" : "Reason for rejection (optional)…"}
              rows={3}
            />
          </Field>

          {action === "approve" && (
            <Field label="Schedule At" hint="defaults to requested time">
              <input
                type="datetime-local"
                className={`ops-focus ${INPUT_CX} rounded-lg`}
                style={{ colorScheme: "light" }}
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
              />
            </Field>
          )}

          {action === "cancel" && (
            <div className="px-3.5 py-3 bg-[rgba(184,48,48,0.06)] border border-[rgba(184,48,48,0.12)] rounded-lg mb-4.5">
              <p className="m-0 text-[12px] text-[#c85050] leading-[1.65] font-['DM_Sans',sans-serif]">
                ⚠ This will permanently <strong className="text-[#b83030]">cancel</strong> the campaign. The creator will be notified.
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
              className="flex-2 py-2.75 rounded-lg text-[11px] font-bold tracking-[0.12em] font-['Fraunces',serif] uppercase transition-all duration-150"
              style={{
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
                background: action === "cancel" ? "rgba(184,48,48,0.08)" : "linear-gradient(135deg,#2a6048,#347a5a)",
                border: `1px solid ${action === "cancel" ? "rgba(184,48,48,0.25)" : "#2a6048"}`,
                color: action === "cancel" ? "#b83030" : "#ffffff",
                boxShadow: action !== "cancel" ? "0 2px 10px rgba(42,96,72,0.18)" : "none",
              }}
            >
              {busy ? "Saving…" : action === "cancel" ? "Confirm Reject" : "Confirm Approve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}