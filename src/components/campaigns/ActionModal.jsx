/**
 * ActionModal — PM approves or cancels a campaign.
 *
 * TIMEZONE FIX:
 * scheduleAt from a datetime-local input is in local time (IST for Indian users).
 * We convert to UTC ISO via new Date(value).toISOString() before sending to
 * the server so the Node.js backend receives an unambiguous timestamp.
 */
import { useState, useEffect } from "react";
import { T, inputSx } from "../../constants/theme.js";
import Field from "../common/Field.jsx";
import { fmt, toLocalISO, localToUTC } from "../../utils/formatters.js";

export default function ActionModal({ campaign, onClose, onSave }) {
  const [action, setAction] = useState("approve");
  const [pmMessage, setPmMessage] = useState("");

  /**
   * FIX: Default scheduleAt to requestedAt (not current time and not an
   * existing scheduleAt — since scheduleAt is now empty on creation).
   * This satisfies requirement: "default to current requested time unless
   * the PM manually changes it".
   */
  const [scheduleAt, setScheduleAt] = useState(
    toLocalISO(campaign?.requestedAt) || toLocalISO(new Date()),
  );

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
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
        /**
         * FIX: Convert datetime-local value → UTC ISO string before sending.
         * localToUTC("2024-01-15T14:30") in IST browser → "2024-01-15T09:00:00.000Z"
         * Node.js server then correctly computes delay from this UTC epoch.
         */
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
    {
      val: "approve",
      label: "Approve",
      desc: "Forward to IT queue",
      color: T.teal,
      bg: T.tealBg,
    },
    {
      val: "cancel",
      label: "Reject",
      desc: "Reject this campaign",
      color: T.red,
      bg: T.redBg,
    },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: `linear-gradient(160deg, ${T.bgCard}, ${T.bg})`,
          border: `1px solid ${T.subtle}`,
          borderRadius: 14,
          padding: "28px 28px 24px",
          width: "100%",
          maxWidth: 510,
          boxShadow: `0 24px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)`,
          animation: "opsIn 0.24s cubic-bezier(.22,1,.36,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 8,
                letterSpacing: "0.22em",
                color: "rgba(200,168,74,0.6)",
                fontFamily: "'Cinzel',serif",
                textTransform: "uppercase",
              }}
            >
              PM Review
            </p>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: T.white,
                fontFamily: "'Cinzel',serif",
                letterSpacing: "0.02em",
              }}
            >
              Campaign Decision
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "transparent",
              border: `1px solid ${T.subtle}`,
              color: T.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.red;
              e.currentTarget.style.color = T.red;
              e.currentTarget.style.background = T.redBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.subtle;
              e.currentTarget.style.color = T.muted;
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Campaign preview */}
        <div
          style={{
            padding: "12px 16px",
            background: T.bgInput,
            border: `1px solid ${T.subtle}`,
            borderRadius: 8,
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px 20px",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 8,
                letterSpacing: "0.12em",
                color: T.muted,
                fontFamily: "'Cinzel',serif",
                textTransform: "uppercase",
              }}
            >
              Message
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: T.text,
                lineHeight: 1.55,
                wordBreak: "break-word",
              }}
            >
              {campaign.message}
            </p>
          </div>
          <div>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 8,
                letterSpacing: "0.12em",
                color: T.muted,
                fontFamily: "'Cinzel',serif",
                textTransform: "uppercase",
              }}
            >
              Submitted
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: T.muted,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {fmt(campaign.createdAt)}
            </p>
          </div>
        </div>

        {err && (
          <div
            style={{
              padding: "10px 14px",
              background: T.redBg,
              border: `1px solid ${T.red}44`,
              borderRadius: 8,
              color: T.red,
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Decision">
            <div style={{ display: "flex", gap: 10 }}>
              {ACTIONS.map(({ val, label, desc, color, bg }) => {
                const active = action === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAction(val)}
                    style={{
                      flex: 1,
                      padding: "12px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: active ? bg : T.bgInput,
                      border: `1px solid ${active ? color : T.subtle}`,
                      color: active ? color : T.muted,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.borderColor = `${color}66`;
                        e.currentTarget.style.color = color;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.borderColor = T.subtle;
                        e.currentTarget.style.color = T.muted;
                      }
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        fontFamily: "'Cinzel',serif",
                        textTransform: "uppercase",
                        marginBottom: 3,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        opacity: 0.65,
                        fontFamily: "'DM Sans',sans-serif",
                      }}
                    >
                      {desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="PM Message" hint="optional">
            <textarea
              className="ops-focus"
              value={pmMessage}
              onChange={(e) => setPmMessage(e.target.value)}
              placeholder={
                action === "approve"
                  ? "Add a note for IT (optional)…"
                  : "Reason for rejection (optional)…"
              }
              rows={3}
              style={{ ...inputSx, borderRadius: 8, resize: "vertical", lineHeight: 1.6 }}
            />
          </Field>

          {action === "approve" && (
            <Field label="Schedule At" hint="defaults to requested time">
              <input
                type="datetime-local"
                className="ops-focus"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                style={{ ...inputSx, borderRadius: 8, colorScheme: "dark" }}
              />
            </Field>
          )}

          {action === "cancel" && (
            <div
              style={{
                padding: "12px 14px",
                background: T.redBg,
                border: `1px solid ${T.red}30`,
                borderRadius: 8,
                marginBottom: 18,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#f09090",
                  lineHeight: 1.65,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                ⚠ This will permanently{" "}
                <strong style={{ color: T.red }}>cancel</strong> the campaign.
                The creator will be notified.
              </p>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: 8,
                cursor: "pointer",
                background: "transparent",
                border: `1px solid ${T.subtle}`,
                color: T.muted,
                fontSize: 11,
                letterSpacing: "0.1em",
                fontFamily: "'Cinzel',serif",
                textTransform: "uppercase",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.goldBorder;
                e.currentTarget.style.color = T.gold;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.subtle;
                e.currentTarget.style.color = T.muted;
              }}
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                flex: 2,
                padding: "11px",
                borderRadius: 8,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
                background:
                  action === "cancel"
                    ? T.redBg
                    : `linear-gradient(135deg, ${T.gold}, #d4b44e)`,
                border: `1px solid ${action === "cancel" ? `${T.red}55` : T.gold}`,
                color: action === "cancel" ? T.red : "#0c0906",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                fontFamily: "'Cinzel',serif",
                textTransform: "uppercase",
                transition: "all 0.15s ease",
                boxShadow:
                  action !== "cancel"
                    ? "0 2px 10px rgba(200,168,74,0.18)"
                    : "none",
              }}
            >
              {busy
                ? "Saving…"
                : action === "cancel"
                  ? "Confirm Reject"
                  : "Confirm Approve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}