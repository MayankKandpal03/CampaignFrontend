/**
 * OpsGlobalStyles — premium animation system and shared utility classes.
 * Injects keyframes, refined hover states, and smooth interactions.
 *
 * BUG FIX: Added global `input, textarea, select` color rules.
 * When components were converted from `inputSx` (which included `color: T.text`)
 * to Tailwind classes, some forgot `text-[#e8ddc8]`. The browser default is
 * black text, making inputs invisible on dark backgrounds.
 */
import { T } from "../../constants/theme.js";

export default function OpsGlobalStyles() {
  return (
    <style>{`
      /* ── Font rendering ─────────────────────────────────────────────────── */
      * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

      /* ── Global input text color fix ────────────────────────────────────── */
      /* Prevents black text on dark backgrounds after Tailwind conversion     */
      input, textarea, select {
        color: ${T.text};
        background: ${T.bgInput};
      }
      input::placeholder,
      textarea::placeholder {
        color: ${T.muted};
        opacity: 1;
      }
      /* datetime-local and time inputs need explicit dark color-scheme */
      input[type="datetime-local"],
      input[type="time"],
      input[type="date"] {
        color-scheme: dark;
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
        0%,100% { box-shadow: 0 0 0 0 rgba(200,168,74,0); }
        50%      { box-shadow: 0 0 12px 3px rgba(200,168,74,0.15); }
      }

      /* ── Focus states ───────────────────────────────────────────────────── */
      .ops-focus:focus {
        border-color: ${T.gold} !important;
        box-shadow: 0 0 0 3px ${T.goldDim}, 0 1px 2px rgba(0,0,0,0.3) !important;
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
        background: rgba(200,168,74,0.03) !important;
        box-shadow: inset 3px 0 0 rgba(200,168,74,0.4) !important;
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
        box-shadow: 0 8px 28px rgba(0,0,0,0.45);
      }
      .ops-fcard:active { transform: translateY(-1px) scale(.99); }

      /* ── Update/action row buttons ──────────────────────────────────────── */
      .ops-upd { transition: all 0.15s ease !important; }
      .ops-upd:hover {
        background: rgba(240,160,36,.18) !important;
        border-color: ${T.amber} !important;
        transform: scale(1.04);
      }
      .ops-upd:active { transform: scale(.97) !important; }

      .ops-del { transition: all 0.15s ease !important; }
      .ops-del:hover {
        background: rgba(220,82,82,.18) !important;
        border-color: ${T.red}  !important;
        color: ${T.red}          !important;
      }

      /* ── Pending badge pulse ────────────────────────────────────────────── */
      .ops-pending { animation: opsPulse 2.6s ease-in-out infinite; }

      /* ── Scrollbar ──────────────────────────────────────────────────────── */
      ::-webkit-scrollbar         { width: 4px; height: 4px; }
      ::-webkit-scrollbar-thumb   {
        background:    rgba(200,168,74,0.2);
        border-radius: 99px;
        transition:    background 0.2s;
      }
      ::-webkit-scrollbar-thumb:hover { background: rgba(200,168,74,0.4); }
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