// ...new file...
import api from "./api";

/**
 * Helpers pour sessions
 */
export async function fetchSessions(params = {}) {
  return api.get("sessions/", { params }).then((r) => r.data);
}

export async function fetchSession(id) {
  return api.get(`sessions/${id}/`).then((r) => r.data);
}

// Fetch all sessions by following DRF pagination 'next' links
export async function fetchAllSessions(params = {}) {
  const all = [];
  // First page
  let { data } = await api.get("sessions/", { params });
  if (Array.isArray(data)) {
    // Unpaginated response (unlikely with current backend), just return it
    return data;
  }
  if (Array.isArray(data.results)) {
    all.push(...data.results);
  }
  // Follow next links
  let next = data.next;
  while (next) {
    const resp = await api.get(next);
    const page = resp.data;
    if (Array.isArray(page.results)) {
      all.push(...page.results);
    }
    next = page.next;
  }
  return all;
}

// Fetch sessions for a specific campaign using the dedicated endpoint
export async function fetchSessionsForCampaign(campaignId) {
  if (!campaignId) return [];
  try {
    // Uses the custom action defined on VideoCampaignViewSet: /campaigns/{id}/sessions/
    const { data } = await api.get(`campaigns/${campaignId}/sessions/`);
    // Normalize
    const arr = Array.isArray(data?.sessions) ? data.sessions : (Array.isArray(data) ? data : []);
    if (Array.isArray(arr)) return arr;
  } catch (_) {
    // ignore and try fallback
  }
  // Fallback to generic list with filter param if backend supports it
  try {
    const { data } = await api.get('sessions/', { params: { campaign: campaignId } });
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
  } catch (_) {}
  return [];
}