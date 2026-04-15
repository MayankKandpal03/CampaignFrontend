/**
 * services/index.js — barrel file.
 *
 * import { login, logout }                   from "../services";
 * import { fetchCampaigns, updateCampaign }  from "../services";
 * import { createUser, deleteUser }          from "../services";
 */
export * from "./authService.js";
export * from "./campaignService.js";
export * from "./userService.js";
