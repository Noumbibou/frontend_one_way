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