import { useState, useEffect } from "react";

/**
 * Tracks whether viewport width is below a breakpoint.
 * Previously defined with identical useState + useEffect in
 * PPCDashboard, ManagerDashboard, and PMDashboard.
 *
 * @param {number} breakpoint - pixel width threshold (default 768)
 * @returns {boolean} isMobile
 */
export const useResponsive = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const cb = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", cb);
    return () => window.removeEventListener("resize", cb);
  }, [breakpoint]);

  return isMobile;
};
