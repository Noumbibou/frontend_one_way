import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCampaign } from "../../services/campaigns";
import LoadingSpinner from "../../components/LoadingSpinner";
import InviteModal from "../../components/InviteModal";

export default function CampaignDetail() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const nav = useNavigate();

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

  if (loading) return <div style={{padding:20}}><LoadingSpinner /> Chargement...</div>;
  if (!campaign) return <div style={{padding:20}}>Campagne introuvable</div>;

  return (
    <div style={{ padding: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2>{campaign.title}</h2>
          <p style={{ marginTop: 6 }}>{campaign.description}</p>
        </div>
        <div>
          <button className="btn" onClick={() => nav(`/recruiter/campaigns/${id}/edit`)}>Modifier</button>
          <button className="btn btn-primary" onClick={() => setShowInvite(true)} style={{ marginLeft: 8 }}>Inviter</button>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        <h3>Questions ({campaign.total_questions ?? campaign.questions?.length ?? 0})</h3>
        <ol>
          {(campaign.questions || []).map((q, idx) => <li key={idx}>{q.text || q.prompt || '—'}</li>)}
        </ol>
      </section>

      {showInvite && <InviteModal campaignId={id} onClose={() => setShowInvite(false)} />}
    </div>
  );
}