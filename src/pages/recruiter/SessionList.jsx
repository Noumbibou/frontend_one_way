import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import { fetchAllSessions, fetchSessionsForCampaign } from "../../services/sessions";
import { useAuth } from "../../contexts/AuthContext";
import { Card, Badge, Button } from "react-bootstrap";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import "./SessionList.css";
export default function SessionList() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const nav = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const campaignFilter = searchParams.get('campaign');
  const campaignTitleFromQuery = searchParams.get('campaignTitle');
  const campaignTitleFromState = location.state && location.state.campaignTitle;
  const effectiveCampaignTitle = campaignTitleFromState || campaignTitleFromQuery;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const recruiterId =
          user?.id ||
          user?.user_id ||
          user?.user_profile_id ||
          user?.profile_id ||
          user?.pk ||
          (user?.user && (user.user.id || user.user.user_id || user.user.user_profile_id));

        const params = {};
        if (statusFilter && statusFilter !== 'all') {
          params.status = statusFilter;
        }
        if (campaignFilter) {
          params.campaign = campaignFilter;
        }
        const list = campaignFilter
          ? await fetchSessionsForCampaign(campaignFilter)
          : await fetchAllSessions(params);
        setSessions(list || []);
      } catch (err) {
        setError(err?.response?.data || err.message || "Erreur chargement sessions");
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, statusFilter, campaignFilter]);

  const getStatusVariant = (status) => {
    const variants = {
      invited: "secondary",
      in_progress: "warning",
      completed: "success",
      expired: "danger",
      cancelled: "dark",
      default: "light"
    };
    return variants[status] || variants.default;
  };

  const getStatusLabel = (status) => {
    const labels = {
      invited: "Invité",
      in_progress: "En Cours",
      completed: "Terminé",
      expired: "Expiré",
      cancelled: "Annulé"
    };
    return labels[status] || status;
  };

  if (loading) return (
    <div className="sessions-loading">
      <div className="loading-content">
        <LoadingSpinner />
        <p className="loading-text">Chargement des sessions...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="sessions-error">
      <div className="error-content">
        <div className="error-icon">⚠️</div>
        <h3 className="error-title">Erreur de chargement</h3>
        <p className="error-message">
          {typeof error === "string" ? error : "Une erreur s'est produite"}
        </p>
        <Button 
          variant="outline-primary" 
          onClick={() => window.location.reload()}
          className="retry-btn"
        >
          Réessayer
        </Button>
      </div>
    </div>
  );

  return (
    <div className="sessions-container">
      <div className="sessions-content">
        {/* Header Section */}
        <div className="sessions-header">
          <div className="header-main">
            <h1 className="page-title">Gestion des Sessions</h1>
            <p className="page-subtitle">
              Suivez les entretiens et accédez aux réponses vidéo de vos candidats
              {campaignFilter ? (
                <>
                  {" "}
                  <strong>
                    (Filtré par campagne {effectiveCampaignTitle ? `"${effectiveCampaignTitle}"` : `#${campaignFilter}`})
                  </strong>
                </>
              ) : null}
            </p>
          </div>
          
          <div className="header-filters">
            <div className="filter-group" style={{ minWidth: 260 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="statusFilter-label" sx={{ color: 'text.primary' }}>Filtrer par statut</InputLabel>
                <Select
                  labelId="statusFilter-label"
                  id="statusFilter"
                  value={statusFilter}
                  label="Filtrer par statut"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  MenuProps={{ PaperProps: { className: 'menu-paper-dark' } }}
                >
                  <MenuItem value="all">Toutes les sessions</MenuItem>
                  <MenuItem value="invited">Invité</MenuItem>
                  <MenuItem value="in_progress">En cours</MenuItem>
                  <MenuItem value="completed">Terminé</MenuItem>
                  <MenuItem value="expired">Expiré</MenuItem>
                  <MenuItem value="cancelled">Annulé</MenuItem>
                </Select>
              </FormControl>
            </div>
            {campaignFilter && (
              <Button
                variant="outline-secondary"
                className="ms-2"
                onClick={() => nav('/recruiter/sessions')}
              >
                Effacer le filtre campagne
              </Button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="empty-sessions">
            <div className="empty-icon">🎥</div>
            <h3 className="empty-title">Aucune session trouvée</h3>
            <p className="empty-message">
              {statusFilter === 'all' 
                ? "Aucune session d'entretien n'a été créée pour le moment" 
                : `Aucune session avec le statut "${getStatusLabel(statusFilter)}"`
              }
            </p>
          </div>
        ) : (
          <div className="sessions-grid">
            {sessions.map((session) => {
              const candidateName = session.candidate_name || 
                (session.candidate && `${session.candidate.first_name || ""} ${session.candidate.last_name || ""}`) || 
                "Candidat";
              
              const campaignTitle = effectiveCampaignTitle || session.campaign_title || 
                (session.campaign && session.campaign.title) || 
                "Campagne sans nom";

              return (
                <div className="session-card" key={session.id || session.access_token}>
                  <div className="card-header">
                    <div className="candidate-info">
                      <h3 className="candidate-name">{candidateName}</h3>
                      <Badge 
                        bg={getStatusVariant(session.status)} 
                        className="status-badge"
                      >
                        {getStatusLabel(session.status)}
                      </Badge>
                    </div>
                    <p className="campaign-title">{campaignTitle}</p>
                  </div>

                  <div className="card-body">
                    <div className="session-meta">
                      {session.invited_at && (
                        <div className="meta-item">
                          <span className="meta-label">Invité le :</span>
                          <span className="meta-value">
                            {new Date(session.invited_at).toLocaleString('fr-FR', {
                              year: 'numeric', month: '2-digit', day: '2-digit',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      
                      {session.started_at && (
                        <div className="meta-item">
                          <span className="meta-label">Débuté le :</span>
                          <span className="meta-value">
                            {new Date(session.started_at).toLocaleString('fr-FR', {
                              year: 'numeric', month: '2-digit', day: '2-digit',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      
                      {session.completed_at && (
                        <div className="meta-item">
                          <span className="meta-label">Terminé le :</span>
                          <span className="meta-value">
                            {new Date(session.completed_at).toLocaleString('fr-FR', {
                              year: 'numeric', month: '2-digit', day: '2-digit',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {session.answered_questions !== undefined && session.total_questions !== undefined && (
                      <div className="progress-section">
                        <div className="progress-header">
                          <span className="progress-label">Progression</span>
                          <span className="progress-value">
                            {session.answered_questions} / {session.total_questions} questions
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${(session.answered_questions / session.total_questions) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {session.status === 'cancelled' && (
                      <p className="status-note cancelled-note">
                        Annulée (lien expiré/invalide et réponses incomplètes)
                      </p>
                    )}
                  </div>

                  <div className="card-footer">
                    <Button 
                      variant="primary" 
                      className="view-btn"
                      onClick={() => nav(`/recruiter/sessions/${session.id || session.access_token}`)}
                    >
                      Voir les réponses
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}