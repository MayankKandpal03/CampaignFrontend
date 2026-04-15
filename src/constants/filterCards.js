/**
 * Filter card configurations.
 *
 * FILTER_CARDS           — 5-item set for PPC and Manager dashboards.
 * PM_FILTER_CARDS        — 5-item set for PM campaigns (adds Pending).
 * OPEN_REQUEST_CARDS     — 3-item stat cards for PM open-requests section.
 */
import { T } from "./theme.js";

/** PPC + Manager dashboards — 5 statuses */
export const FILTER_CARDS = [
  { id: "transfer",  label: "In Review",  color: T.blue,   bg: T.blueBg  },
  { id: "approve",   label: "Approved",   color: T.teal,   bg: T.tealBg  },
  { id: "done",      label: "Done",       color: T.green,  bg: T.greenBg },
  { id: "cancel",    label: "Cancelled",  color: T.red,    bg: T.redBg   },
  { id: "not done",  label: "Not Done",   color: T.amber,  bg: T.amberBg },
];

/**
 * PM all-campaigns section — 5 cards including Pending (no PM action yet).
 * FIX: "Pending" was missing so PM had no way to filter campaigns awaiting action.
 */
export const PM_FILTER_CARDS = [
  { id: "pending",   label: "Pending",    color: T.amber,  bg: T.amberBg },
  { id: "approve",   label: "Approved",   color: T.teal,   bg: T.tealBg  },
  { id: "done",      label: "Done",       color: T.green,  bg: T.greenBg },
  { id: "cancel",    label: "Cancelled",  color: T.red,    bg: T.redBg   },
];

/**
 * PM open-requests section stat cards.
 * Shows summary counts for campaigns awaiting IT, IT-completed, and fully done.
 */
export const OPEN_REQUEST_CARDS = [
  { id: "waiting",   label: "Waiting IT", color: T.amber,  bg: T.amberBg },
  { id: "acked",     label: "IT Done",    color: T.teal,   bg: T.tealBg  },
  { id: "done",      label: "Done",       color: T.green,  bg: T.greenBg },
];