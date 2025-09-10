import React, { useState } from "react";
import { inviteCandidate } from "../services/campaigns";
import "./InviteModal.css";

export default function InviteModal({ campaignId, onClose }) {
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", phone: "", linkedin_url: "" });
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  const handle = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const extractToken = (res) => {
    return res?.access_token || res?.session?.access_token || res?.session_access_token || res?.id || null;
  };

  const submit = async (e) => {
    e && e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await inviteCandidate(campaignId, form);
      const token = extractToken(res);
      if (!token) {
        setError("Réponse serveur : token manquant");
        setLoading(false);
        return;
      }
      const generated = `${window.location.origin}/session/${token}`;
      try { await navigator.clipboard.writeText(generated); } catch (_) {}
      setLink(generated);
      setMeta(res?.expires_at || res?.session?.expires_at || null);
      setLoading(false);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data || err?.message || "Erreur");
      setLoading(false);
    }
  };

  const sendEmail = () => {
    if (!link) return;
    const subject = encodeURIComponent("Invitation à passer un entretien");
    const body = encodeURIComponent(`Bonjour,\n\nVous êtes invité(e) à un entretien. Cliquez ici: ${link}\n\nCordialement.`);
    window.location.href = `mailto:${form.email || ""}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="invite-modal-backdrop">
      <div className="invite-modal">
        <button className="modal-close" onClick={() => onClose(null)}>✕</button>
        {!link ? (
          <form onSubmit={submit}>
            <h3>Inviter un candidat</h3>
            <input required placeholder="Email" value={form.email} onChange={handle("email")} />
            <input placeholder="Prénom" value={form.first_name} onChange={handle("first_name")} />
            <input placeholder="Nom" value={form.last_name} onChange={handle("last_name")} />
            <input placeholder="Téléphone" value={form.phone} onChange={handle("phone")} />
            <input placeholder="LinkedIn (optionnel)" value={form.linkedin_url} onChange={handle("linkedin_url")} />
            {error && <div className="error">{typeof error === "string" ? error : JSON.stringify(error)}</div>}
            <div className="modal-actions">
              <button type="submit" disabled={loading}>{loading ? "Envoi..." : "Générer le lien"}</button>
              <button type="button" onClick={() => onClose(null)}>Annuler</button>
            </div>
          </form>
        ) : (
          <div>
            <h3>Lien généré</h3>
            <div className="generated-link"><a href={link} target="_blank" rel="noreferrer">{link}</a></div>
            {meta && <div className="meta">Expire: {new Date(meta).toLocaleString()}</div>}
            <div className="modal-actions">
              <button onClick={() => { try { navigator.clipboard.writeText(link); } catch(_){} }}>Copier</button>
              <button onClick={sendEmail}>Envoyer par e‑mail</button>
              <button onClick={() => onClose(link)}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}