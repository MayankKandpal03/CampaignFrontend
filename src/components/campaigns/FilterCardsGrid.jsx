/**
 * FilterCardsGrid — premium filterable status cards.
 * Dynamic colors kept inline (runtime values per card).
 */

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
    <div className={`flex gap-2.5 mb-5.5 animate-[opsFadeUp_0.25s_ease] ${isMobile ? "overflow-x-auto flex-nowrap pb-1.5" : "flex-wrap"}`}>
      {cards.map(card => {
        const active = activeId === card.id;
        const count  = stats[card.id] ?? 0;

        return (
          <div
            key={card.id}
            className={`ops-fcard rounded-[10px] cursor-pointer select-none p-[16px_18px_14px] ${isMobile ? "flex-none w-34" : "flex-1 min-w-27.5"}`}
            onClick={() => onSelect(card.id)}
            style={{
              background: active
                ? `linear-gradient(135deg, ${card.bg}, rgba(${hexToRgbStr(card.color)}, 0.12))`
                : "#141310",
              border: `1px solid ${active ? card.color + "55" : "#2e2c22"}`,
              boxShadow: active
                ? `0 4px 20px rgba(${hexToRgbStr(card.color)}, 0.12), 0 1px 4px rgba(0,0,0,0.3)`
                : undefined,
            }}
          >
            {/* Label */}
            <div className="flex items-center gap-1.5 mb-2.75">
              <span
                className="w-1.25 h-1.25 rounded-full shrink-0 transition-all duration-180"
                style={{
                  background: active ? card.color : "#7a7060",
                  boxShadow: active ? `0 0 6px ${card.color}` : "none",
                }}
              />
              <span
                className="text-[8.5px] font-bold tracking-[0.16em] font-['Cinzel',serif] uppercase transition-[color] duration-180"
                style={{ color: active ? card.color : "#7a7060" }}
              >
                {card.label}
              </span>
            </div>

            {/* Count */}
            <div
              className="text-[28px] font-bold font-['Cinzel',serif] leading-none tracking-[-0.01em] transition-[color] duration-180"
              style={{ color: active ? card.color : "#f5edd8" }}
            >
              {count}
            </div>

            <div
              className="text-[9px] mt-1.25 font-['DM_Sans',sans-serif] transition-[color] duration-180"
              style={{ color: active ? card.color + "99" : "#7a7060" }}
            >
              campaigns
            </div>

            {active && (
              <div
                className="mt-2.25 pt-2.25 text-[8px] tracking-[0.12em] font-['Cinzel',serif] flex items-center gap-1.25"
                style={{ borderTop: `1px solid ${card.color}25`, color: card.color }}
              >
                <span
                  className="w-1 h-1 rounded-full animate-[opsPulse_1.8s_ease_infinite]"
                  style={{ background: card.color }}
                />
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