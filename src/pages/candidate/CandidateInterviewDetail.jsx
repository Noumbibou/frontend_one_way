import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { candidateApi } from '../../services/candidate';
import './CandidateInterviewDetail.css';

export default function CandidateInterviewDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await candidateApi.getInterview(id);
        setData(resp);
      } catch (e) {
        setError(e?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="interview-detail-container allow-hover">
        <div className="interview-detail-content">
          <div className="card text-center p-4">
            <div className="spinner-border" role="status" />
            <p className="mt-2 text-muted">Chargement des détails…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interview-detail-container allow-hover">
        <div className="interview-detail-content">
          <div className="card error-card">
            <div className="card-header"><strong>Erreur</strong></div>
            <div className="card-body">
              <p>{error}</p>
              <Link to="/candidate/dashboard" className="btn btn-primary">Retour au dashboard</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="interview-detail-container allow-hover">
      <div className="interview-detail-content">
        <header className="interview-detail-header">
          <div>
            <h1 className="page-title">{data.campaign?.title || 'Entretien'}</h1>
            <p className="page-subtitle">Détails de l'entretien et évaluations</p>
          </div>
          <Link to="/candidate/dashboard" className="btn btn-outline-secondary">← Retour</Link>
        </header>

        {/* Campaign Info */}
        <div className="card mb-3">
          <div className="card-header">
            <h5>Informations sur la campagne</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>Titre:</strong> {data.campaign?.title}</p>
                {data.campaign?.description && <p><strong>Description:</strong> {data.campaign.description}</p>}
              </div>
              <div className="col-md-6">
                <p><strong>Date de début:</strong> {data.campaign?.start_date ? new Date(data.campaign.start_date).toLocaleString('fr-FR') : '-'}</p>
                <p><strong>Date de fin:</strong> {data.campaign?.end_date ? new Date(data.campaign.end_date).toLocaleString('fr-FR') : '-'}</p>
                <p><strong>Statut de la session:</strong> <span className={`badge ${data.status === 'completed' ? 'bg-success' : 'bg-warning'}`}>{data.status}</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions & Responses */}
        {data.questions && data.questions.length > 0 ? (
          <div className="questions-section">
            <h3 className="section-title">Questions et réponses</h3>
            <div className="questions-grid">
              {data.questions.map((q) => {
                const response = data.responses?.find(r => r.question_id === q.id);
                return (
                  <div key={q.id} className="card question-card">
                    <div className="card-header">
                      <h6>Question {q.order}</h6>
                    </div>
                    <div className="card-body">
                      <p className="question-text">{q.text}</p>

                      {response ? (
                        <div className="response-section">
                          <div className="video-player">
                            {response.video_url ? (
                              <video
                                controls
                                width="100%"
                                height="200"
                                src={response.video_url}
                                poster="/video-poster.jpg"
                              >
                                Votre navigateur ne supporte pas la lecture vidéo.
                              </video>
                            ) : (
                              <div className="no-video">Aucune vidéo disponible</div>
                            )}
                          </div>

                          <div className="response-meta">
                            <small className="text-muted">
                              Enregistrée le: {new Date(response.recorded_at).toLocaleString('fr-FR')}
                              {response.duration && ` • Durée: ${Math.floor(response.duration / 60)}:${(response.duration % 60).toString().padStart(2, '0')}`}
                            </small>
                          </div>

                          {/* Evaluations */}
                          {response.evaluations && response.evaluations.length > 0 && (
                            <div className="evaluations-section">
                              <h6>Évaluations ({response.evaluations.length})</h6>
                              <div className="evaluations-list">
                                {response.evaluations.map((evaluation) => (
                                  <div key={evaluation.id} className="evaluation-item">
                                    <div className="evaluation-header">
                                      <span className="evaluation-score">
                                        Note globale: <strong>{evaluation.overall_score}/5</strong>
                                      </span>
                                      <small className="text-muted">
                                        Évalué le: {new Date(evaluation.evaluated_at).toLocaleString('fr-FR')}
                                      </small>
                                    </div>

                                    <div className="evaluation-criteria">
                                      {evaluation.technical_skill && (
                                        <div>Technique: <span className="badge bg-info">{evaluation.technical_skill}★</span></div>
                                      )}
                                      {evaluation.communication && (
                                        <div>Communication: <span className="badge bg-info">{evaluation.communication}★</span></div>
                                      )}
                                      {evaluation.motivation && (
                                        <div>Motivation: <span className="badge bg-info">{evaluation.motivation}★</span></div>
                                      )}
                                      {evaluation.cultural_fit && (
                                        <div>Adéquation: <span className="badge bg-info">{evaluation.cultural_fit}★</span></div>
                                      )}
                                    </div>

                                    {evaluation.notes && (
                                      <div className="evaluation-notes">
                                        <strong>Commentaires:</strong>
                                        <p>{evaluation.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="no-response">
                          <p className="text-muted">Aucune réponse vidéo pour cette question.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body text-center">
              <p>Aucune question trouvée pour cet entretien.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
