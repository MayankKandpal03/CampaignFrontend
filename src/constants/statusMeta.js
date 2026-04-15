/**
 * Status & Action metadata for badge rendering.
 * Previously duplicated identically in PPCDashboard, ManagerDashboard, PMDashboard.
 */
import { T } from "./theme.js";

export const STATUS_META = {
  transfer:   { label: "IN REVIEW",  color: T.blue,   bg: T.blueBg  },
  cancel:     { label: "CANCELLED",  color: T.red,    bg: T.redBg   },
  done:       { label: "DONE",       color: T.green,  bg: T.greenBg },
  "not done": { label: "NOT DONE",   color: T.amber,  bg: T.amberBg },
};

export const ACTION_META = {
  approve: { label: "APPROVED",  color: T.teal,  bg: T.tealBg  },
  cancel:  { label: "REJECTED",  color: T.red,   bg: T.redBg   },
  done:    { label: "COMPLETED", color: T.green, bg: T.greenBg },
};

export const ACK_META = {
  done:      { label: "ACK DONE",     color: T.green, bg: T.greenBg },
  "not done":{ label: "ACK NOT DONE", color: T.amber, bg: T.amberBg },
};

/**
 * Role-to-color mapping used in RoleBadge and PM user cards.
 * Previously defined only in PMDashboard.
 */
export const ROLE_COLOR = {
  ppc:               { color: T.blue,   bg: T.blueBg   },
  manager:           { color: T.gold,   bg: T.goldDim  },
  "process manager": { color: T.purple, bg: T.purpleBg },
  it:                { color: T.teal,   bg: T.tealBg   },
};
