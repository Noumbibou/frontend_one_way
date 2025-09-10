import api from "./api";

/**
 * Helpers to interact with campaign endpoints.
 */

export async function fetchCampaigns(params = {}) {
  return api.get("campaigns/", { params }).then((r) => r.data);
}

export async function fetchCampaign(id) {
  return api.get(`campaigns/${id}/`).then((r) => r.data);
}

export async function createCampaign(payload) {
  return api.post("campaigns/", payload).then((r) => r.data);
}

export async function updateCampaign(id, payload) {
  return api.patch(`campaigns/${id}/`, payload).then((r) => r.data);
}

export async function inviteCandidate(campaignId, payload) {
  return api.post(`campaigns/${campaignId}/invite-candidate/`, payload).then((r) => r.data);
}