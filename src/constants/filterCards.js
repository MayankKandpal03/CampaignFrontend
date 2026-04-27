import { T } from "./theme.js";

/** PPC + Manager dashboards — 5 statuses */
export const FILTER_CARDS = [
  { id: "transfer",  label: "In Review",  color: T.blue,   bg: T.blueBg  },
  { id: "approve",   label: "Approved",   color: T.teal,   bg: T.tealBg  },
  { id: "done",      label: "Done",       color: T.green,  bg: T.greenBg },
  { id: "cancel",    label: "Cancelled",  color: T.red,    bg: T.redBg   },
  { id: "not done",  label: "Not Done",   color: T.amber,  bg: T.amberBg },
];

/** PM all-campaigns section — 5 cards */
export const PM_FILTER_CARDS = [
  { id: "pending",   label: "Pending",    color: T.amber,  bg: T.amberBg },
  { id: "approve",   label: "Approved",   color: T.teal,   bg: T.tealBg  },
  { id: "done",      label: "Done",       color: T.green,  bg: T.greenBg },
  { id: "cancel",    label: "Cancelled",  color: T.red,    bg: T.redBg   },
  { id: "not done",  label: "Not Done",   color: T.purple, bg: T.purpleBg },
];

/** PM → Open Requests section. */
export const OPEN_REQUEST_FILTER_CARDS = [
  { id: "pending",  label: "Pending",   color: T.amber, bg: T.amberBg },
  { id: "approve",  label: "Approved",  color: T.teal,  bg: T.tealBg  },
];

/** PM → Closed Requests section. */
export const CLOSED_REQUEST_FILTER_CARDS = [
  { id: "done",      label: "Done",      color: T.green,  bg: T.greenBg  },
  { id: "cancel",    label: "Cancelled", color: T.red,    bg: T.redBg    },
  { id: "not done",  label: "Not Done",  color: T.purple, bg: T.purpleBg },
];