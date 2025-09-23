import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { candidateApi } from '../../services/candidate';
import './CandidateDashboard.css';

export default function CandidateDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await candidateApi.listInterviews();
        setItems(Array.isArray(data.interviews) ? data.interviews : []);
      } catch (e) {
        setError(e?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="candidate-dash-container allow-hover">
      <div className="candidate-dash-content">
        <header className="candidate-dash-header">
          <div>
            <h1 className="page-title">Mes entretiens</h1>
            <p className="page-subtitle">Consultez vos entretiens passés et les évaluations associées</p>
          </div>
        </header>

        {loading && (
          <div className="card text-center p-4">
            <div className="spinner-border" role="status" />
            <p className="mt-2 text-muted">Chargement de vos entretiens…</p>
          </div>
        )}

        {!loading && error && (
          <div className="card error-card">
            <div className="card-header"><strong>Erreur</strong></div>
            <div className="card-body">
              <p>{error}</p>
              <button className="btn btn-danger" onClick={() => window.location.reload()}>Réessayer</button>
            </div>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="card text-center p-4 empty-state">
            <div className="empty-icon">🎥</div>
            <h3>Aucun entretien trouvé</h3>
            <p>Les entretiens apparaîtront ici une fois complétés.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="interviews-grid">
            {items.map((it) => (
              <div key={it.id} className="card interview-card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <span className="fw-semibold text-truncate">{it.campaign_title || 'Campagne'}</span>
                  <span className={`badge ${it.status === 'completed' ? 'bg-success' : it.status === 'in_progress' ? 'bg-warning' : 'bg-secondary'}`}>
                    {it.status}
                  </span>
                </div>
                <div className="card-body">
                  <div className="interview-meta">
                    <div>
                      <span className="meta-label">Invité le</span>
                      <span className="meta-value">{it.invited_at ? new Date(it.invited_at).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                    </div>
                    <div>
                      <span className="meta-label">Terminé le</span>
                      <span className="meta-value">{it.completed_at ? new Date(it.completed_at).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                    </div>
                  </div>
                  <p className="small text-muted mb-0">Questions: {it.questions_count || 0}</p>
                </div>
                <div className="card-footer d-flex gap-2">
                  <button className="btn btn-outline-primary" onClick={() => nav(`/candidate/interviews/${it.id}`)}>Voir les détails</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
