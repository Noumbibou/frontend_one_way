import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CampaignForm from "../../components/CampaignForm";
import { fetchCampaign, updateCampaign } from "../../services/campaigns";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function CampaignEdit() {
  const { id } = useParams();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchCampaign(id);
        setInitial(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await updateCampaign(id, payload);
      nav("/recruiter/dashboard", { state: { success: "Campagne mise à jour." } });
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{padding:20}}><LoadingSpinner /> Chargement...</div>;
  if (!initial) return <div style={{padding:20}}>Campagne introuvable</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Modifier la campagne</h2>
      <CampaignForm initial={initial} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}