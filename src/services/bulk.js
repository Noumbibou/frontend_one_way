import api from "./api";

// Bulk invite multiple candidates at once for a campaign
// candidates: Array<{ email, first_name, last_name, phone?, linkedin_url? }>
export async function bulkInvite(campaignId, candidatesOrBody) {
  const body = Array.isArray(candidatesOrBody)
    ? { candidates: candidatesOrBody }
    : candidatesOrBody;
  const { data } = await api.post(`campaigns/${campaignId}/bulk-invite/`, body);
  return data; // { successes: [...], errors: [...] }
}
