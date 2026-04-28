/**
 * UpdateModal — PPC / Manager campaign edit + cancel modal.
 *
 * TIMEZONE FIX:
 * requestedAt from the datetime-local input is local time. We convert to UTC
 * ISO via localToUTC() before sending to the server.
 *
 * RESET BEHAVIOUR (requirement):
 * When a PPC/Manager edits an approved campaign (before its scheduleAt), the
 * backend resets scheduleAt, pmMessage and action automatically. The frontend
 * just sends the normal update; the server handles the reset.
 */
import { useState, useEffect } from "react";
import { T, inputSx } from "../../constants/theme.js";
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
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  if (!campaign) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "transfer" && !message.trim()) {
      setErr("Message is required.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      await onSave(campaign._id, {
        message: status === "transfer" ? message.trim() : campaign.message,
        status,
        /**
         * FIX: Convert datetime-local → UTC ISO before sending.
         * localToUTC("2024-01-15T14:30") in IST browser → "2024-01-15T09:00:00.000Z"
         */
        requestedAt:
          status === "transfer" ? localToUTC(requestedAt) : undefined,
      });
      onClose();
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Update failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        background: "rgba(0,0,0,0.75)",
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
          maxWidth: 468,
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
            marginBottom: 22,
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 8,
                letterSpacing: "0.22em",
                color: "rgba(200,168,74,0.6)",
                fontFamily: "'Cinzel', serif",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Update Campaign
            </p>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: T.white,
                fontFamily: "'Cinzel', serif",
                letterSpacing: "0.02em",
              }}
            >
              Edit Request
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

        {/* Current message preview */}
        <div
          style={{
            padding: "10px 14px",
            background: T.bgInput,
            border: `1px solid ${T.subtle}`,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 8,
              letterSpacing: "0.14em",
              color: T.muted,
              fontFamily: "'Cinzel',serif",
              textTransform: "uppercase",
            }}
          >
            Current Message
          </p>
          <p style={{ margin: 0, fontSize: 12, color: T.text, lineHeight: 1.6 }}>
            {campaign.message}
          </p>
        </div>

        {/* Approved-but-not-yet-scheduled notice */}
        {campaign.action === "approve" && (
          <div
            style={{
              padding: "10px 14px",
              background: T.amberBg,
              border: `1px solid ${T.amber}44`,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: T.amber,
                lineHeight: 1.65,
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              ⚠ This campaign was approved by the PM. Editing it will{" "}
              <strong>reset the PM approval</strong> — the PM will need to
              review and approve again.
            </p>
          </div>
        )}

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
              lineHeight: 1.5,
            }}
          >
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Action toggle */}
          <Field label="Action">
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { val: "transfer", label: "Edit", desc: "Update & keep active" },
                { val: "cancel", label: "Cancel", desc: "Cancel this campaign" },
              ].map(({ val, label, desc }) => {
                const isActive = status === val;
                const isCancel = val === "cancel";
                const activeColor = isCancel ? T.red : T.gold;
                const activeBg = isCancel ? T.redBg : T.goldDim;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStatus(val)}
                    style={{
                      flex: 1,
                      padding: "12px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      background: isActive ? activeBg : T.bgInput,
                      border: `1px solid ${isActive ? activeColor : T.subtle}`,
                      color: isActive ? activeColor : T.muted,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = T.goldBorder;
                        e.currentTarget.style.color = T.gold;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
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

          {status === "transfer" && (
            <>
              <Field label="Message" hint="required">
                <textarea
                  className="ops-focus"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the task request…"
                  rows={3}
                  required
                  style={{
                    ...inputSx,
                    borderRadius: 8,
                    resize: "vertical",
                    lineHeight: 1.6,
                  }}
                />
              </Field>
              <Field label="Requested Date / Time" hint="optional">
                <input
                  type="datetime-local"
                  className="ops-focus"
                  value={requestedAt}
                  onChange={(e) => setRequestedAt(e.target.value)}
                  style={{ ...inputSx, borderRadius: 8, colorScheme: "dark" }}
                />
              </Field>
            </>
          )}

          {status === "cancel" && (
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
                <strong style={{ color: T.red }}>cancel</strong> this campaign.
                This action cannot be undone.
              </p>
            </div>
          )}

          {/* Footer buttons */}
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
                  status === "cancel"
                    ? T.redBg
                    : `linear-gradient(135deg, ${T.gold}, #d4b44e)`,
                border: `1px solid ${status === "cancel" ? `${T.red}55` : T.gold}`,
                color: status === "cancel" ? T.red : "#0c0906",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                fontFamily: "'Cinzel',serif",
                textTransform: "uppercase",
                transition: "all 0.15s ease",
                boxShadow:
                  status !== "cancel"
                    ? "0 2px 10px rgba(200,168,74,0.18)"
                    : "none",
              }}
            >
              {busy
                ? "Saving…"
                : status === "cancel"
                  ? "Confirm Cancel"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}