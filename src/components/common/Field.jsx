/**
 * Field — premium labelled form field wrapper.
 * Props unchanged.
 */
import { T } from "../../constants/theme.js";

export default function Field({ label, hint, children }) {
  return (
    <div style={{marginBottom:18}}>
      <div style={{
        fontSize:      9.5,
        fontWeight:    600,
        letterSpacing: "0.18em",
        color:         "rgba(200,168,74,0.7)",
        fontFamily:    "'Cinzel', serif",
        marginBottom:  8,
        textTransform: "uppercase",
        display:       "flex",
        alignItems:    "center",
        gap:           6,
      }}>
        {label}
        {hint && (
          <span style={{
            color:         T.muted,
            fontWeight:    400,
            fontSize:      9,
            letterSpacing: "0.04em",
            fontFamily:    "'DM Sans', sans-serif",
            textTransform: "none",
          }}>
            ({hint})
          </span>
        )}
      </div>
      {children}
    </div>
  );
}