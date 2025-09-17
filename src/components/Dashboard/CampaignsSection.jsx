import { Link } from "react-router-dom";
import { Plus, Eye, Edit, UserPlus, Calendar, FolderOpen } from "lucide-react";
import { Button, Badge } from "react-bootstrap";

export function CampaignsSection({ campaigns, loading, onInvite }) {

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="text-2xl font-semibold text-card-foreground d-flex align-items-center gap-3">
            <div className="h-1 w-8 bg-gradient-primary rounded-full" />
            Mes Campagnes
          </h2>
        
        <Link to="/recruiter/campaigns/create" className="text-decoration-none">
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Campagne
          </Button>
        </Link>
      </div>

      <div className="glass rounded-xl border border-border p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </div>
    </section>
  );
  }
  return (
    <section className="space-y-6">
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="text-2xl font-semibold d-flex align-items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <div className="h-1 w-8 bg-gradient-primary rounded-full" />
          Mes Campagnes
        </h2>
        
        <Link to="/recruiter/campaigns/create" className="text-decoration-none">
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Campagne
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass rounded-xl border border-border p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 d-flex justify-content-center align-items-center">
              <FolderOpen className="h-8 w-8 text-foreground-muted" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-card-foreground">
                Aucune campagne trouvée
              </h3>
              <p className="text-foreground-muted max-w-md mx-auto">
                Commencez par créer votre première campagne d'entretien
              </p>
            </div>
            <Link to="/recruiter/campaigns/create" className="text-decoration-none">
              <Button variant="primary" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Créer une campagne
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-card">
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start">
                  <h3 className="font-semibold line-clamp-1" style={{ color: 'var(--text-on-card)' }}>
                    {campaign.title || "Sans titre"}
                  </h3>
                  <Badge bg={campaign.is_active ? "success" : "secondary"}>
                    {campaign.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-sm line-clamp-2" style={{ color: 'var(--text-on-card)' }}>
                  {campaign.description ? (
                    campaign.description.length > 100
                      ? `${campaign.description.substring(0, 100)}...`
                      : campaign.description
                  ) : (
                    "Aucune description"
                  )}
                </p>

                {/* Actions */}
                <div className="d-flex gap-2 pt-2">
                  <Link to={`/recruiter/campaigns/${campaign.id}`} className="text-decoration-none">
                    <Button variant="outline-secondary" size="sm" className="gap-1">
                      <Eye className="h-3 w-3" />
                      Voir
                    </Button>
                  </Link>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="gap-1 invite-btn"
                    disabled={Boolean(campaign.end_date) && new Date(campaign.end_date) < new Date() || !campaign.is_active}
                    title={((Boolean(campaign.end_date) && new Date(campaign.end_date) < new Date()) || !campaign.is_active) ? "Campagne expirée ou inactive" : ""}
                    onClick={() => {
                      const isDisabled = ((Boolean(campaign.end_date) && new Date(campaign.end_date) < new Date()) || !campaign.is_active);
                      if (isDisabled) return;
                      onInvite(campaign.id);
                    }}
                  >
                    <UserPlus className="h-3 w-3" />
                    Inviter
                  </Button>
                </div>
              </div>

              {/* Footer with dates */}
              {(campaign.start_date || campaign.end_date) && (
                <div className="px-6 py-3" style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
                  <div className="d-flex justify-content-between align-items-center text-xs" style={{ color: 'var(--text-on-card)' }}>
                    <div className="d-flex align-items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {campaign.start_date && new Date(campaign.start_date).toLocaleDateString()}
                    </div>
                    {campaign.end_date && (
                      <span>→ {new Date(campaign.end_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}