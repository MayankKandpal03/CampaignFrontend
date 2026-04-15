/**
 * EmptyState — centred empty table placeholder.
 *
 * EXTRACTED FROM: PPCDashboard and ManagerDashboard.
 * Both rendered a near-identical ~12-line block with a diamond glyph,
 * a headline, a sub-message, and an optional action button.
 *
 * @prop {string}    headline   - main message (default "No Records Found")
 * @prop {string=}   sub        - secondary help text
 * @prop {ReactNode=}action     - optional CTA button/element
 */
import { T } from "../../constants/theme.js";

export default function EmptyState({
  headline = "No Records Found",
  sub,
  action,
}) {
  return (
    <div style={{ padding: "52px 20px", textAlign: "center" }}>
      {/* Diamond glyph */}
      <div style={{
        fontSize:     24,
        color:        T.subtle,
        marginBottom: 12,
        fontFamily:   "'Cinzel', serif",
      }}>
        ◇
      </div>

      <p style={{
        margin:        0,
        fontSize:      14,
        color:         T.white,
        fontFamily:    "'Cinzel', serif",
        letterSpacing: "0.04em",
      }}>
        {headline}
      </p>

      {sub && (
        <p style={{
          margin:    "8px 0 20px",
          fontSize:  13,
          color:     T.muted,
        }}>
          {sub}
        </p>
      )}

      {action && !sub && (
        <div style={{ marginTop: 20 }}>{action}</div>
      )}

      {action && sub && action}
    </div>
  );
}
