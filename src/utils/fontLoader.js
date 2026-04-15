/**
 * Injects the OPS SUITE Google Fonts link tag into <head> once.
 * Previously defined as `injectFonts()` and called at the top of each render in
 * PPCDashboard, ManagerDashboard, and PMDashboard — causing repeated DOM writes.
 *
 * Call this once per app session (e.g. in main.jsx or App.jsx) or
 * use the hook version `useFontLoader` from hooks/.
 */
export const injectOpsFonts = () => {
  if (document.getElementById("ops-fonts")) return;
  const link = document.createElement("link");
  link.id   = "ops-fonts";
  link.rel  = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700" +
    "&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400" +
    "&family=JetBrains+Mono:wght@400;500&display=swap";
  document.head.appendChild(link);
};

/**
 * Injects Fraunces + DM Sans + DM Mono (IT Dashboard fonts).
 */
export const injectItFonts = () => {
  if (document.getElementById("it-fonts")) return;
  const link = document.createElement("link");
  link.id   = "it-fonts";
  link.rel  = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;" +
    "0,9..144,500;0,9..144,700;1,9..144,300" +
    "&family=DM+Sans:wght@300;400;500;600" +
    "&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(link);
};
