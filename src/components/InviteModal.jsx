import React, { useState, useEffect, useMemo } from "react";
import { inviteCandidate, fetchCampaign } from "../services/campaigns";
import { bulkInvite } from "../services/bulk";
import "./InviteModal.css";

export default function InviteModal({ campaignId, onClose }) {
  const [mode, setMode] = useState("single"); // single | bulk
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", phone: "", linkedin_url: "" });
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [campaign, setCampaign] = useState(null);
  // Bulk state
  const [bulkText, setBulkText] = useState("");
  const [bulkRes, setBulkRes] = useState(null); // {successes:[], errors:[]}
  
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

  const parsedBulk = useMemo(() => {
    const out = [];
    const lines = (bulkText || "").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      // email, first_name, last_name[, phone][, linkedin_url]
      const parts = line.split(/[,;\t]/).map(s => s.trim());
      if (!parts.length) continue;
      const [email, first_name = "", last_name = "", phone = "", linkedin_url = ""] = parts;
      if (!email) continue;
      out.push({ email, first_name, last_name, phone, linkedin_url });
    }
    return out;
  }, [bulkText]);

  const bulkNameByEmail = useMemo(() => {
    const map = {};
    parsedBulk.forEach(r => { if (r.email) map[r.email.toLowerCase()] = r.first_name || ""; });
    return map;
  }, [parsedBulk]);

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
      if (mode === "single") {
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
      } else {
        if (!parsedBulk.length) {
          setError("Aucun candidat détecté. Format: email,prenom,nom[,telephone][,linkedin]");
          setLoading(false);
          return;
        }
        const res = await bulkInvite(campaignId, { candidates: parsedBulk });
        setBulkRes(res || { successes: [], errors: [] });
        setLoading(false);
      }
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
    // Build Gmail compose URL
    const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    // If the user isn't logged in, going to mail.google.com may lose the compose params after login.
    // Use AccountChooser with 'continue' to force redirect to compose after authentication.
    const chooser = `https://accounts.google.com/AccountChooser?continue=${encodeURIComponent(composeUrl)}&service=mail`;
    window.open(chooser, "_blank", "noopener,noreferrer");
  };

  const openGmailFor = (email, token, firstName = "") => {
    if (!email || !token) return;
    const url = `${window.location.origin}/session/${token}`;
    const subject = encodeURIComponent(buildEmailSubject(campaign));
    const lines = buildEmailLines(campaign, url, firstName);
    const body = encodeURIComponent(lines.join("\n"));
    const to = encodeURIComponent(email);
    const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
    const chooser = `https://accounts.google.com/AccountChooser?continue=${encodeURIComponent(composeUrl)}&service=mail`;
    window.open(chooser, "_blank", "noopener,noreferrer");
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
        {!link && mode === "single" ? (
          <form onSubmit={submit}>
            <h3>Inviter un candidat</h3>
            <div className="mode-toggle" style={{marginBottom: 8}}>
              <button type="button" className={`btn ${mode==='single'?'btn-primary':''}`} onClick={()=>{setMode('single'); setBulkRes(null);}}>Inviter 1</button>
              <button type="button" className={`btn ${mode==='bulk'?'btn-primary':''}`} onClick={()=>{setMode('bulk'); setLink(null); setMeta(null);}}>Invitations multiples</button>
            </div>
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
        ) : !link && mode === "bulk" ? (
          <form onSubmit={submit}>
            <h3>Invitations multiples</h3>
            <div className="mode-toggle" style={{marginBottom: 8}}>
              <button type="button" className={`btn ${mode==='single'?'btn-primary':''}`} onClick={()=>{setMode('single'); setBulkRes(null);}}>Inviter 1</button>
              <button type="button" className={`btn ${mode==='bulk'?'btn-primary':''}`} onClick={()=>{setMode('bulk');}}>Invitations multiples</button>
            </div>
            <textarea rows={8} placeholder="email,prenom,nom[,telephone][,linkedin]\n..."
              value={bulkText} onChange={(e)=>setBulkText(e.target.value)} />
            <div className="hint">Prévus: {parsedBulk.length} candidat(s)</div>
            {error && <div className="error">{typeof error === "string" ? error : JSON.stringify(error)}</div>}
            <div className="modal-actions">
              <button type="submit" disabled={loading}>{loading ? "Envoi..." : "Inviter"}</button>
              <button type="button" onClick={() => onClose(null)}>Annuler</button>
            </div>
            {bulkRes && (
              <div className="bulk-results" style={{marginTop: 12}}>
                <h4>Résultats</h4>
                {Array.isArray(bulkRes.successes) && bulkRes.successes.length > 0 && (
                  <div className="bulk-success card" style={{padding: 8}}>
                    <strong>Succès ({bulkRes.successes.length})</strong>
                    <ul>
                      {bulkRes.successes.map((s, i) => {
                        const token = s?.access_token || s?.session?.access_token;
                        const url = token ? `${window.location.origin}/session/${token}` : null;
                        const firstName = bulkNameByEmail[(s.email || "").toLowerCase()] || "";
                        return (
                          <li key={i}>
                            {s.email} {url && (
                              <>
                                — <a href={url} target="_blank" rel="noreferrer">lien</a>
                                <button type="button" className="btn" style={{marginLeft: 6}} onClick={() => { try { navigator.clipboard.writeText(url); } catch(_){} }}>Copier</button>
                                <button type="button" className="btn btn-primary" style={{marginLeft: 6}} onClick={() => openGmailFor(s.email, token, firstName)}>Gmail</button>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {Array.isArray(bulkRes.errors) && bulkRes.errors.length > 0 && (
                  <div className="bulk-errors card" style={{padding: 8, marginTop: 8}}>
                    <strong>Erreurs ({bulkRes.errors.length})</strong>
                    <ul>
                      {bulkRes.errors.map((e, i) => (
                        <li key={i}>{e?.payload?.email || `Ligne ${e?.index+1}`} — {e?.error || 'Erreur'}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
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