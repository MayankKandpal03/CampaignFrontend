/**
 * useTasks — campaign store + socket event wiring.
 *
 * FIXES (original):
 *  1. DOUBLE CAMPAIGN: `addCampaign` checks existence before adding.
 *  2. DOUBLE NOTIFICATION: local addNotification calls removed from page handlers.
 *  3. NOTIFICATION MESSAGES: uses `c.performerName` for human-readable messages.
 *
 * NEW — campaign:schedule_fired:
 *  Emitted by the server when a previously-scheduled campaign timer fires and
 *  the campaign is actually delivered to IT. PPC/Manager/PM dashboards receive
 *  this event so they patch the campaign in the store immediately.
 */
import useCampaignStore from "../stores/useCampaignStore.js";
import { useSocket }    from "./useSocket.js";

export const useCampaigns = ({
  enableSocket   = true,
  onNotification = () => {},
} = {}) => {
  const campaigns      = useCampaignStore(s => s.campaigns);
  const getCampaign    = useCampaignStore(s => s.getCampaign);
  const createCampaign = useCampaignStore(s => s.createCampaign);
  const updateCampaign = useCampaignStore(s => s.updateCampaign);

  // ── Store mutation helpers (used by socket handlers below) ────────────────
  const addCampaign = c => {
    const exists = useCampaignStore.getState().campaigns.some(x => x._id === c._id);
    if (!exists) {
      useCampaignStore.setState(s => ({ campaigns: [c, ...s.campaigns] }));
    }
  };

  const patchCampaign = c =>
    useCampaignStore.setState(s => ({
      campaigns: s.campaigns.map(x => x._id === c._id ? c : x),
    }));

  // ── Socket handlers ────────────────────────────────────────────────────────
  useSocket(
    enableSocket
      ? {
          "campaign:created": c => {
            addCampaign(c);
            onNotification(`Campaign created by ${c.performerName || "someone"}`);
          },

          "campaign:updated": c => {
            patchCampaign(c);
            const msg =
              c.status === "cancel" || c.action === "cancel"
                ? `Campaign cancelled by ${c.performerName || "someone"}`
                : `Campaign updated by ${c.performerName || "someone"}`;
            onNotification(msg);
          },

          "campaign:it_queued": c => {
            patchCampaign(c);
            onNotification(
              `Campaign approved by ${c.performerName || "PM"} — sent to IT`,
            );
          },

          "campaign:schedule_fired": c => {
            patchCampaign(c);
          },

          "campaign:it_ack": c => {
            patchCampaign(c);
            const msg =
              c.acknowledgement === "done"
                ? `${c.performerName || "IT"} completed campaign`
                : `${c.performerName || "IT"} could not complete campaign`;
            onNotification(msg);
          },

          "campaign:deleted": d => {
            useCampaignStore.setState(s => ({
              campaigns: s.campaigns.filter(x => x._id !== d._id),
            }));
          },
        }
      : {},
  );

  return { campaigns, getCampaign, createCampaign, updateCampaign };
};