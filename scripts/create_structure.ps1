# Crée dossiers/fichiers importants pour le frontend (ne remplace pas les fichiers existants)
param(
  [string]$ProjectRoot = "e:\stage_projet\frontend_one_way"
)

function Ensure-Dir($p){ if(-not (Test-Path $p)){ New-Item -ItemType Directory -Path $p | Out-Null; Write-Host "Created dir: $p" } else { Write-Host "Exists dir:  $p" } }

function Write-IfMissing($path, $content){
  if(-not (Test-Path $path)){
    $dir = Split-Path $path -Parent
    Ensure-Dir $dir
    $content | Out-File -FilePath $path -Encoding utf8
    Write-Host "Created: $path"
  } else {
    Write-Host "Exists:  $path"
  }
}

$src = Join-Path $ProjectRoot "src"

# Dossiers
$dirs = @(
  $src,
  (Join-Path $src "components"),
  (Join-Path $src "contexts"),
  (Join-Path $src "pages"),
  (Join-Path $src "pages\recruiter"),
  (Join-Path $src "pages\candidate"),
  (Join-Path $src "services"),
  (Join-Path $src "hooks"),
  (Join-Path $src "styles")
)
$dirs | ForEach-Object { Ensure-Dir $_ }

# Fichiers importants (créés seulement s'ils manquent)
Write-IfMissing (Join-Path $src "components\Header.jsx") @'
import React from "react";
export default function Header({ title, children }) {
  return (
    <header className="app-header" style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
      <h1 style={{margin:0,fontSize:18}}>{title}</h1>
      <div>{children}</div>
    </header>
  );
}
'@

Write-IfMissing (Join-Path $src "components\VideoPlayer.jsx") @'
import React from "react";
export default function VideoPlayer({ src, poster }) {
  if (!src) return <div>No video</div>;
  return <video controls width="100%" src={src} poster={poster} />;
}
'@

Write-IfMissing (Join-Path $src "components\Recorder.jsx") @'
import React from "react";
export default function Recorder(){ return <div>Recorder component (placeholder)</div>; }
'@

Write-IfMissing (Join-Path $src "components\PrivateRoute.jsx") @'
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
export default function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.user_type && user.user_type !== role) return <Navigate to="/login" replace />;
  return children;
}
'@

Write-IfMissing (Join-Path $src "contexts\AuthContext.jsx") @'
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) { api.defaults.headers.common["Authorization"] = `Bearer ${token}`; setUser({ authenticated: true }); }
    setLoading(false);
  }, []);
  const login = async (identifier, password) => {
    const res = await api.post("auth/login/", { email: identifier, password });
    const payload = res.data || {};
    const access = payload.access || payload.token || payload.access_token;
    const refresh = payload.refresh || payload.refresh_token;
    if (access){ localStorage.setItem("access_token", access); api.defaults.headers.common["Authorization"] = `Bearer ${access}`; }
    if (refresh) localStorage.setItem("refresh_token", refresh);
    setUser(payload.user || { authenticated: true });
  };
  const logout = () => { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); delete api.defaults.headers.common["Authorization"]; setUser(null); nav("/login"); };
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
export default AuthContext;
'@

Write-IfMissing (Join-Path $src "pages\login.jsx") @'
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(null);
  const { login } = useAuth();
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      await login(id.trim(), pw);
      nav("/recruiter/dashboard");
    } catch (ex) {
      setErr(ex?.response?.data || "Login failed");
    }
  };
  return (
    <div style={{ maxWidth: 420, margin: "4rem auto", padding: 20 }}>
      <h2>Connexion</h2>
      <form onSubmit={submit}>
        <input required value={id} onChange={(e) => setId(e.target.value)} placeholder="Email ou identifiant" style={{width:"100%",padding:8,marginBottom:8}} />
        <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mot de passe" style={{width:"100%",padding:8,marginBottom:8}} />
        {err && <div style={{ color: "crimson", marginBottom: 12 }}>{JSON.stringify(err)}</div>}
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}
'@

Write-IfMissing (Join-Path $src "pages\recruiter\RecruiterDashboard.jsx") @'
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../../components/Header";
export default function RecruiterDashboard() {
  const [metrics, setMetrics] = useState(null);
  const { logout } = useAuth();
  useEffect(() => { api.get("hiring-managers/dashboard/").then(r => setMetrics(r.data)).catch(() => setMetrics(null)); }, []);
  return (
    <div style={{maxWidth:1100,margin:"28px auto",padding:18}}>
      <Header title="Tableau de bord">
        <button onClick={logout} style={{marginLeft:12}}>Se déconnecter</button>
      </Header>
      <section>
        <h2>Résumé</h2>
        {!metrics ? <div>Chargement...</div> : <pre>{JSON.stringify(metrics, null, 2)}</pre>}
      </section>
    </div>
  );
}
'@

Write-IfMissing (Join-Path $src "pages\recruiter\CampaignList.jsx") @'
import React from "react";
export default function CampaignList(){ return <div>CampaignList</div>; }
'@

Write-IfMissing (Join-Path $src "pages\recruiter\CampaignDetail.jsx") @'
import React from "react";
export default function CampaignDetail(){ return <div>CampaignDetail</div>; }
'@

Write-IfMissing (Join-Path $src "pages\recruiter\SessionDetail.jsx") @'
import React from "react";
export default function SessionDetail(){ return <div>SessionDetail</div>; }
'@

Write-IfMissing (Join-Path $src "pages\candidate\CandidateLanding.jsx") @'
import React from "react";
export default function CandidateLanding(){ return <div>Candidate landing</div>; }
'@

Write-IfMissing (Join-Path $src "services\api.js") @'
import axios from "axios";
const BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000/api/";
const api = axios.create({ baseURL: BASE, headers: { "Content-Type": "application/json" } });
api.interceptors.request.use(cfg => { const token = localStorage.getItem("access_token"); if(token) cfg.headers.Authorization = `Bearer ${token}`; return cfg; });
export default api;
'@

Write-IfMissing (Join-Path $src "services\upload.js") @'
export async function presignUpload(payload){ // implement call to /uploads/presign/ from frontend
  // return fetch or axios call here
  return null;
}
'@

Write-IfMissing (Join-Path $src "hooks\useAuth.js") @'
import { useAuth } from "../contexts/AuthContext";
export default function useAuthHook(){ return useAuth(); }
'@

Write-IfMissing (Join-Path $src "styles\dashboard.css") @'
/* minimal dashboard styles */
.app-header{display:flex;justify-content:space-between;align-items:center;padding:8px 0}
'@

Write-Host "`nScaffold complete. Review created files under $src`n"