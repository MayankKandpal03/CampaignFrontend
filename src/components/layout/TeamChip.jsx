/**
 * TeamChip — premium team info block for Manager sidebar.
 * Props unchanged.
 */
import { T } from "../../constants/theme.js";

export default function TeamChip({ teamInfo, memberCount = 0 }) {
  if (!teamInfo) return null;

  return (
    <div style={{
      margin:       "10px 12px 0",
      padding:      "10px 14px",
      borderRadius: 8,
      background:   `linear-gradient(135deg, rgba(200,168,74,0.08), rgba(200,168,74,0.04))`,
      border:       `1px solid ${T.goldBorder}`,
    }}>
      <div style={{display:"flex", alignItems:"center", gap:7, marginBottom:4}}>
        <span style={{
          width:        5,
          height:       5,
          borderRadius: "50%",
          background:   T.gold,
          flexShrink:   0,
          boxShadow:    `0 0 6px ${T.gold}`,
        }}/>
        <p style={{
          margin:        0,
          fontSize:      8,
          color:         T.muted,
          letterSpacing: "0.18em",
          fontFamily:    "'Cinzel', serif",
          textTransform: "uppercase",
        }}>
          Your Team
        </p>
      </div>
      <p style={{
        margin:     "0 0 3px",
        fontSize:   12,
        color:      T.gold,
        fontFamily: "'Cinzel', serif",
        fontWeight: 600,
        letterSpacing:"0.03em",
      }}>
        {teamInfo.teamName || "My Team"}
      </p>
      <p style={{
        margin:     0,
        fontSize:   9,
        color:      T.muted,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {memberCount} PPC member{memberCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}