import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { fetchCampaigns, fetchCampaign } from "../../services/campaigns";
import "./Analytics.css";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [campaignAnalytics, setCampaignAnalytics] = useState(null);
  const [campaignLoading, setCampaignLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [m, list] = await Promise.all([
          api.get("hiring-managers/dashboard/").then((r) => r.data),
          fetchCampaigns().then((r) => (Array.isArray(r) ? r : r.results || [])),
        ]);
        setMetrics(m);
        setCampaigns(list);
        if (list.length) setSelectedId(list[0]?.id || "");
        setError(null);
      } catch (e) {
        console.error("Analytics init error", e);
        setError("Impossible de charger les données analytiques.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => String(c.id) === String(selectedId)) || null,
    [campaigns, selectedId]
  );

  const loadCampaignAnalytics = async (id) => {
    if (!id) return;
    try {
      setCampaignLoading(true);
      // Endpoint défini côté backend: /api/campaigns/<uuid>/analytics/
      const res = await api.get(`campaigns/${id}/analytics/`);
      setCampaignAnalytics(res.data || null);
    } catch (e) {
      console.error("Campaign analytics error", e);
      setCampaignAnalytics(null);
    } finally {
      setCampaignLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId) loadCampaignAnalytics(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  if (loading) {
    return (
      <div className="analytics-container py-4 text-center">
        <div className="spinner-border" role="status" />
        <div className="text-muted mt-2">Chargement des analytiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container py-4">
        <div className="error-box">
          <div className="mb-2">{error}</div>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-content space-y-4">
        <header className="analytics-header">
          <h2>Analytiques</h2>
          <p>Mesures globales et analytiques par campagne</p>
        </header>

        {metrics && (
          <section>
            <h3 className="section-title">Vue d'ensemble</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{metrics.total_campaigns || 0}</div>
                <div className="metric-label">Campagnes</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{metrics.total_candidates || 0}</div>
                <div className="metric-label">Candidats</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{metrics.completed_interviews || 0}</div>
                <div className="metric-label">Entretiens complétés</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{metrics.avg_completion_rate || 0}%</div>
                <div className="metric-label">Taux de complétion</div>
              </div>
            </div>
          </section>
        )}

        <section className="analytics-section">
          <div className="select-row" style={{ maxWidth: 420 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="campaignSelect-label" sx={{ color: '#fff' }}>Campagne</InputLabel>
              <Select
                labelId="campaignSelect-label"
                id="campaignSelect"
                value={selectedId}
                label="Campagne"
                onChange={(e) => setSelectedId(e.target.value)}
                MenuProps={{ PaperProps: { className: 'menu-paper-dark' } }}
              >
                {campaigns.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.title || c.id}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <div className="mt-3">
            {campaignLoading ? (
              <div className="loading-box">Chargement...</div>
            ) : campaignAnalytics ? (
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-value">{campaignAnalytics.total_candidates ?? 0}</div>
                  <div className="metric-label">Candidats totaux</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{campaignAnalytics.completed ?? 0}</div>
                  <div className="metric-label">Entretiens complétés</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{campaignAnalytics.average_score != null ? campaignAnalytics.average_score.toFixed(1) : "-"}</div>
                  <div className="metric-label">Score moyen</div>
                </div>
              </div>
            ) : (
              <div className="text-muted">Aucune donnée pour cette campagne.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
