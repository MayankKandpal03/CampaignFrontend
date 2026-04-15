/**
 * Campaign API service.
 * Centralises all campaign-related axios calls that were scattered
 * directly inside store actions (useCampaignStore) and page components.
 *
 * The Zustand store still acts as the client-side cache; these functions
 * are called by the store actions and directly by PMDashboard (which uses
 * local state rather than the global store).
 */
import api from "../api/axios.js";

/** GET /api/v1/campaign/get */
export const fetchCampaigns = async () => {
  const res = await api.get("/campaign/get");
  return res.data?.data ?? [];
};

/** POST /api/v1/campaign/create */
export const createCampaign = async ({ message, requestedAt, teamId }) => {
  const res = await api.post("/campaign/create", { message, requestedAt, teamId });
  return res.data?.data;
};

/** POST /api/v1/campaign/update */
export const updateCampaign = async (campaignId, updateData) => {
  const res = await api.post("/campaign/update", { campaignId, ...updateData });
  return res.data?.data;
};
