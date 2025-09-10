import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import { fetchSessions } from "../../services/sessions";
import { useAuth } from "../../contexts/AuthContext";

export default function SessionList() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // tente de déterminer l'id du recruteur dans plusieurs clés possibles
        const recruiterId =
          user?.id ||
          user?.user_id ||
          user?.user_profile_id ||
          user?.profile_id ||
          user?.pk ||
          (user?.user && (user.user.id || user.user.user_id || user.user.user_profile_id));

        console.log("DEBUG: resolved recruiterId:", recruiterId);

        let data;
        if (recruiterId) {
          // appel avec filtre si on a un id
          data = await fetchSessions({ hiring_manager: recruiterId });
        } else {
          // fallback : appelle sans filtre (le backend doit renvoyer les sessions autorisées pour request.user)
          data = await fetchSessions();
        }

        const list = Array.isArray(data) ? data : (data?.results || []);
        setSessions(list || []);
      } catch (err) {
        setError(err?.response?.data || err.message || "Erreur chargement sessions");
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <div style={{ padding: 20 }}><LoadingSpinner /> Chargement des sessions...</div>;
  if (error) return <div style={{ padding: 20, color: "crimson" }}>{typeof error === "string" ? error : JSON.stringify(error)}</div>;

  return (
    <div style={{ padding: 8 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Sessions</h2>
      </header>

      {sessions.length === 0 ? (
        <div style={{ padding: 12 }}>Aucune session trouvée pour ce recruteur.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {sessions.map((s) => (
            <div key={s.id || s.access_token} style={{ padding: 12, borderRadius: 8, background: "#fff", border: "1px solid #eef2f7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{s.candidate_name || (s.candidate && `${s.candidate.first_name || ""} ${s.candidate.last_name || ""}`) || "Invité"}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>
                  {s.campaign_title || (s.campaign && s.campaign.title) || "Campagne inconnue"}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                  {s.status ? `Statut: ${s.status}` : ""}
                  {s.invited_at ? ` · Invité: ${new Date(s.invited_at).toLocaleString()}` : ""}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => nav(`/recruiter/sessions/${s.id || s.access_token}`)}>Voir</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}