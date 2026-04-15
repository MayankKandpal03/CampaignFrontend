/**
 * UpdateModal — PPC / Manager campaign edit + cancel modal.
 *
 * EXTRACTED FROM: PPCDashboard and ManagerDashboard.
 * Both contained a near-identical ~130-line UpdateModal component defined locally.
 * The only difference was cosmetic label text ("EDIT" vs "TRANSFER") — now unified.
 *
 * Responsibilities:
 *  - Toggle between "transfer" (edit) and "cancel" actions
 *  - Validate required message field before submitting
 *  - Call onSave(campaignId, { message, status, requestedAt })
 *  - Close on Escape key or overlay click
 */
import { useState, useEffect } from "react";
import { T, inputSx } from "../../constants/theme.js";
import Field from "../common/Field.jsx";

export default function UpdateModal({ campaign, onClose, onSave }) {
  const [status,      setStatus]      = useState("transfer");
  const [message,     setMessage]     = useState(campaign?.message || "");
  const [requestedAt, setRequestedAt] = useState(
    campaign?.requestedAt?.slice?.(0, 16) || ""
  );
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");

  /* Close on Escape */
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  if (!campaign) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    if (status === "transfer" && !message.trim()) {
      setErr("Message is required.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      await onSave(campaign._id, {
        message:     status === "transfer" ? message.trim() : campaign.message,
        status,
        requestedAt: status === "transfer" ? (requestedAt || undefined) : undefined,
      });
      onClose();
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Update failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  /* ── Shared button base style ── */
  const closeBtn = {
    background: "transparent", border: `1px solid ${T.subtle}`,
    color: T.muted, cursor: "pointer",
    width: 28, height: 28, borderRadius: 2, fontSize: 13,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.80)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{
        background:   T.bgCard,
        border:       `1px solid ${T.goldBorder}`,
        borderRadius: 4,
        padding:      "28px 26px 24px",
        width:        "100%",
        maxWidth:     460,
        animation:    "opsIn 0.22s cubic-bezier(.22,1,.36,1)",
      }}>

        {/* ── Header ── */}
        <div style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "flex-start",
          marginBottom:   20,
        }}>
          <div>
            <p style={{
              margin: 0, fontSize: 8, letterSpacing: "0.22em",
              color: T.gold, fontFamily: "'Cinzel', serif",
            }}>
              — UPDATE CAMPAIGN
            </p>
            <h3 style={{
              margin: "4px 0 0", fontSize: 17, fontWeight: 600,
              color: T.white, fontFamily: "'Cinzel', serif",
            }}>
              Edit Request
            </h3>
          </div>
          <button
            onClick={onClose}
            style={closeBtn}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = T.red;
              e.currentTarget.style.color       = T.red;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = T.subtle;
              e.currentTarget.style.color       = T.muted;
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Current message preview ── */}
        <div style={{
          padding:      "9px 12px",
          background:   T.bgInput,
          border:       `1px solid ${T.subtle}`,
          borderRadius: 3,
          marginBottom: 20,
        }}>
          <p style={{
            margin: 0, fontSize: 9, letterSpacing: "0.12em",
            color: T.muted, fontFamily: "'Cinzel', serif", marginBottom: 4,
          }}>
            CURRENT MESSAGE
          </p>
          <p style={{ margin: 0, fontSize: 12, color: T.text, lineHeight: 1.5 }}>
            {campaign.message}
          </p>
        </div>

        {/* ── Error banner ── */}
        {err && (
          <div style={{
            padding:      "9px 13px",
            background:   T.redBg,
            border:       `1px solid ${T.red}44`,
            borderRadius: 3,
            color:        T.red,
            fontSize:     12,
            marginBottom: 16,
          }}>
            {err}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>

          {/* Action toggle */}
          <Field label="ACTION">
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { val: "transfer", label: "EDIT",   desc: "Update & keep active"  },
                { val: "cancel",   label: "CANCEL",  desc: "Cancel this campaign" },
              ].map(({ val, label, desc }) => {
                const isActive = status === val;
                const isCancel = val === "cancel";
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStatus(val)}
                    style={{
                      flex:       1,
                      padding:    "11px 10px",
                      borderRadius: 3,
                      cursor:     "pointer",
                      background: isActive
                        ? (isCancel ? T.redBg    : T.goldDim)
                        : T.bgInput,
                      border: `1px solid ${
                        isActive ? (isCancel ? T.red : T.gold) : T.subtle
                      }`,
                      color: isActive
                        ? (isCancel ? T.red : T.gold)
                        : T.muted,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = T.goldBorder;
                        e.currentTarget.style.color       = T.gold;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = T.subtle;
                        e.currentTarget.style.color       = T.muted;
                      }
                    }}
                  >
                    <div style={{
                      fontSize:      10,
                      fontWeight:    700,
                      letterSpacing: "0.12em",
                      fontFamily:    "'Cinzel', serif",
                      marginBottom:  3,
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontSize:   10,
                      opacity:    0.7,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Edit fields */}
          {status === "transfer" && (
            <>
              <Field label="MESSAGE" hint="required">
                <textarea
                  className="ops-focus"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe the campaign request…"
                  rows={3}
                  required
                  style={{ ...inputSx, resize: "vertical", lineHeight: 1.6 }}
                />
              </Field>

              <Field label="REQUESTED DATE / TIME" hint="optional">
                <input
                  type="datetime-local"
                  className="ops-focus"
                  value={requestedAt}
                  onChange={e => setRequestedAt(e.target.value)}
                  style={{ ...inputSx, colorScheme: "dark" }}
                />
              </Field>
            </>
          )}

          {/* Cancel warning */}
          {status === "cancel" && (
            <div style={{
              padding:      "11px 14px",
              background:   T.redBg,
              border:       `1px solid ${T.red}33`,
              borderRadius: 3,
              marginBottom: 18,
            }}>
              <p style={{
                margin:     0,
                fontSize:   12,
                color:      "#f09090",
                lineHeight: 1.6,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                ⚠ This will permanently{" "}
                <strong style={{ color: T.red }}>CANCEL</strong> this campaign.
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
                flex:          1,
                padding:       "11px",
                borderRadius:  3,
                cursor:        "pointer",
                background:    "transparent",
                border:        `1px solid ${T.subtle}`,
                color:         T.muted,
                fontSize:      11,
                letterSpacing: "0.1em",
                fontFamily:    "'Cinzel', serif",
                transition:    "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = T.goldBorder;
                e.currentTarget.style.color       = T.gold;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.subtle;
                e.currentTarget.style.color       = T.muted;
              }}
            >
              DISCARD
            </button>

            <button
              type="submit"
              disabled={busy}
              style={{
                flex:          2,
                padding:       "11px",
                borderRadius:  3,
                cursor:        busy ? "not-allowed" : "pointer",
                opacity:       busy ? 0.6 : 1,
                background:    status === "cancel" ? T.redBg  : T.gold,
                border:        `1px solid ${status === "cancel" ? `${T.red}66` : T.gold}`,
                color:         status === "cancel" ? T.red    : "#0c0b08",
                fontSize:      11,
                fontWeight:    700,
                letterSpacing: "0.14em",
                fontFamily:    "'Cinzel', serif",
                transition:    "all 0.15s",
              }}
              onMouseEnter={e => {
                if (!busy) {
                  e.currentTarget.style.background = status === "cancel"
                    ? "rgba(224,82,82,0.22)"
                    : T.goldLight;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = status === "cancel" ? T.redBg : T.gold;
              }}
            >
              {busy
                ? "SAVING…"
                : status === "cancel"
                ? "CONFIRM CANCEL"
                : "SAVE CHANGES"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
