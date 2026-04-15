/**
 * AckModal — IT acknowledges a campaign as Done or Not Done.
 * Extracted from ITDashboard where it was defined inline.
 *
 * @prop {object}   campaign  - the campaign being acknowledged
 * @prop {Function} onClose
 * @prop {Function} onConfirm - called with { acknowledgement, itMessage }
 * @prop {boolean}  loading
 */
import { useState } from "react";

/* IT Dashboard uses its own CSS variable theme, not the OPS SUITE token system.
   These values mirror the --accent / --warn variables from STYLES in ITDashboard. */
const C = {
  surface:  "#ffffff",
  border:   "#e6e3dc",
  border2:  "#d0ccc3",
  text:     "#1a1915",
  muted:    "#8c8880",
  accent:   "#2d6a4f",
  accentLt: "#e8f4f0",
  warn:     "#9b4a1b",
  warnLt:   "#fdf0e8",
  bg2:      "#f9f8f5",
  input:    "#ffffff",
};

export default function AckModal({ campaign, onClose, onConfirm, loading }) {
  const [choice,  setChoice]  = useState(null);      // "done" | "not done"
  const [message, setMessage] = useState("done");

  const canConfirm =
    choice &&
    (choice === "done" || (choice === "not done" && message.trim().length > 3));

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Acknowledge Campaign</div>
            <div className="modal-subtitle">
              {campaign.message?.slice(0, 60)}{campaign.message?.length > 60 ? "…" : ""}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Message textarea */}
          <div className="field-group">
            <label className="field-label">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={
                choice === "not done"
                  ? "Describe why this campaign could not be executed…"
                  : "done"
              }
              rows={3}
            />
            {choice === "not done" && message.trim().length < 4 && (
              <span style={{ fontSize: 11, color: "var(--warn)" }}>
                Please add a reason (min 4 chars)
              </span>
            )}
          </div>

          {/* Outcome toggle */}
          <div className="field-group">
            <label className="field-label">Outcome</label>
            <div className="toggle-row">
              <button
                className={`toggle-btn ${choice === "done" ? "selected-done" : ""}`}
                onClick={() => { setChoice("done"); setMessage("done"); }}
              >
                ✓ Done
              </button>
              <button
                className={`toggle-btn ${choice === "not done" ? "selected-notdone" : ""}`}
                onClick={() => { setChoice("not done"); setMessage(""); }}
              >
                ✗ Not Done
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Discard
          </button>
          <button
            className="btn btn-confirm"
            disabled={!canConfirm || loading}
            onClick={() => onConfirm({ acknowledgement: choice, itMessage: message })}
          >
            {loading ? "Saving…" : "Confirm →"}
          </button>
        </div>
      </div>
    </div>
  );
}
