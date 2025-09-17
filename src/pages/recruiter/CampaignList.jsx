import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Button, Badge } from 'react-bootstrap';
import { FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import '../../App.css';
import './CampaignList.css';

export default function CampaignList() {
  const nav = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [activityFilter, setActivityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null); // { message: string } | null

  const showToast = (message) => {
    setToast({ message });
    window.setTimeout(() => setToast(null), 1000);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = {};
        if (activityFilter === 'active') params.is_active = true;
        if (activityFilter === 'inactive') params.is_active = false;
        const r = await api.get('campaigns/', { params });
        const list = Array.isArray(r.data) ? r.data : (r.data.results || []);
        setCampaigns(list);
      } catch (e) {
        setError(e?.response?.data || e?.message || 'Erreur lors du chargement');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activityFilter]);

  // Client-side filtering by search (title/description)
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCampaigns = normalizedQuery
    ? campaigns.filter((c) => {
        const t = (c.title || '').toLowerCase();
        const d = (c.description || '').toLowerCase();
        return t.includes(normalizedQuery) || d.includes(normalizedQuery);
      })
    : campaigns;

  return (
    <div className="campaign-list-container allow-hover">
      <div className="campaign-list-content">
        {toast && (
          <div className="toast-notice" role="status" aria-live="polite">
            {toast.message}
          </div>
        )}
        {/* Header */}
        <div className="campaign-header">
          <div className="header-content">
            <h1 className="page-title">Gestion des Campagnes</h1>
            <p className="page-subtitle">Créez et gérez vos campagnes d'entretien</p>
          </div>
          
          <div className="header-actions">
            <div className="filter-group" style={{ minWidth: 280 }}>
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                className="search-field"
                placeholder="Rechercher une campagne..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </div>
            <div className="filter-group" style={{ minWidth: 240 }}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel id="activityFilter-label" sx={{ color: 'text.primary' }}>Filtrer par</InputLabel>
                <Select
                  labelId="activityFilter-label"
                  id="activityFilter"
                  value={activityFilter}
                  label="Filtrer par"
                  onChange={(e) => setActivityFilter(e.target.value)}
                  MenuProps={{
                    PaperProps: {
                      className: 'menu-paper-dark',
                    },
                  }}
                >
                  <MenuItem value="all">Toutes les campagnes</MenuItem>
                  <MenuItem value="active">Campagnes actives</MenuItem>
                  <MenuItem value="inactive">Campagnes inactives</MenuItem>
                </Select>
              </FormControl>
            </div>
            
            <Link to="/recruiter/campaigns/create" className="create-link">
              <Button variant="primary" className="create-btn">
                <span className="btn-icon">+</span>
                Nouvelle Campagne
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <LoadingSpinner />
            <p className="loading-text">Chargement des campagnes...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3 className="error-title">Erreur de chargement</h3>
            <p className="error-message">
              {typeof error === 'string' ? error : 'Une erreur est survenue'}
            </p>
            <Button 
              variant="outline-primary" 
              onClick={() => window.location.reload()}
              className="retry-btn"
            >
              Réessayer
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCampaigns.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3 className="empty-title">Aucune campagne trouvée</h3>
            <p className="empty-message">
              {normalizedQuery
                ? "Aucune campagne ne correspond à votre recherche"
                : activityFilter === 'all'
                  ? "Commencez par créer votre première campagne d'entretien"
                  : "Aucune campagne ne correspond à ce filtre"}
            </p>
            <Link to="/recruiter/campaigns/create" className="empty-action">
              <Button variant="primary">Créer une campagne</Button>
            </Link>
          </div>
        )}

        {/* Campaigns Grid */}
        {!loading && !error && filteredCampaigns.length > 0 && (
          <div className="campaigns-grid">
            {filteredCampaigns.map((campaign) => {
              const isActive = !!campaign.is_active;
              const isExpired = campaign.end_date ? (new Date(campaign.end_date) < new Date()) : false;
              const description = campaign.description
                ? (campaign.description.length > 120 
                    ? `${campaign.description.substring(0, 120)}...` 
                    : campaign.description)
                : 'Aucune description fournie';

              return (
                <div className="campaign-card" key={campaign.id}>
                  <div className="card-header">
                    <div className="campaign-title-section">
                      <h3 className="campaign-title" title={campaign.title}>
                        {campaign.title || 'Sans titre'}
                      </h3>
                      <Badge 
                        bg={isActive ? 'success' : 'secondary'} 
                        className="status-badge"
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className="card-body">
                    <p className="campaign-description">{description}</p>
                    
                    <div className="campaign-dates">
                      <div className="date-item">
                        <span className="date-label">Début :</span>
                        <span className="date-value">
                          {campaign.start_date 
                            ? new Date(campaign.start_date).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : 'Non définie'
                          }
                        </span>
                      </div>
                      <div className="date-item">
                        <span className="date-label">Fin :</span>
                        <span className="date-value">
                          {campaign.end_date 
                            ? new Date(campaign.end_date).toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                            : 'Non définie'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="action-buttons">
                      <Button
                        variant="primary"
                        className={`invite-btn ${(!isActive || isExpired) ? 'invite-disabled' : ''}`}
                        aria-disabled={!isActive || isExpired}
                        title={!isActive || isExpired ? 'Campagne inactive ou expirée' : 'Inviter des candidats'}
                        onClick={() => {
                          if (!isActive || isExpired) {
                            showToast("Impossible d'inviter car la campagne est arrivée à sa date d'expiration.");
                            return;
                          }
                          nav(`/recruiter/campaigns/${campaign.id}`, { state: { openInvite: true } });
                        }}
                      >
                        Inviter
                      </Button>
                      <Link 
                        to={`/recruiter/campaigns/${campaign.id}`} 
                        className="action-btn view-btn"
                      >
                        Voir détails
                      </Link>
                    </div>
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