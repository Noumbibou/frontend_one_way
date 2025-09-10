// ...new file...
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CampaignForm from "../../components/CampaignForm";
import { createCampaign } from "../../services/campaigns";
import "../../components/CampaignForm.css";
import "./RecruiterDashboard.css";

export default function CreateCampaign() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const nav = useNavigate();

  const handleSubmit = async (payload) => {
    setError(null);
    setSubmitting(true);
    try {
      const data = await createCampaign(payload);
      // redirect to dashboard with success message in location.state
      nav("/recruiter/dashboard", { replace: true, state: { success: "Campagne créée avec succès." } });
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data || err?.message || "Erreur création");
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrap" style={{ maxWidth: 980, margin: "28px auto", padding: 18 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Créer une campagne</h1>
          <p style={{ margin: "6px 0 0", color: "#64748b" }}>Configurez la campagne et invitez des candidats</p>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        {error && <div style={{ color: "crimson", marginBottom: 12 }}>{typeof error === "string" ? error : JSON.stringify(error)}</div>}
        <CampaignForm onSubmit={handleSubmit} submitting={submitting} />
      </section>
    </div>
  );
}