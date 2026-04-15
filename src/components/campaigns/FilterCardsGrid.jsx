/**
 * FilterCardsGrid — clickable status filter cards row.
 *
 * EXTRACTED FROM: PPCDashboard and ManagerDashboard.
 * Both pages rendered the same filter card grid inline (~30 lines each)
 * with the same click-to-toggle behaviour and identical card structure.
 *
 * PPCDashboard also had a mobile-only show/hide toggle above the grid;
 * that toggle is controlled from the page via the `visible` prop.
 *
 * @prop {Array}    cards         - array of { id, label, color, bg }
 * @prop {object}   stats         - map of id → count
 * @prop {string|null} activeId   - currently selected filter id (or null)
 * @prop {Function} onSelect      - called with card id when a card is clicked;
 *                                  returns null when same card clicked again (toggle)
 * @prop {boolean=} isMobile      - enables horizontal scroll + fixed card width
 * @prop {boolean=} visible       - whether to render (used for mobile show/hide)
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
    <div
      style={{
        display:       "flex",
        gap:           10,
        overflowX:     isMobile ? "auto" : "unset",
        flexWrap:      isMobile ? "nowrap" : "wrap",
        marginBottom:  22,
        paddingBottom: isMobile ? 4 : 0,
        animation:     "opsFadeUp .22s ease",
      }}
    >
      {cards.map(card => {
        const active = activeId === card.id;
        const count  = stats[card.id] ?? 0;

        return (
          <div
            key={card.id}
            className="ops-fcard"
            onClick={() => onSelect(card.id)}
            style={{
              flex:       isMobile ? "0 0 130px" : "1 1 0",
              minWidth:   isMobile ? 130 : 110,
              padding:    "16px 16px 14px",
              borderRadius: 4,
              background: active ? card.bg    : T.bgCard,
              border:     `1px solid ${active ? card.color : T.goldBorder}`,
              cursor:     "pointer",
              userSelect: "none",
            }}
          >
            {/* Label row */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{
                width:      6,
                height:     6,
                borderRadius: "50%",
                background: card.color,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize:      8,
                fontWeight:    700,
                letterSpacing: "0.18em",
                color:         active ? card.color : T.muted,
                fontFamily:    "'Cinzel', serif",
                transition:    "color .18s",
              }}>
                {card.label.toUpperCase()}
              </span>
            </div>

            {/* Count */}
            <div style={{
              fontSize:   30,
              fontWeight: 700,
              color:      active ? card.color : T.white,
              fontFamily: "'Cinzel', serif",
              lineHeight: 1,
            }}>
              {count}
            </div>

            <div style={{ fontSize: 9, color: T.muted, marginTop: 5 }}>
              campaigns
            </div>

            {/* Active indicator */}
            {active && (
              <div style={{
                marginTop:     8,
                fontSize:      8,
                color:         card.color,
                letterSpacing: "0.1em",
                fontFamily:    "'Cinzel', serif",
              }}>
                ● FILTERING
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
