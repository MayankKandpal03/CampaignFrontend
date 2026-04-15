/**
 * Formatting utilities.
 * Previously duplicated in PPCDashboard, ManagerDashboard, PMDashboard, and ITDashboard.
 */

/** Full date + time: DD/MM/YYYY, HH:MM */
export const fmt = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
};

/** Date only: DD/MM/YYYY */
export const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  } catch { return d; }
};

/** Time only: HH:MM */
export const fmtTime = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
};

/** Extract up to 2 uppercase initials from a name string */
export const initials = (n = "") =>
  n.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "?";

/**
 * Convert a date to a local ISO string suitable for datetime-local inputs.
 * Previously defined inside PMDashboard as `toLocalISO`.
 */
export const toLocalISO = (d) => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
    return dt.toISOString().slice(0, 16);
  } catch { return ""; }
};
