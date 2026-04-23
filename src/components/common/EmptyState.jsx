/**
 * EmptyState — refined empty placeholder with diamond glyph.
 * Props unchanged.
 */
import { T } from "../../constants/theme.js";

export default function EmptyState({
  headline = "No Records Found",
  sub,
  action,
}) {
  return (
    <div style={{
      padding:    "60px 24px",
      textAlign:  "center",
      animation:  "opsFadeUp .3s ease both",
    }}>
      {/* Diamond glyph */}
      <div style={{
        width:          48,
        height:         48,
        borderRadius:   12,
        background:     T.goldDim,
        border:         `1px solid ${T.goldBorder}`,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        margin:         "0 auto 18px",
      }}>
        <svg width="20" height="20" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <polygon points="18,4 32,18 18,32 4,18" fill="none" stroke="rgba(200,168,74,0.4)" strokeWidth="1.5"/>
          <polygon points="18,11 25,18 18,25 11,18" fill="rgba(200,168,74,0.08)" stroke="rgba(200,168,74,0.3)" strokeWidth="1"/>
        </svg>
      </div>

      <p style={{
        margin:        0,
        fontSize:      14,
        fontWeight:    600,
        color:         T.white,
        fontFamily:    "'Cinzel', serif",
        letterSpacing: "0.03em",
      }}>
        {headline}
      </p>

      {sub && (
        <p style={{
          margin:     "8px 0 0",
          fontSize:   13,
          color:      T.muted,
          lineHeight: 1.6,
          fontFamily: "'DM Sans', sans-serif",
          maxWidth:   300,
          marginLeft: "auto",
          marginRight:"auto",
        }}>
          {sub}
        </p>
      )}

      {action && (
        <div style={{marginTop:22}}>
          {action}
        </div>
      )}
    </div>
  );
}