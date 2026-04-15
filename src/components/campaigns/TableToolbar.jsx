/**
 * TableToolbar — search bar + record count + active-filter chip.
 *
 * EXTRACTED FROM: PPCDashboard and ManagerDashboard.
 * Both had a near-identical ~35-line toolbar block above the campaign table.
 *
 * @prop {string}    title       - e.g. "TEAM CAMPAIGNS" or "PROCESS MANAGER VIEW"
 * @prop {number}    count       - number of visible (filtered) records
 * @prop {string}    search      - current search value
 * @prop {Function}  onSearch    - called with new value on input change
 * @prop {string|null} activeFilter - currently active filter id, or null
 * @prop {Function}  onClearFilter - called when ✕ Clear filter is clicked
 * @prop {boolean=}  isMobile
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
      padding:        "13px 18px",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      gap:            10,
      flexWrap:       "wrap",
      borderBottom:   `1px solid ${T.subtle}`,
      background:     `${T.bg}cc`,
    }}>
      {/* Left: title + count + clear */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{
          fontSize:      9,
          fontWeight:    600,
          letterSpacing: "0.2em",
          color:         T.gold,
          fontFamily:    "'Cinzel', serif",
        }}>
          {title}
        </span>

        {/* Record count pill */}
        <span style={{
          padding:      "2px 9px",
          borderRadius: 2,
          background:   T.goldDim,
          border:       `1px solid ${T.goldBorder}`,
          fontSize:     9,
          color:        T.gold,
          fontFamily:   "'JetBrains Mono', monospace",
        }}>
          {count} records
        </span>

        {/* Active filter clear button */}
        {activeFilter && (
          <button
            onClick={onClearFilter}
            style={{
              background:   "transparent",
              border:       `1px solid ${T.subtle}`,
              color:        T.muted,
              fontSize:     9,
              cursor:       "pointer",
              padding:      "2px 8px",
              borderRadius: 2,
              transition:   "all .15s",
              fontFamily:   "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color       = T.red;
              e.currentTarget.style.borderColor = T.red;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color       = T.muted;
              e.currentTarget.style.borderColor = T.subtle;
            }}
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      {/* Right: search input */}
      <div style={{
        position: "relative",
        flexShrink: 0,
        width: isMobile ? "100%" : "auto",
      }}>
        <span style={{
          position:       "absolute",
          left:           10,
          top:            "50%",
          transform:      "translateY(-50%)",
          color:          T.muted,
          fontSize:       13,
          pointerEvents:  "none",
        }}>
          ⌕
        </span>
        <input
          className="ops-focus"
          type="text"
          placeholder="Search campaigns…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          style={{
            ...inputSx,
            paddingLeft: 32,
            height:      34,
            width:       isMobile ? "100%" : 210,
            fontSize:    12,
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
}
