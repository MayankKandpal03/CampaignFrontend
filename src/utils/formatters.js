/**
 * Formatting utilities.
 * Previously duplicated in PPCDashboard, ManagerDashboard, PMDashboard, and ITDashboard.
 */

/** Full date + time: DD/MM/YYYY, HH:MM (24-hour) */
export const fmt = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return d;
  }
};

/** Date only: DD/MM/YYYY */
export const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

/** Time only: HH:MM (24-hour) */
export const fmtTime = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return d;
  }
};

/** Extract up to 2 uppercase initials from a name string */
export const initials = (n = "") =>
  n
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

/**
 * Convert a date to a local ISO string suitable for datetime-local inputs.
 * The value shown in the input is in the user's LOCAL timezone.
 */
export const toLocalISO = (d) => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
    return dt.toISOString().slice(0, 16);
  } catch {
    return "";
  }
};

/**
 * Convert a datetime-local input value ("YYYY-MM-DDTHH:MM") to a UTC ISO
 * string suitable for sending to the server.
 *
 * WHY THIS IS NEEDED (the timezone bug root cause):
 *   - `datetime-local` inputs produce strings like "2024-01-15T14:30" with NO
 *     timezone info.
 *   - In BROWSERS, `new Date("2024-01-15T14:30")` is parsed as LOCAL time
 *     (IST for Indian users), so .toISOString() correctly gives UTC.
 *   - In NODE.JS (server), the same string is parsed as UTC — a 5:30 hour
 *     mismatch for IST users.
 *
 * Solution: always call this on the FRONTEND before sending any datetime to
 * the server. The server then always receives unambiguous UTC ISO strings.
 *
 * @param {string} localDatetime  value from a datetime-local input
 * @returns {string|undefined}    UTC ISO string, e.g. "2024-01-15T09:00:00.000Z"
 */
export const localToUTC = (localDatetime) => {
  if (!localDatetime) return undefined;
  const d = new Date(localDatetime); // browser parses as local time ✓
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString(); // always UTC ✓
};