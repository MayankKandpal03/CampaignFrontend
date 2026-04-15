/**
 * ErrorBoundary — catches render-phase errors in any child tree.
 *
 * ADDED (was completely absent from the original codebase).
 * Without this, any unhandled render error in a dashboard crashes the entire app
 * with a blank white screen and no user-visible feedback.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <PPCDashboard />
 *   </ErrorBoundary>
 *
 * Or wrap each route individually in App.jsx for per-page isolation.
 *
 * @prop {ReactNode} children
 * @prop {ReactNode=} fallback  - custom fallback UI; defaults to styled error card
 */
import { Component } from "react";
import { T } from "../constants/theme.js";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Replace with your error reporting service (Sentry, Datadog, etc.)
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div style={{
        minHeight:      "100vh",
        background:     T.bg,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        24,
        fontFamily:     "'DM Sans', sans-serif",
      }}>
        <div style={{
          background:   T.bgCard,
          border:       `1px solid ${T.red}44`,
          borderRadius: 8,
          padding:      "32px 36px",
          maxWidth:     480,
          width:        "100%",
          textAlign:    "center",
        }}>
          {/* Icon */}
          <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>

          <h2 style={{
            margin:        "0 0 8px",
            fontSize:      18,
            fontWeight:    600,
            color:         T.white,
            fontFamily:    "'Cinzel', serif",
            letterSpacing: "0.04em",
          }}>
            Something went wrong
          </h2>

          <p style={{
            margin:     "0 0 24px",
            fontSize:   13,
            color:      T.muted,
            lineHeight: 1.6,
          }}>
            An unexpected error occurred. Please refresh the page.
            If the problem persists, contact IT support.
          </p>

          {/* Error detail (collapsed) */}
          {this.state.error && (
            <details style={{ textAlign: "left", marginBottom: 20 }}>
              <summary style={{
                fontSize:  11,
                color:     T.muted,
                cursor:    "pointer",
                fontFamily:"'JetBrains Mono', monospace",
              }}>
                Error detail
              </summary>
              <pre style={{
                marginTop:    8,
                padding:      "10px 12px",
                background:   T.bgInput,
                borderRadius: 4,
                fontSize:     10,
                color:        T.red,
                overflowX:    "auto",
                fontFamily:   "'JetBrains Mono', monospace",
                whiteSpace:   "pre-wrap",
                wordBreak:    "break-all",
              }}>
                {this.state.error.message}
              </pre>
            </details>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              padding:       "10px 24px",
              borderRadius:  4,
              cursor:        "pointer",
              background:    T.gold,
              border:        `1px solid ${T.gold}`,
              color:         "#0c0b08",
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: "0.12em",
              fontFamily:    "'Cinzel', serif",
              transition:    "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.goldLight}
            onMouseLeave={e => e.currentTarget.style.background = T.gold}
          >
            REFRESH PAGE
          </button>
        </div>
      </div>
    );
  }
}
