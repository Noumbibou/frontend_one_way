import React, { useEffect, useMemo, useState } from "react";
import { fetchCandidates } from "../../services/candidates";
import { fetchAllSessions } from "../../services/sessions";
import { fetchCampaigns, inviteCandidate } from "../../services/campaigns";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Avatar, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import "./Candidates.css";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTarget, setInviteTarget] = useState(null); // {email, first_name, last_name, phone, linkedin_url}
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null); // {link, expires_at}
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [list, sess, camps] = await Promise.all([
          fetchCandidates(),
          fetchAllSessions({}),
          fetchCampaigns({ is_active: true })
        ]);
        setCandidates(Array.isArray(list) ? list : []);
        setSessions(Array.isArray(sess) ? sess : []);
        setCampaigns(Array.isArray(camps) ? camps : (camps?.results || []));
      } catch (e) {
        setError(e?.response?.data || e.message || "Erreur de chargement");
        setCandidates([]);
        setSessions([]);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statsByEmail = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const email = s?.candidate?.email || s.candidate_email || null;
      if (!email) return;
      const invitedAt = s.invited_at ? new Date(s.invited_at) : null;
      const responsesCount = Number(s.responses_count || (Array.isArray(s.responses) ? s.responses.length : 0) || 0);
      if (!map[email]) {
        map[email] = { sessions: 0, responses: 0, lastInvitedAt: null };
      }
      map[email].sessions += 1;
      map[email].responses += responsesCount;
      if (invitedAt && (!map[email].lastInvitedAt || invitedAt > map[email].lastInvitedAt)) {
        map[email].lastInvitedAt = invitedAt;
      }
    });
    return map;
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(c => {
      const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
      return (c.email || '').toLowerCase().includes(q) || name.includes(q);
    });
  }, [candidates, search]);

  const exportCSV = async () => {
    try {
      setExporting(true);
      const rows = [["email","first_name","last_name","phone","linkedin_url","sessions","responses","last_invited_at"]];
      filtered.forEach(c => {
        const st = statsByEmail[c.email] || {};
        rows.push([
          c.email || "",
          c.first_name || "",
          c.last_name || "",
          c.phone || "",
          c.linkedin_url || "",
          String(st.sessions || 0),
          String(st.responses || 0),
          st.lastInvitedAt ? new Date(st.lastInvitedAt).toISOString() : ""
        ]);
      });
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidats-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const openInvite = (c) => {
    setInviteTarget(c);
    setInviteOpen(true);
  };
  const closeInvite = () => {
    setInviteOpen(false);
    setInviteTarget(null);
    setCampaignId("");
  };
  const submitInvite = async () => {
    if (!inviteTarget || !campaignId) return;
    setInviting(true);
    try {
      const res = await inviteCandidate(campaignId, {
        email: inviteTarget.email,
        first_name: inviteTarget.first_name,
        last_name: inviteTarget.last_name,
        phone: inviteTarget.phone,
        linkedin_url: inviteTarget.linkedin_url,
      });
      const token = res?.access_token || res?.session?.access_token || res?.id;
      if (token) {
        const link = `${window.location.origin}/session/${token}`;
        try { await navigator.clipboard.writeText(link); } catch(_) {}
        setInviteResult({ link, expires_at: res?.expires_at || res?.session?.expires_at || null });
      }
    } catch (e) {
      alert(typeof e?.response?.data === 'string' ? e.response.data : 'Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  if (loading) return (
    <div className="cands-container text-center py-4">
      <LoadingSpinner size="large" />
      <div className="mt-2 text-muted">Chargement des candidats...</div>
    </div>
  );

  if (error) return (
    <div className="cands-container py-4">
      <div className="card error-card">
        <div className="card-header"><strong>Erreur</strong></div>
        <div className="card-body">
          <p>{typeof error === 'string' ? error : JSON.stringify(error)}</p>
          <button className="btn btn-danger" onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="cands-container allow-hover">
      <div className="cands-header">
        <div>
          <h1 className="page-title">Pool de talents</h1>
          <p className="page-subtitle">Liste des candidats que vous avez invités</p>
        </div>
        <div className="cands-actions">
          <div className="search-box">
            <input placeholder="Rechercher (nom ou email)" value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
          <button className="btn" onClick={exportCSV} disabled={exporting}>{exporting ? 'Export...' : 'Exporter CSV'}</button>
        </div>
      </div>

      <div className="cands-count">{filtered.length} candidat(s)</div>

      {filtered.length === 0 ? (
        <div className="card text-center p-4 empty-state">
          <div className="empty-icon">👤</div>
          <h3>Aucun candidat</h3>
          <p>Invitez des candidats depuis vos campagnes pour les voir apparaître ici.</p>
          <Link to="/recruiter/campaigns" className="btn btn-primary mt-2">Aller aux campagnes</Link>
        </div>
      ) : (
        <div className="cands-grid">
          {filtered.map((c) => {
            const name = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email || "Candidat";
            const initials = (c.first_name?.[0] || '') + (c.last_name?.[0] || '');
            const st = statsByEmail[c.email] || { sessions: 0, responses: 0, lastInvitedAt: null };
            return (
              <div key={c.id || c.email} className="cand-card card">
                <div className="card-body">
                  <div className="cand-main">
                    <Avatar className="cand-avatar">{initials || (name[0] || 'C')}</Avatar>
                    <div className="cand-info">
                      <div className="cand-name">{name}</div>
                      <div className="cand-email">{c.email}</div>
                      {c.phone && <div className="cand-phone">{c.phone}</div>}
                    </div>
                  </div>
                  {c.linkedin_url && (
                    <div className="cand-links">
                      <a href={c.linkedin_url} target="_blank" rel="noreferrer" className="link-soft">LinkedIn ↗</a>
                    </div>
                  )}
                  <div className="cand-stats">
                    <span className="pill">Sessions: {st.sessions}</span>
                    <span className="pill">Réponses: {st.responses}</span>
                    {st.lastInvitedAt && (
                      <span className="pill">Dernière invitation: {new Date(st.lastInvitedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="cand-actions">
                    <button className="btn" onClick={() => navigate(`/recruiter/sessions?candidate_email=${encodeURIComponent(c.email)}`)}>Voir sessions</button>
                    <button className="btn btn-primary" onClick={() => openInvite(c)}>Inviter</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={inviteOpen} onClose={closeInvite} fullWidth maxWidth="sm">
        <DialogTitle>Inviter le candidat</DialogTitle>
        <DialogContent>
          {!inviteResult ? (
            <div className="invite-form">
              <div className="invite-row"><strong>Email:</strong> {inviteTarget?.email}</div>
              <div className="invite-row"><strong>Nom:</strong> {(inviteTarget?.first_name || "") + " " + (inviteTarget?.last_name || "")}</div>
              <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                <InputLabel id="camp-select">Campagne</InputLabel>
                <Select labelId="camp-select" label="Campagne" value={campaignId} onChange={(e)=>{ setCampaignId(e.target.value); setInviteResult(null); }}>
                  {campaigns.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.title || `#${c.id}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          ) : (
            <div className="invite-summary">
              <div className="invite-row"><strong>Lien généré:</strong> <a href={inviteResult.link} target="_blank" rel="noreferrer">{inviteResult.link}</a></div>
              {inviteResult.expires_at && (
                <div className="invite-row"><strong>Expire:</strong> {new Date(inviteResult.expires_at).toLocaleString()}</div>
              )}
              <div className="email-preview" style={{marginTop: 12}}>
                {(() => {
                  const camp = campaigns.find(c => String(c.id) === String(campaignId));
                  const subject = `Invitation à un entretien vidéo - ${camp?.title || 'Campagne'}`;
                  const start = camp?.start_date ? new Date(camp.start_date).toLocaleString() : null;
                  const end = camp?.end_date ? new Date(camp.end_date).toLocaleString() : null;
                  const lines = [
                    inviteTarget?.first_name ? `Bonjour ${inviteTarget.first_name},` : 'Bonjour,',
                    '',
                    `Vous êtes invité(e) à participer à un entretien vidéo pour la campagne : ${camp?.title || 'Campagne'}.`,
                    camp?.description ? '' : null,
                    camp?.description ? `Description : ${camp.description}` : null,
                    (start || end) ? '' : null,
                    (start || end) ? `Période : ${start ? `Début ${start}` : ''}${start && end ? ' | ' : ''}${end ? `Fin ${end}` : ''}` : null,
                    '',
                    `Pour démarrer l'entretien, cliquez sur le lien suivant : ${inviteResult.link}`,
                    '',
                    'Cordialement,',
                    "L'équipe de recrutement"
                  ].filter(Boolean);
                  const subjectEnc = encodeURIComponent(subject);
                  const bodyEnc = encodeURIComponent(lines.join('\n'));
                  const toEnc = encodeURIComponent(inviteTarget?.email || '');
                  const composeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${toEnc}&su=${subjectEnc}&body=${bodyEnc}`;
                  const chooser = `https://accounts.google.com/AccountChooser?continue=${encodeURIComponent(composeUrl)}&service=mail`;
                  const mailto = `mailto:${inviteTarget?.email || ''}?subject=${subjectEnc}&body=${bodyEnc}`;
                  return (
                    <div>
                      <div className="email-preview__row"><strong>À:</strong> {inviteTarget?.email}</div>
                      <div className="email-preview__row"><strong>Objet:</strong> {subject}</div>
                      <div className="email-preview__body" style={{whiteSpace:'pre-wrap', marginTop: 8}}>{lines.join('\n')}</div>
                      <div className="cand-actions" style={{marginTop: 12, display:'flex', gap:8, flexWrap:'wrap'}}>
                        <button className="btn" onClick={() => { try { navigator.clipboard.writeText(inviteResult.link); } catch(_){} }}>Copier le lien</button>
                        <button className="btn btn-primary" onClick={() => window.open(chooser, '_blank', 'noopener,noreferrer')}>Ouvrir dans Gmail</button>
                        <button className="btn" onClick={() => window.location.href = mailto}>Ouvrir le client e‑mail</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <button className="btn" onClick={closeInvite}>{inviteResult ? 'Fermer' : 'Annuler'}</button>
          {!inviteResult && (
            <button className="btn btn-primary" onClick={submitInvite} disabled={!campaignId || inviting}>{inviting ? 'Envoi...' : 'Envoyer l\'invitation'}</button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}
