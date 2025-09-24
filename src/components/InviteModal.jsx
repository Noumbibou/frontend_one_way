import React, { useState, useEffect } from "react";
import { inviteCandidate, fetchCampaign } from "../services/campaigns";
import "./InviteModal.css";

export default function InviteModal({ campaignId, onClose }) {
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", phone: "", linkedin_url: "" });
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [campaign, setCampaign] = useState(null);
  
  // Helpers to build email contents (subject, text body, HTML body)
  const buildEmailSubject = (c) => `Invitation à un entretien vidéo - ${c?.title || "Campagne"}`;
  const buildEmailLines = (c, linkUrl, recipientFirstName) => {
    const title = c?.title || "(Titre de la campagne)";
    const description = (c?.description || "").trim();
    const start = c?.start_date ? new Date(c.start_date).toLocaleString() : null;
    const end = c?.end_date ? new Date(c.end_date).toLocaleString() : null;
    const greeting = recipientFirstName ? `Bonjour ${recipientFirstName},` : "Bonjour,";

    return [
      greeting,
      "",
      `Vous êtes invité(e) à participer à un entretien vidéo pour la campagne : ${title}.`,
      description ? "" : null,
      description ? `Description : ${description}` : null,
      start || end ? "" : null,
      start || end ? `Période : ${start ? `Début ${start}` : ""}${start && end ? " | " : ""}${end ? `Fin ${end}` : ""}` : null,
      "",
      `Pour démarrer l'entretien, cliquez sur le lien suivant : ${linkUrl}`,
      "",
      "Cordialement,",
      "L'équipe de recrutement",
    ].filter(Boolean);
  };

  const buildEmailHTML = (c, linkUrl, recipientFirstName) => {
    const title = c?.title || "(Titre de la campagne)";
    const description = (c?.description || "").trim();
    const start = c?.start_date ? new Date(c.start_date).toLocaleString() : null;
    const end = c?.end_date ? new Date(c.end_date).toLocaleString() : null;
    const greeting = recipientFirstName ? `Bonjour ${recipientFirstName},` : "Bonjour,";

    return `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color:#1f2a37; line-height:1.55;">
    <p>${greeting}</p>
    <p>Vous avez été invité(e) à passer un entretien vidéo pour la campagne : <strong>${title}</strong>.</p>
    ${description ? `<p><strong>Description :</strong><br/>${description.replace(/\n/g, '<br/>')}</p>` : ''}
    ${(start || end) ? `<p><strong>Période de la campagne :</strong><br/>${start ? `Début : ${start}` : ''}${start && end ? `<br/>` : ''}${end ? `Fin : ${end}` : ''}</p>` : ''}
    <p>Pour commencer, veuillez cliquer sur le lien ci-dessous :</p>
    <p><a href="${linkUrl}" style="display:inline-block;padding:10px 14px;background:#a78bfa;color:#0f172a;text-decoration:none;border-radius:6px;">Accéder à l'entretien</a></p>
    <p style="margin-top:16px; color:#475569; font-size:13px;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br/>
    <span>${linkUrl}</span></p>
    <p>Cordialement,<br/>L'équipe de recrutement</p>
  </body>
</html>`;
  };

  const handle = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const extractToken = (res) => {
    return res?.access_token || res?.session?.access_token || res?.session_access_token || res?.id || null;
  };

  // Load campaign details to enrich email content
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchCampaign(campaignId);
        if (mounted) setCampaign(data);
      } catch (e) {
        // Non-blocking: we can still send a minimal email without campaign meta
      }
    }
    if (campaignId) load();
    return () => { mounted = false; };
  }, [campaignId]);

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
    const subject = encodeURIComponent(buildEmailSubject(campaign));
    const lines = buildEmailLines(campaign, link, form.first_name);
    const body = encodeURIComponent(lines.join("\n"));
    window.location.href = `mailto:${form.email || ""}?subject=${subject}&body=${body}`;
  };

  const sendViaGmail = () => {
    if (!link) return;
    const subject = encodeURIComponent(buildEmailSubject(campaign));
    const lines = buildEmailLines(campaign, link, form.first_name);
    const body = encodeURIComponent(lines.join("\n"));
    const to = encodeURIComponent(form.email || "");
    // Open Gmail compose in a new tab. If user has multiple accounts, they can switch.
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const copyTextEmail = async () => {
    if (!link) return;
    const lines = buildEmailLines(campaign, link, form.first_name);
    const text = lines.join("\n");
    try { await navigator.clipboard.writeText(text); } catch (_) {}
  };

  const copyHtmlEmail = async () => {
    if (!link) return;
    const html = buildEmailHTML(campaign, link, form.first_name);
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const type = "text/html";
        const blob = new Blob([html], { type });
        await navigator.clipboard.write([new window.ClipboardItem({ [type]: blob })]);
      } else {
        // Fallback: copy as plain text (HTML source)
        await navigator.clipboard.writeText(html);
      }
    } catch (_) {}
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
            {/* Email preview */}
            <div className="email-preview">
              <div className="email-preview__row"><span className="email-label">À :</span><span>{form.email || ""}</span></div>
              <div className="email-preview__row"><span className="email-label">Objet :</span><span>{buildEmailSubject(campaign)}</span></div>
              <div className="email-preview__body">
                {buildEmailLines(campaign, link, form.first_name).map((ln, idx) => (
                  <div key={idx}>{ln}</div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => { try { navigator.clipboard.writeText(link); } catch(_){} }}>Copier le lien</button>
              <button className="btn" onClick={copyTextEmail}>Copier le texte</button>
              <button className="btn btn-primary" onClick={sendViaGmail}>Ouvrir dans Gmail</button>
              <button className="btn" onClick={sendEmail}>Ouvrir dans le client e‑mail</button>
              <button className="btn btn-ghost" onClick={copyHtmlEmail} title="Copier une version HTML stylée de l'e‑mail">Copier l'email HTML</button>
              <button onClick={() => onClose(link)}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}