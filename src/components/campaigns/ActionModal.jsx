/**
 * ActionModal — PM approves or cancels a campaign.
 * Extracted from PMDashboard where it was defined inline (~120 lines).
 *
 * FIX: Initial scheduleAt now defaults to campaign's requestedAt instead of
 * current time. PM can still change it manually before confirming.
 */
import { useState, useEffect } from "react";
import { T, inputSx } from "../../constants/theme.js";
import Field from "../common/Field.jsx";
import { fmt, toLocalISO } from "../../utils/formatters.js";

export default function ActionModal({ campaign, onClose, onSave }) {
  const [action,     setAction]     = useState("approve");
  const [pmMessage,  setPmMessage]  = useState("");
  // FIX: default scheduleAt to campaign's requestedAt; falls back to now if absent
  const [scheduleAt, setScheduleAt] = useState(
    toLocalISO(campaign?.requestedAt) || toLocalISO(new Date())
  );
  const [busy,       setBusy]       = useState(false);
  const [err,        setErr]        = useState("");

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  if (!campaign) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await onSave(campaign._id, {
        action,
        pmMessage:  pmMessage.trim() || undefined,
        scheduleAt: action === "approve" ? (scheduleAt || new Date().toISOString()) : undefined,
      });
      onClose();
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Action failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const ACTIONS = [
    { val: "approve", label: "APPROVE", desc: "Forward to IT queue", color: T.teal, bg: T.tealBg },
    { val: "cancel",  label: "CANCEL",  desc: "Reject this campaign", color: T.red,  bg: T.redBg  },
  ];

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
        background: T.bgCard, border: `1px solid ${T.goldBorder}`,
        borderRadius: 4, padding: "28px 26px 24px",
        width: "100%", maxWidth: 500,
        animation: "opsIn 0.22s cubic-bezier(.22,1,.36,1)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <p style={{ margin: 0, fontSize: 8, letterSpacing: "0.22em", color: T.gold, fontFamily: "'Cinzel', serif" }}>— PM ACTION</p>
            <h3 style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 600, color: T.white, fontFamily: "'Cinzel', serif" }}>
              Campaign Review
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: `1px solid ${T.subtle}`,
              color: T.muted, cursor: "pointer",
              width: 28, height: 28, borderRadius: 2, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.subtle; e.currentTarget.style.color = T.muted; }}
          >✕</button>
        </div>

        {/* Campaign preview */}
        <div style={{
          padding: "10px 14px", background: T.bgInput,
          border: `1px solid ${T.subtle}`, borderRadius: 3, marginBottom: 20,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: "0.12em", color: T.muted, fontFamily: "'Cinzel', serif", marginBottom: 4 }}>MESSAGE</p>
            <p style={{ margin: 0, fontSize: 12, color: T.text, lineHeight: 1.5, wordBreak: "break-word" }}>{campaign.message}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 9, letterSpacing: "0.12em", color: T.muted, fontFamily: "'Cinzel', serif", marginBottom: 4 }}>SUBMITTED</p>
            <p style={{ margin: 0, fontSize: 11, color: T.muted, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(campaign.createdAt)}</p>
          </div>
        </div>

        {err && (
          <div style={{
            padding: "9px 13px", background: T.redBg,
            border: `1px solid ${T.red}44`, borderRadius: 3, color: T.red,
            fontSize: 12, marginBottom: 16,
          }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="ACTION">
            <div style={{ display: "flex", gap: 10 }}>
              {ACTIONS.map(({ val, label, desc, color, bg }) => {
                const active = action === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAction(val)}
                    style={{
                      flex: 1, padding: "12px 10px", borderRadius: 3, cursor: "pointer",
                      background: active ? bg : T.bgInput,
                      border: `1px solid ${active ? color : T.subtle}`,
                      color: active ? color : T.muted,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = `${color}66`; e.currentTarget.style.color = color; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = T.subtle; e.currentTarget.style.color = T.muted; } }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", fontFamily: "'Cinzel', serif", marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, fontFamily: "'DM Sans', sans-serif" }}>{desc}</div>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="PM MESSAGE" hint="optional">
            <textarea
              className="ops-focus"
              value={pmMessage}
              onChange={e => setPmMessage(e.target.value)}
              placeholder={action === "approve" ? "Add a note for IT (optional)…" : "Reason for cancellation (optional)…"}
              rows={3}
              style={{ ...inputSx, resize: "vertical", lineHeight: 1.6 }}
            />
          </Field>

          {action === "approve" && (
            <Field label="SCHEDULE AT" hint="pre-filled from requested time — change if needed">
              <input
                type="datetime-local"
                className="ops-focus"
                value={scheduleAt}
                onChange={e => setScheduleAt(e.target.value)}
                style={{ ...inputSx, colorScheme: "dark" }}
              />
            </Field>
          )}

          {action === "cancel" && (
            <div style={{
              padding: "11px 14px", background: T.redBg,
              border: `1px solid ${T.red}33`, borderRadius: 3, marginBottom: 18,
            }}>
              <p style={{ margin: 0, fontSize: 12, color: "#f09090", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                ⚠ This will permanently <strong style={{ color: T.red }}>CANCEL</strong> the campaign.
                The PPC user will be notified and no further edits will be possible.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
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
              DISCARD
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                flex: 2, padding: "11px", borderRadius: 3,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
                background: action === "cancel" ? T.redBg : T.gold,
                border: `1px solid ${action === "cancel" ? `${T.red}66` : T.gold}`,
                color: action === "cancel" ? T.red : "#0c0b08",
                fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                fontFamily: "'Cinzel', serif", transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                if (!busy) e.currentTarget.style.background = action === "cancel" ? "rgba(224,82,82,0.22)" : T.goldLight;
              }}
              onMouseLeave={e => { e.currentTarget.style.background = action === "cancel" ? T.redBg : T.gold; }}
            >
              {busy ? "SAVING…" : action === "cancel" ? "CONFIRM CANCEL" : "CONFIRM APPROVE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}