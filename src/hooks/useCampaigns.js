/**
 * useCampaigns — campaign store + socket event wiring.
 *
 * FIXES:
 *  1. DOUBLE CAMPAIGN: `addCampaign` now checks whether the campaign already
 *     exists in the store before adding it. Previously, the store's
 *     `createCampaign` action added the campaign AND the socket event added it
 *     again, showing duplicates until the page refreshed.
 *
 *  2. DOUBLE NOTIFICATION: The local `addNotification("Campaign submitted…")`
 *     calls have been removed from all page handlers. Only the socket event
 *     fires the notification, so the user sees exactly one message per action.
 *
 *  3. NOTIFICATION MESSAGES: Use `c.performerName` (injected by backend) to
 *     produce human-readable messages like "Campaign created by john".
 *     Distinguish cancelled / updated / acknowledged / not-done clearly.
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

  // ── Store mutation helpers ─────────────────────────────────────────────────
  /**
   * FIX: Check existence before adding to prevent duplicates.
   * The store's `createCampaign` action already adds the campaign optimistically.
   * When the socket echo arrives, we skip adding it again.
   */
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
          // campaign:created — PPC or Manager submitted a new campaign
          "campaign:created": c => {
            addCampaign(c);
            onNotification(`Campaign created by ${c.performerName || "someone"}`);
          },

          // campaign:updated — PPC edited, Manager edited, or PM cancelled
          "campaign:updated": c => {
            patchCampaign(c);
            const msg =
              c.status === "cancel" || c.action === "cancel"
                ? `Campaign cancelled by ${c.performerName || "someone"}`
                : `Campaign updated by ${c.performerName || "someone"}`;
            onNotification(msg);
          },

          // campaign:it_queued — PM approved and forwarded to IT
          "campaign:it_queued": c => {
            patchCampaign(c);
            onNotification(
              `Campaign approved by ${c.performerName || "PM"} — sent to IT`,
            );
          },

          // campaign:it_ack — IT responded (done or not done)
          "campaign:it_ack": c => {
            patchCampaign(c);
            const msg =
              c.acknowledgement === "done"
                ? `${c.performerName || "IT"} completed campaign`
                : `${c.performerName || "IT"} could not complete campaign`;
            onNotification(msg);
          },

          // campaign:deleted — someone removed a campaign
          "campaign:deleted": d => {
            useCampaignStore.setState(s => ({
              campaigns: s.campaigns.filter(x => x._id !== d._id),
            }));
          },
        }
      : {},
  );

  return { campaigns, getCampaign, createCampaign, updateCampaign, addCampaign, patchCampaign };
};