import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { fetchCampaigns } from "../../services/campaigns";
import InviteModal from "../../components/InviteModal";
import { WelcomeSection } from "../../components/Dashboard/WelcomeSection";
import "../../App.css";

export default function RecruiterDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState('all'); // all | active | inactive
  const { user } = useAuth();

  const location = useLocation();
  const [banner, setBanner] = useState(location.state?.success || null);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [toast, setToast] = useState(null); // { message }
  const [derivedAvgCompletion, setDerivedAvgCompletion] = useState(null);

  const showToast = (message) => {
    setToast({ message });
    window.setTimeout(() => setToast(null), 1000);
  };

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

  // Fallback: compute completion from sessions if backend metric is 0/absent
  useEffect(() => {
    const computeFromSessions = async () => {
      try {
        const res = await api.get("sessions/");
        const list = Array.isArray(res.data) ? res.data : (res.data.results || []);
        if (!Array.isArray(list) || list.length === 0) {
          setDerivedAvgCompletion(0);
          return;
        }
        const values = list.map(s => {
          const answered = Number(s.answered_questions ?? s.answers_count ?? 0);
          const total = Number(s.total_questions ?? s.questions_count ?? 0);
          return total > 0 ? (answered / total) * 100 : null;
        }).filter(v => v !== null);
        const avg = values.length ? Math.round(values.reduce((a,b)=>a+b,0) / values.length) : 0;
        setDerivedAvgCompletion(avg);
      } catch (e) {
        console.warn("Impossible de calculer le taux de complétion depuis les sessions", e);
        setDerivedAvgCompletion(null);
      }
    };

    // Only compute if missing or zero
    if (!metrics || !metrics.avg_completion_rate || Number(metrics.avg_completion_rate) === 0) {
      computeFromSessions();
    }
  }, [metrics]);

  useEffect(() => {
    if (location.state?.success) {
      setBanner(location.state.success);
      try {
        window.history.replaceState({}, document.title);
      } catch (e) {}
      const t = setTimeout(() => setBanner(null), 6000);
      return () => clearTimeout(t);
    }
  }, [location.state]);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setCampaignsLoading(true);
        const params = {};
        if (activityFilter === 'active') params.is_active = true;
        if (activityFilter === 'inactive') params.is_active = false;
        const data = await fetchCampaigns(params);
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
  }, [activityFilter]);

  if (loading) {
    return (
      <div className="dashboard-container text-center py-4">
        <LoadingSpinner size="large" />
        <div className="mt-2 text-muted">Chargement des données...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container py-4">
        <div className="card error-card">
          <div className="card-header">
            <strong>Erreur de chargement</strong>
          </div>
          <div className="card-body">
            <p>{error}</p>
            <button
              className="btn btn-danger"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container allow-hover">
      <div className="dashboard-content">
        {toast && (
          <div className="toast-notice" role="status" aria-live="polite">{toast.message}</div>
        )}
        {banner && (
          <div className="alert alert-success mb-4">{banner}</div>
        )}

        {/* Welcome Section */}
        <div className="mb-4">
          <WelcomeSection 
            userName={user?.first_name || user?.username || user?.email}
            firstName={user?.first_name}
          />
        </div>

        {/* Metrics */}
        {metrics && (
          <section>
            <h3 className="section-title">Performances Globales</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">
                  {metrics.total_campaigns || 0}
                </div>
                <div className="metric-label">Campagnes Actives</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">
                  {metrics.total_candidates || 0}
                </div>
                <div className="metric-label">Candidats Total</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">
                  {metrics.completed_interviews || 0}
                </div>
                <div className="metric-label">Entretiens Complétés</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">
                  {metrics?.avg_completion_rate && Number(metrics.avg_completion_rate) > 0
                    ? Math.round(metrics.avg_completion_rate)
                    : (derivedAvgCompletion ?? 0)}%
                </div>
                <div className="metric-label">Taux de Complétion</div>
              </div>
            </div>
          </section>
        )}

        {/* Actions */}
        <section className="actions-section">
          <div className="section-header">
            <h3 className="section-title">Actions Rapides</h3>
          </div>
          <div className="actions-grid">
            <Link to="/recruiter/campaigns" className="action-card">
              <div className="action-icon">📋</div>
              <div>
                <h3>Gérer les campagnes</h3>
                <p>Créez et modifiez vos campagnes d'entretien</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/recruiter/sessions" className="action-card">
              <div className="action-icon">🎥</div>
              <div>
                <h3>Voir les sessions</h3>
                <p>Suivez les entretiens en cours</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/recruiter/candidates" className="action-card">
              <div className="action-icon">👤</div>
              <div>
                <h3>Candidats</h3>
                <p>Gérez votre pool de talents</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/recruiter/analytics" className="action-card">
              <div className="action-icon">📈</div>
              <div>
                <h3>Analytiques</h3>
                <p>Mesures de performance détaillées</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          </div>
        </section>

        {/* Campaigns */}
        <section className="campaigns-section">
          <div className="section-header d-flex align-items-center gap-2">
            <h3 className="section-title mb-0">Mes Campagnes</h3>
            <div className="ms-auto d-flex align-items-center gap-2">
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="activityFilter-label" sx={{ color: 'text.primary' }}>Activité</InputLabel>
                <Select
                  labelId="activityFilter-label"
                  id="activityFilter"
                  value={activityFilter}
                  label="Activité"
                  onChange={(e) => setActivityFilter(e.target.value)}
                  MenuProps={{
                    PaperProps: { className: 'menu-paper-dark' },
                  }}
                >
                  <MenuItem value="all">Toutes</MenuItem>
                  <MenuItem value="active">Actives</MenuItem>
                  <MenuItem value="inactive">Inactives</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          {campaignsLoading ? (
            <div className="card text-center p-4">
              <LoadingSpinner />
              <p className="mt-2 text-muted">Chargement des campagnes...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="card text-center p-4 empty-state">
              <div className="empty-icon">📁</div>
              <h3>Aucune campagne trouvée</h3>
              <p>Commencez par créer votre première campagne d'entretien</p>
              <Link to="/recruiter/campaigns/create" className="btn btn-primary mt-2">
                Créer une campagne
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="campaign-card card h-100">
                  <div className="card-header flex justify-between items-center">
                    <span className="fw-semibold text-truncate">
                      {campaign.title || "Sans titre"}
                    </span>
                    <span className={`badge ${campaign.is_active ? "bg-success" : "bg-secondary"}`}>
                      {campaign.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="card-body">
                    <p className="mb-3 small" style={{ color: 'var(--text-on-card)' }}>
                      <span>description : </span>
                      {campaign.description
                        ? campaign.description.length > 100
                          ? `${campaign.description.substring(0, 100)}...`
                          : campaign.description
                        : "Aucune description"}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Link to={`/recruiter/campaigns/${campaign.id}`} className="btn btn-outline-primary btn-sm">
                        Voir
                      </Link>
                      <button
                        className={`btn btn-outline-primary btn-sm invite-btn ${((Boolean(campaign.end_date) && new Date(campaign.end_date) < new Date()) || !campaign.is_active) ? 'invite-disabled' : ''}`}
                        aria-disabled={(Boolean(campaign.end_date) && new Date(campaign.end_date) < new Date()) || !campaign.is_active}
                        title={((Boolean(campaign.end_date) && new Date(campaign.end_date) < new Date()) || !campaign.is_active) ? "Campagne expirée ou inactive" : ""}
                        onClick={() => {
                          const isDisabled = ((Boolean(campaign.end_date) && new Date(campaign.end_date) < new Date()) || !campaign.is_active);
                          if (isDisabled) {
                            showToast("Impossible d'inviter car la campagne est arrivée à sa date d'expiration.");
                            return;
                          }
                          setSelectedCampaignId(campaign.id);
                          setShowInvite(true);
                        }}
                      >
                        Inviter
                      </button>
                    </div>
                  </div>
                  <div className="card-footer small flex justify-between" style={{ color: 'var(--text-on-card)' }}>
                    <span>date de validité : </span>
                    <span>
                      du {campaign.start_date && new Date(campaign.start_date).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} 
                    </span>
                    <span> au </span>
                    <span> 
                      {campaign.end_date && new Date(campaign.end_date).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Invite Modal */}
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
