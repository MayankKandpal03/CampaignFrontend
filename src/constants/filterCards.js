// src/constants/filterCards.js

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
 * PM all-campaigns section — 5 cards (added "not done").
 */
export const PM_FILTER_CARDS = [
  { id: "pending",   label: "Pending",    color: T.amber,  bg: T.amberBg },
  { id: "approve",   label: "Approved",   color: T.teal,   bg: T.tealBg  },
  { id: "done",      label: "Done",       color: T.green,  bg: T.greenBg },
  { id: "cancel",    label: "Cancelled",  color: T.red,    bg: T.redBg   },
  { id: "not done",  label: "Not Done",   color: T.purple, bg: T.purpleBg },
];

/**
 * PM → Open Requests section.
 * Only: Pending (no PM action yet) + Approved (forwarded to IT).
 */
export const OPEN_REQUEST_FILTER_CARDS = [
  { id: "pending",  label: "Pending",   color: T.amber, bg: T.amberBg },
  { id: "approve",  label: "Approved",  color: T.teal,  bg: T.tealBg  },
];

/**
 * PM → Closed Requests section.
 * Done + Cancelled + Not Done  ← "not done" added.
 */
export const CLOSED_REQUEST_FILTER_CARDS = [
  { id: "done",      label: "Done",      color: T.green,  bg: T.greenBg  },
  { id: "cancel",    label: "Cancelled", color: T.red,    bg: T.redBg    },
  { id: "not done",  label: "Not Done",  color: T.purple, bg: T.purpleBg },
];

/**
 * PM open-requests section stat cards (the summary row above the table).
 */
export const OPEN_REQUEST_CARDS = [
  { id: "waiting",   label: "Waiting IT", color: T.amber,  bg: T.amberBg },
  { id: "acked",     label: "IT Done",    color: T.teal,   bg: T.tealBg  },
  { id: "done",      label: "Done",       color: T.green,  bg: T.greenBg },
];