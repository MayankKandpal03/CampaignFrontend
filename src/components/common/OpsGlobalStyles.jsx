/**
 * OpsGlobalStyles — premium animation system and shared utility classes.
 * Injects keyframes, refined hover states, and smooth interactions.
 *
 * UPDATED: Rewrote all colors for the nature-inspired light theme.
 * All input/focus/scrollbar/hover styles now use warm ivory + forest green palette.
 */
import { T } from "../../constants/theme.js";

export default function OpsGlobalStyles() {
  return (
    <style>{`
      /* ── Font rendering ─────────────────────────────────────────────────── */
      * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

      /* ── Global input text color fix ────────────────────────────────────── */
      input, textarea, select {
        color: ${T.text};
        background: ${T.bgInput};
      }
      input::placeholder,
      textarea::placeholder {
        color: ${T.muted};
        opacity: 1;
      }
      /* Light theme — use light color-scheme for date/time inputs */
      input[type="datetime-local"],
      input[type="time"],
      input[type="date"] {
        color-scheme: light;
      }

      /* ── Keyframes ──────────────────────────────────────────────────────── */
      @keyframes opsIn {
        from { opacity:0; transform:translateY(16px) scale(.975); }
        to   { opacity:1; transform:translateY(0)    scale(1); }
      }
      @keyframes opsFadeUp {
        from { opacity:0; transform:translateY(10px); }
        to   { opacity:1; transform:none; }
      }
      @keyframes opsFadeIn {
        from { opacity:0; }
        to   { opacity:1; }
      }
      @keyframes opsPulse {
        0%, 100% { opacity:.5; }
        50%       { opacity:1; }
      }
      @keyframes opsSlideIn {
        from { opacity:0; transform:translateX(-8px); }
        to   { opacity:1; transform:none; }
      }
      @keyframes opsSpinner {
        to { transform:rotate(360deg); }
      }
      @keyframes opsGlow {
        0%,100% { box-shadow: 0 0 0 0 rgba(42,96,72,0); }
        50%      { box-shadow: 0 0 12px 3px rgba(42,96,72,0.12); }
      }

      /* ── Focus states ───────────────────────────────────────────────────── */
      .ops-focus:focus {
        border-color: ${T.gold} !important;
        box-shadow: 0 0 0 3px ${T.goldDim}, 0 1px 2px rgba(0,0,0,0.06) !important;
        outline: none;
        background: ${T.bgInput} !important;
        color: ${T.text} !important;
      }
      button:focus-visible {
        outline: 2px solid ${T.gold};
        outline-offset: 3px;
        border-radius: 4px;
      }

      /* ── Table rows ─────────────────────────────────────────────────────── */
      .ops-row {
        cursor: default;
        transition: background 0.14s ease, box-shadow 0.14s ease;
        position: relative;
      }
      .ops-row:hover {
        background: rgba(42,96,72,0.04) !important;
        box-shadow: inset 3px 0 0 rgba(42,96,72,0.3) !important;
      }
      .ops-row:hover td:first-child { color: ${T.gold}; }

      /* ── Nav buttons ────────────────────────────────────────────────────── */
      .ops-nav-btn {
        transition: color 0.15s ease, background 0.15s ease !important;
      }
      .ops-nav-btn:hover {
        color:       ${T.gold}    !important;
        background:  ${T.goldDim} !important;
      }
      .ops-nav-btn:active { transform: scale(.97) !important; }

      /* ── Filter cards ───────────────────────────────────────────────────── */
      .ops-fcard {
        transition: transform 0.2s cubic-bezier(.22,1,.36,1), border-color 0.18s ease, box-shadow 0.2s ease;
        cursor: pointer;
      }
      .ops-fcard:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 28px rgba(0,0,0,0.08);
      }
      .ops-fcard:active { transform: translateY(-1px) scale(.99); }

      /* ── Update/action row buttons ──────────────────────────────────────── */
      .ops-upd { transition: all 0.15s ease !important; }
      .ops-upd:hover {
        background: rgba(143,66,12,.1) !important;
        border-color: ${T.amber} !important;
        transform: scale(1.04);
      }
      .ops-upd:active { transform: scale(.97) !important; }

      .ops-del { transition: all 0.15s ease !important; }
      .ops-del:hover {
        background: rgba(184,48,48,.08) !important;
        border-color: ${T.red}  !important;
        color: ${T.red}          !important;
      }

      /* ── Pending badge pulse ────────────────────────────────────────────── */
      .ops-pending { animation: opsPulse 2.6s ease-in-out infinite; }

      /* ── Scrollbar ──────────────────────────────────────────────────────── */
      ::-webkit-scrollbar         { width: 4px; height: 4px; }
      ::-webkit-scrollbar-thumb   {
        background:    rgba(42,96,72,0.15);
        border-radius: 99px;
        transition:    background 0.2s;
      }
      ::-webkit-scrollbar-thumb:hover { background: rgba(42,96,72,0.3); }
      ::-webkit-scrollbar-track  { background: transparent; }

      /* ── Select options ─────────────────────────────────────────────────── */
      select option { background: ${T.bgCard}; color: ${T.text}; }

      /* ── Smooth scrolling ───────────────────────────────────────────────── */
      html { scroll-behavior: smooth; }

      /* ── Modal overlay backdrop ─────────────────────────────────────────── */
      .ops-modal-overlay {
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
    `}</style>
  );
}