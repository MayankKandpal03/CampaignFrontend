import { useState, useCallback } from "react";
import api from "../api/axios.js";

/**
 * Loads and caches the current manager's team info from GET /api/v1/team/my.
 * Extracted from ManagerDashboard where it was inlined as `loadTeamInfo`.
 *
 * @returns {{ teamInfo, teamLoading, loadTeamInfo }}
 *   teamInfo: { _id, teamName, managerId, members: [{_id, username, email, role}] } | null
 */
export const useTeam = () => {
  const [teamInfo, setTeamInfo]     = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);

  const loadTeamInfo = useCallback(async () => {
    setTeamLoading(true);
    try {
      const res = await api.get("/team/my");
      setTeamInfo(res.data?.data ?? null);
    } catch (err) {
      // Graceful fallback: caller can extract teamId from campaigns instead
      console.warn("GET /team/my failed:", err?.response?.status);
    } finally {
      setTeamLoading(false);
    }
  }, []);

  return { teamInfo, teamLoading, loadTeamInfo };
};
