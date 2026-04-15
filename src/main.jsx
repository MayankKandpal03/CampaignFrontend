/**
 * main.jsx — refactored.
 *
 * WHAT CHANGED:
 *  - injectOpsFonts() is now called once here instead of at the top of
 *    every dashboard render function (PPCDashboard, ManagerDashboard, PMDashboard).
 *  - injectItFonts() also called once so ITDashboard doesn't need to do it.
 *
 * This prevents repeated DOM link tag writes whenever React re-renders.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { injectOpsFonts, injectItFonts } from "./utils/fontLoader.js";

// Inject fonts once at startup — not inside component render functions
injectOpsFonts();
injectItFonts();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
