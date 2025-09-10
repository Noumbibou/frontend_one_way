import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import "./RecruiterDashboard.css";
import { fetchCampaigns } from "../../services/campaigns";
import InviteModal from "../../components/InviteModal"; // add this import

export default function RecruiterDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const { logout, user } = useAuth();
  const nav = useNavigate();

  // show success message passed via navigation state
  const location = useLocation();
  const [banner, setBanner] = useState(location.state?.success || null);

  const [showInvite, setShowInvite] = useState(false); // { changed code }
  const [selectedCampaignId, setSelectedCampaignId] = useState(null); // { changed code }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get("hiring-managers/dashboard/");
        setMetrics(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Erreur lors du chargement des données");
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (location.state?.success) {
      setBanner(location.state.success);
      // remove state from history to avoid showing again on back/refresh
      try {
        window.history.replaceState({}, document.title);
      } catch (e) {}
      const t = setTimeout(() => setBanner(null), 6000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line
  }, [location.state]);

  useEffect(() => {
    // fetch campaigns list for this recruiter
    const loadCampaigns = async () => {
      try {
        setCampaignsLoading(true);
        const data = await fetchCampaigns();
        // API may return { results: [...], count: ... } or an array
        const list = Array.isArray(data) ? data : data.results || [];
        setCampaigns(list);
      } catch (err) {
        console.error("Erreur chargement campagnes:", err);
        setCampaigns([]);
      } finally {
        setCampaignsLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <LoadingSpinner size="large" />
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <div className="error-icon">⚠️</div>
          <h3>Erreur de chargement</h3>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {banner && (
        <div
          style={{
            background: "#e6ffed",
            border: "1px solid #b7f2c6",
            padding: 12,
            borderRadius: 6,
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#065f32" }}>{banner}</div>
          <button
            onClick={() => setBanner(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#065f32",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="dashboard-content">
        {/* Mes campagnes */}
        <section style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2 className="section-title">Mes campagnes</h2>
            <div>
              <button
                className="btn"
                onClick={() => nav("/recruiter/campaigns/create")}
              >
                Créer
              </button>
            </div>
          </div>

          {campaignsLoading ? (
            <div style={{ padding: 16 }}>
              <LoadingSpinner /> Chargement des campagnes...
            </div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: 16 }}>
              <p>Aucune campagne trouvée.</p>
              <Link
                to="/recruiter/campaigns/create"
                className="btn btn-primary"
              >
                Créer une campagne
              </Link>
            </div>
          ) : (
            <div
              className="campaigns-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                gap: 12,
              }}
            >
              {campaigns.map((c) => (
                <div
                  key={c.id || c.slug}
                  className="campaign-card"
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: "#fff",
                    border: "1px solid #eef2f7",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16 }}>
                        {c.title || c.name || "—"}
                      </h3>
                      <div
                        style={{
                          color: "#64748b",
                          fontSize: 13,
                        }}
                      >
                        {c.description
                          ? c.description.slice(0, 100) +
                            (c.description.length > 100 ? "…" : "")
                          : "Pas de description"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: c.is_active ? "#0b5ed7" : "#999",
                        }}
                      >
                        {c.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <Link
                      to={`/recruiter/campaigns/${c.id || c.slug}`}
                      className="btn btn-ghost"
                    >
                      Voir
                    </Link>
                    <Link
                      to={`/recruiter/campaigns/${c.id || c.slug}/edit`}
                      className="btn"
                    >
                      Modifier
                    </Link>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedCampaignId(c.id || c.slug);
                        setShowInvite(true);
                      }}
                    >
                      Inviter
                    </button>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      color: "#666",
                    }}
                  >
                    {c.start_date
                      ? `Débute: ${new Date(c.start_date).toLocaleDateString()}`
                      : ""}
                    {c.end_date
                      ? ` · Termine: ${new Date(c.end_date).toLocaleDateString()}`
                      : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Existing sections (metrics, actions, activity...) follow */}
        {/* Welcome section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>Bonjour, {user?.name || "Recruteur"} 👋</h1>
            <p>Voici votre aperçu des performances et activités récentes</p>
          </div>
          <div className="welcome-illustration">
            <span className="illustration-icon">📊</span>
          </div>
        </div>

        {/* Metrics grid */}
        <section className="metrics-section">
          <h2 className="section-title">Aperçu des performances</h2>
          <div className="metrics-grid">
            <div className="metric-card metric-card-primary">
              <div className="metric-icon">🎯</div>
              <div className="metric-content">
                <div className="metric-value">
                  {metrics.total_campaigns ?? "—"}
                </div>
                <div className="metric-label">Campagnes totales</div>
              </div>
            </div>

            <div className="metric-card metric-card-success">
              <div className="metric-icon">🔥</div>
              <div className="metric-content">
                <div className="metric-value">
                  {metrics.active_campaigns ?? "—"}
                </div>
                <div className="metric-label">Campagnes actives</div>
              </div>
            </div>

            <div className="metric-card metric-card-info">
              <div className="metric-icon">👥</div>
              <div className="metric-content">
                <div className="metric-value">
                  {metrics.total_candidates ?? "—"}
                </div>
                <div className="metric-label">Candidats total</div>
              </div>
            </div>

            <div className="metric-card metric-card-warning">
              <div className="metric-icon">✅</div>
              <div className="metric-content">
                <div className="metric-value">
                  {metrics.completed_interviews ?? "—"}
                </div>
                <div className="metric-label">Entretiens complétés</div>
              </div>
            </div>

            <div className="metric-card metric-card-accent">
              <div className="metric-icon">⭐</div>
              <div className="metric-content">
                <div className="metric-value">
                  {metrics.average_rating
                    ? `${metrics.average_rating}/5`
                    : "—"}
                </div>
                <div className="metric-label">Note moyenne</div>
              </div>
            </div>

            <div className="metric-card metric-card-purple">
              <div className="metric-icon">🎥</div>
              <div className="metric-content">
                <div className="metric-value">
                  {metrics.open_sessions ?? "—"}
                </div>
                <div className="metric-label">Sessions en cours</div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="actions-section">
          <h2 className="section-title">Actions rapides</h2>
          <div className="actions-grid">
            <Link to="/recruiter/campaigns" className="action-card">
              <div className="action-icon">📋</div>
              <div className="action-content">
                <h3>Gérer les campagnes</h3>
                <p>Créez et modifiez vos campagnes de recrutement</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/recruiter/sessions" className="action-card">
              <div className="action-icon">🎥</div>
              <div className="action-content">
                <h3>Voir les sessions</h3>
                <p>Consultez les sessions d'entretien en cours</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/recruiter/candidates" className="action-card">
              <div className="action-icon">👤</div>
              <div className="action-content">
                <h3>Candidats</h3>
                <p>Gérez votre pool de candidats</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/recruiter/analytics" className="action-card">
              <div className="action-icon">📈</div>
              <div className="action-content">
                <h3>Analytiques</h3>
                <p>Analyses détaillées des performances</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          </div>
        </section>

        {/* Recent activity */}
        <section className="activity-section">
          <div className="section-header">
            <h2 className="section-title">Activité récente</h2>
            <Link to="/recruiter/activity" className="view-all-link">
              Voir tout →
            </Link>
          </div>

          <div className="activity-list">
            {(metrics.recent_activity || [])
              .slice(0, 6)
              .map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">
                      {activity.title || activity.description || "Nouvelle activité"}
                    </div>
                    <div className="activity-meta">
                      <span className="activity-time">
                        {formatTime(activity.created_at)}
                      </span>
                      {activity.campaign && (
                        <span className="activity-campaign">
                          {activity.campaign}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="activity-badge">
                    {getActivityBadge(activity.type)}
                  </div>
                </div>
              ))}

            {(!metrics.recent_activity ||
              metrics.recent_activity.length === 0) && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>Aucune activité récente</h3>
                <p>Les activités apparaîtront ici</p>
              </div>
            )}
          </div>
        </section>

        {/* Stats chart (placeholder) */}
        <section className="stats-section">
          <h2 className="section-title">Performances mensuelles</h2>
          <div className="stats-placeholder">
            <div className="stats-placeholder-content">
              <span className="stats-icon">📈</span>
              <p>Graphique de performances</p>
              <small>Intégration analytics à venir</small>
            </div>
          </div>
        </section>

        {/* render InviteModal when requested */}
        {showInvite && selectedCampaignId && (
          <InviteModal
            campaignId={selectedCampaignId}
            onClose={() => {
              setShowInvite(false);
              setSelectedCampaignId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Helper functions
function getActivityIcon(type) {
  const icons = {
    campaign: "🎯",
    candidate: "👤",
    interview: "🎥",
    evaluation: "⭐",
    default: "🔔",
  };
  return icons[type] || icons.default;
}

function getActivityBadge(type) {
  const badges = {
    campaign: "Campagne",
    candidate: "Candidat",
    interview: "Entretien",
    evaluation: "Évaluation",
    default: "Activité",
  };
  return badges[type] || badges.default;
}

function formatTime(timestamp) {
  if (!timestamp) return "Récemment";

  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours}h`;
  if (hours < 48) return "Hier";

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}