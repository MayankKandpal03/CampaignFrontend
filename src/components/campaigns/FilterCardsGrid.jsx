/**
 * FilterCardsGrid — premium filterable status cards.
 * Props and logic unchanged.
 */
import { T } from "../../constants/theme.js";

export default function FilterCardsGrid({
  cards,
  stats,
  activeId,
  onSelect,
  isMobile  = false,
  visible   = true,
}) {
  if (!visible) return null;

  return (
    <div style={{
      display:       "flex",
      gap:           10,
      overflowX:     isMobile ? "auto" : "unset",
      flexWrap:      isMobile ? "nowrap" : "wrap",
      marginBottom:  22,
      paddingBottom: isMobile ? 6 : 0,
      animation:     "opsFadeUp .25s ease",
    }}>
      {cards.map(card => {
        const active = activeId === card.id;
        const count  = stats[card.id] ?? 0;

        return (
          <div
            key={card.id}
            className="ops-fcard"
            onClick={() => onSelect(card.id)}
            style={{
              flex:         isMobile ? "0 0 136px" : "1 1 0",
              minWidth:     isMobile ? 136 : 110,
              padding:      "16px 18px 14px",
              borderRadius: 10,
              background:   active
                ? `linear-gradient(135deg, ${card.bg}, rgba(${hexToRgbStr(card.color)}, 0.12))`
                : T.bgCard,
              border:       `1px solid ${active ? card.color + "55" : T.subtle}`,
              cursor:       "pointer",
              userSelect:   "none",
              boxShadow:    active
                ? `0 4px 20px rgba(${hexToRgbStr(card.color)}, 0.12), 0 1px 4px rgba(0,0,0,0.3)`
                : T.shadowSm,
            }}
          >
            {/* Label */}
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:11 }}>
              <span style={{
                width:        5,
                height:       5,
                borderRadius: "50%",
                background:   active ? card.color : T.muted,
                flexShrink:   0,
                boxShadow:    active ? `0 0 6px ${card.color}` : "none",
                transition:   "all .18s",
              }}/>
              <span style={{
                fontSize:      8.5,
                fontWeight:    700,
                letterSpacing: "0.16em",
                color:         active ? card.color : T.muted,
                fontFamily:    "'Cinzel', serif",
                textTransform: "uppercase",
                transition:    "color .18s",
              }}>
                {card.label}
              </span>
            </div>

            {/* Count */}
            <div style={{
              fontSize:      28,
              fontWeight:    700,
              color:         active ? card.color : T.white,
              fontFamily:    "'Cinzel', serif",
              lineHeight:    1,
              letterSpacing: "-0.01em",
              transition:    "color .18s",
            }}>
              {count}
            </div>

            <div style={{
              fontSize:   9,
              color:      active ? card.color + "99" : T.muted,
              marginTop:  5,
              fontFamily: "'DM Sans', sans-serif",
              transition: "color .18s",
            }}>
              campaigns
            </div>

            {active && (
              <div style={{
                marginTop:     9,
                paddingTop:    9,
                borderTop:     `1px solid ${card.color}25`,
                fontSize:      8,
                color:         card.color,
                letterSpacing: "0.12em",
                fontFamily:    "'Cinzel', serif",
                display:       "flex",
                alignItems:    "center",
                gap:           5,
              }}>
                <span style={{ width:4, height:4, borderRadius:"50%", background:card.color, animation:"opsPulse 1.8s ease infinite" }}/>
                Filtering
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Rough hex→rgb for box-shadow rgba — handles 3 and 6-char hex */
function hexToRgbStr(hex = "#888") {
  const h = hex.replace("#","");
  const full = h.length === 3
    ? h.split("").map(c => c+c).join("")
    : h;
  const r = parseInt(full.slice(0,2),16);
  const g = parseInt(full.slice(2,4),16);
  const b = parseInt(full.slice(4,6),16);
  return `${r},${g},${b}`;
}