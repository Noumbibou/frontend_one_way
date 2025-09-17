import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { fetchCampaign } from "../../services/campaigns";
import LoadingSpinner from "../../components/LoadingSpinner";
import InviteModal from "../../components/InviteModal";
import "./CampaignDetail.css"; // Fichier CSS pour les styles

export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchCampaign(id);
        setCampaign(data);
      } catch (err) {
        console.error("Erreur fetch campaign:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // If navigated with state { openInvite: true }, open the modal automatically
  useEffect(() => {
    if (location.state && location.state.openInvite) {
      setShowInvite(true);
    }
  }, [location.state]);

  if (loading) return (
    <div className="campaign-detail-loading">
      <LoadingSpinner />
      <p>Chargement de la campagne...</p>
    </div>
  );
  
  if (!campaign) return (
    <div className="campaign-detail-error">
      <div className="error-content">
        <h2>Campagne introuvable</h2>
        <p>La campagne que vous recherchez n'existe pas ou a été supprimée.</p>
        <button className="btn btn-primary" onClick={() => nav(-1)}>
          Retour
        </button>
      </div>
    </div>
  );

  const isExpired = (Boolean(campaign.end_date) && new Date(campaign.end_date) < new Date());
  const isDisabled = isExpired || !campaign.is_active;

  // Compute stats from campaign.sessions
  const sessions = Array.isArray(campaign.sessions) ? campaign.sessions : [];
  const invitedCount = sessions.length;
  const respondersCount = sessions.filter(s => (s?.responses_count || 0) > 0).length;
  const responseRate = invitedCount ? Math.round((respondersCount / invitedCount) * 100) : 0;

  return (
    <div className="campaign-detail-container">
      <div className="campaign-header">
        <div className="campaign-info">
          <div className="campaign-status">
            <span className={`status-badge ${campaign.is_active ? 'active' : 'inactive'}`}>
              {campaign.is_active ? 'Active' : 'Inactive'}
            </span>
            {isExpired && <span className="status-badge expired">Expirée</span>}
          </div>
          <h1>{campaign.title}</h1>
          <p className="campaign-description">{campaign.description}</p>
          
          <div className="campaign-meta">
            {campaign.start_date && (
              <div className="meta-item">
                <span className="meta-label">Début:</span>
                <span className="meta-value">{new Date(campaign.start_date).toLocaleDateString()}</span>
              </div>
            )}
            {campaign.end_date && (
              <div className="meta-item">
                <span className="meta-label">Fin:</span>
                <span className="meta-value">{new Date(campaign.end_date).toLocaleDateString()}</span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-label">Questions:</span>
              <span className="meta-value">{campaign.total_questions ?? campaign.questions?.length ?? 0}</span>
            </div>
          </div>
        </div>
        
        <div className="campaign-actions">
          <button
            className={`btn btn-primary ${isDisabled ? 'disabled' : ''}`}
            disabled={isDisabled}
            title={isDisabled ? "Campagne expirée ou inactive" : ""}
            onClick={() => setShowInvite(true)}
          >
            <span className="icon">✉️</span>
            Inviter des participants
          </button>
          <button
            className="btn btn-primary"
            onClick={() =>
              nav(`/recruiter/sessions?campaign=${id}&campaignTitle=${encodeURIComponent(campaign.title || '')}`,
                { state: { campaignTitle: campaign.title || '' } }
              )
            }
            title="Afficher toutes les sessions liées à cette campagne"
          >
            <span className="icon">🎥</span>
            Voir les sessions
          </button>
          
          <button className="btn btn-secondary" onClick={() => nav(-1)}>
            <span className="icon">←</span>
            Retour
          </button>
        </div>
      </div>

      <div className="campaign-content">
        <section className="questions-section">
          <div className="section-header">
            <h2>Questions de la campagne</h2>
            <span className="questions-count">
              {campaign.total_questions ?? campaign.questions?.length ?? 0} questions
            </span>
          </div>
          
          <div className="questions-list">
            {(campaign.questions || []).map((q, idx) => (
              <div key={idx} className="question-card">
                <div className="question-number">{idx + 1}</div>
                <div className="question-content">
                  <h3>{q.text || q.prompt || 'Question sans titre'}</h3>
                  {q.description && <p className="question-description">{q.description}</p>}
                </div>
              </div>
            ))}
            
            {(!campaign.questions || campaign.questions.length === 0) && (
              <div className="empty-state">
                <p>Aucune question n'a été ajoutée à cette campagne.</p>
              </div>
            )}
          </div>
        </section>
        
        <section className="campaign-stats">
          <h2>Statistiques</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{invitedCount}</div>
              <div className="stat-label">Participants invités</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{respondersCount}</div>
              <div className="stat-label">Réponses reçues</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{responseRate}%</div>
              <div className="stat-label">Taux de réponse</div>
            </div>
          </div>
        </section>
      </div>

      {showInvite && <InviteModal campaignId={id} onClose={() => setShowInvite(false)} />}
    </div>
  );
}