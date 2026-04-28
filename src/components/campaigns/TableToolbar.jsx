/**
 * TableToolbar — premium search bar, record count, filter chip.
 * Props and logic unchanged.
 */
import { T, inputSx } from "../../constants/theme.js";

export default function TableToolbar({
  title,
  count,
  search,
  onSearch,
  activeFilter,
  onClearFilter,
  isMobile = false,
}) {
  return (
    <div style={{
      padding:        "12px 18px",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      gap:            10,
      flexWrap:       "wrap",
      borderBottom:   `1px solid ${T.subtle}`,
      background:     `${T.bgCard}f8`,
    }}>
      {/* Left */}
      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <span style={{
          fontSize:      8.5,
          fontWeight:    700,
          letterSpacing: "0.18em",
          color:         T.gold,
          fontFamily:    "'Cinzel', serif",
          textTransform: "uppercase",
        }}>
          {title}
        </span>

        {/* Count pill */}
        <span style={{
          padding:       "2px 9px",
          borderRadius:  99,
          background:    T.goldDim,
          border:        `1px solid ${T.goldBorder}`,
          fontSize:      9,
          color:         T.gold,
          fontFamily:    "'JetBrains Mono', monospace",
          fontWeight:    600,
        }}>
          {count} records
        </span>

        {/* Active filter clear */}
        {activeFilter && (
          <button
            onClick={onClearFilter}
            style={{
              display:       "flex",
              alignItems:    "center",
              gap:           5,
              background:    "transparent",
              border:        `1px solid ${T.subtle}`,
              color:         T.muted,
              fontSize:      9,
              cursor:        "pointer",
              padding:       "2px 9px",
              borderRadius:  99,
              transition:    "all .15s ease",
              fontFamily:    "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.borderColor = T.red; e.currentTarget.style.background = T.redBg; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.subtle; e.currentTarget.style.background = "transparent"; }}
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Right: search */}
      <div style={{
        position:   "relative",
        flexShrink: 0,
        width:      isMobile ? "100%" : "auto",
      }}>
        <span style={{
          position:      "absolute",
          left:          11,
          top:           "50%",
          transform:     "translateY(-50%)",
          color:         T.muted,
          fontSize:      13,
          pointerEvents: "none",
          lineHeight:    1,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
        </span>
        <input
          className="ops-focus"
          type="text"
          placeholder="Search tasks…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          style={{
            ...inputSx,
            paddingLeft:  34,
            height:       34,
            width:        isMobile ? "100%" : 210,
            fontSize:     12,
            borderRadius: 99,
            border:       `1px solid ${T.subtle}`,
          }}
        />
      </div>
    </div>
  );
}