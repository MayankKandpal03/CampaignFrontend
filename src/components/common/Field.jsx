/**
 * Field — labelled form field wrapper.
 * Previously copy-pasted into PPCDashboard, ManagerDashboard, and PMDashboard.
 *
 * @prop {string}  label - uppercase field label
 * @prop {string=} hint  - optional parenthetical hint shown in muted text
 */
import { T } from "../../constants/theme.js";

export default function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize:      9,
        fontWeight:    600,
        letterSpacing: "0.18em",
        color:         T.gold,
        fontFamily:    "'Cinzel', serif",
        marginBottom:  8,
      }}>
        {label}
        {hint && (
          <span style={{
            color:         T.muted,
            fontWeight:    400,
            fontSize:      9,
            letterSpacing: "0.06em",
            fontFamily:    "'DM Sans', sans-serif",
            marginLeft:    6,
          }}>
            ({hint})
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
