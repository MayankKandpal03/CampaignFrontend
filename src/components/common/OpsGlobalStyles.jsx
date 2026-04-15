/**
 * OpsGlobalStyles — injects the shared keyframe animations and utility
 * class overrides used by all three OPS SUITE dashboards (PPC, Manager, PM).
 *
 * Previously each dashboard injected identical CSS via a `<style>` tag
 * embedded in the JSX. Extracting into one component prevents duplicate
 * style injection when multiple dashboard tabs are open in the same SPA session.
 *
 * Place this once at the root of each dashboard or in App.jsx.
 */
import { T } from "../../constants/theme.js";

export default function OpsGlobalStyles() {
  return (
    <style>{`
      @keyframes opsIn      { from { opacity:0; transform:translateY(14px) scale(.97); } to { opacity:1; transform:none; } }
      @keyframes opsFadeUp  { from { opacity:0; transform:translateY(8px); }            to { opacity:1; transform:none; } }
      @keyframes opsPulse   { 0%,100%{opacity:.6} 50%{opacity:1} }

      .ops-focus:focus     { border-color:${T.gold} !important; box-shadow:0 0 0 3px ${T.goldDim}; outline:none; }

      .ops-row             { cursor:default; transition:background .12s, box-shadow .12s; }
      .ops-row:hover       { background:${T.bgRow} !important; box-shadow:inset 3px 0 0 ${T.gold}55; }
      .ops-row:hover td:first-child { color:${T.gold}; }

      .ops-nav-btn         { transition:all .15s !important; }
      .ops-nav-btn:hover   { color:${T.gold} !important; background:${T.goldDim} !important; }
      .ops-nav-btn:active  { transform:scale(.97) !important; }

      .ops-fcard           { transition:transform .18s, border-color .18s, box-shadow .18s; cursor:pointer; }
      .ops-fcard:hover     { transform:translateY(-3px); box-shadow:0 6px 24px rgba(0,0,0,.5); }
      .ops-fcard:active    { transform:translateY(-1px) scale(.98); }

      .ops-upd             { transition:all .15s !important; }
      .ops-upd:hover       { background:rgba(240,160,48,.22) !important; border-color:${T.amber} !important; transform:scale(1.05); }
      .ops-upd:active      { transform:scale(.97) !important; }

      .ops-del             { transition:all .15s !important; }
      .ops-del:hover       { background:rgba(224,82,82,.22) !important; border-color:${T.red} !important; color:${T.red} !important; }

      .ops-pending         { animation:opsPulse 2.4s ease-in-out infinite; }

      button:focus-visible { outline:2px solid ${T.gold}; outline-offset:2px; }

      ::-webkit-scrollbar         { width:4px; height:4px; }
      ::-webkit-scrollbar-thumb   { background:${T.subtle}; border-radius:99px; }
      ::-webkit-scrollbar-track   { background:transparent; }

      select option { background:${T.bgCard}; color:${T.text}; }
    `}</style>
  );
}
