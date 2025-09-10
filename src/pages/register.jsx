import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import "../pages/Register.css";

export default function Register() {
  const [role, setRole] = useState("hiring_manager");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [candidateFirstName, setCandidateFirstName] = useState("");
  const [candidateLastName, setCandidateLastName] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!username && email) {
      const local = email.split("@")[0] || "";
      setUsername(local);
    }
  }, [email]); // eslint-disable-line

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email et mot de passe requis");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (role === "hiring_manager") {
      if (!company || !department || !phone) {
        setError("company, department et phone sont obligatoires pour un recruteur.");
        return;
      }
    } else {
      if (!candidateFirstName || !candidateLastName || !candidatePhone) {
        setError("first_name, last_name et phone sont obligatoires pour un candidat.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (role === "hiring_manager") {
        await register({
          role,
          username,
          email,
          password,
          first_name: firstName || "",
          last_name: lastName || "",
          company,
          department,
          phone,
        });
      } else {
        await register({
          role,
          username,
          email,
          password,
          first_name: candidateFirstName,
          last_name: candidateLastName,
          phone: candidatePhone,
          extra: {},
        });
      }

      // redirect to login after successful registration
      nav("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data || err?.message || "Erreur inscription";
      setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrap">
      <Header title="Créer un compte" />
      <main className="auth-main">
        <section className="auth-card">
          <div className="auth-card-head">
            <h2 className="auth-title">Inscription</h2>
            <p className="auth-sub">Créez votre compte candidat ou recruteur</p>
          </div>

          <form className="auth-form" onSubmit={submit} aria-label="form-register">
            <div className="role-toggle" role="radiogroup" aria-label="Rôle">
              <label className={`role-pill ${role === "hiring_manager" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="hiring_manager"
                  checked={role === "hiring_manager"}
                  onChange={() => setRole("hiring_manager")}
                />
                Recruteur
              </label>
              <label className={`role-pill ${role === "candidate" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="candidate"
                  checked={role === "candidate"}
                  onChange={() => setRole("candidate")}
                />
                Candidat
              </label>
            </div>

            <div className="form-row">
              <label>Identifiant (username)</label>
              <input required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="identifiant public (ex: jdupont)" />
            </div>

            <div className="form-row">
              <label>Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex: nom@entreprise.com" />
            </div>

            {role === "hiring_manager" ? (
              <>
                <div className="form-grid">
                  <div className="form-row">
                    <label>Prénom</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" />
                  </div>
                  <div className="form-row">
                    <label>Nom</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-row">
                    <label>Entreprise</label>
                    <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nom de l'entreprise" />
                  </div>
                  <div className="form-row">
                    <label>Département</label>
                    <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Ex: RH, Recrutement" />
                  </div>
                </div>

                <div className="form-row">
                  <label>Téléphone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" />
                </div>
              </>
            ) : (
              <>
                <div className="form-grid">
                  <div className="form-row">
                    <label>Prénom</label>
                    <input value={candidateFirstName} onChange={(e) => setCandidateFirstName(e.target.value)} placeholder="Prénom" />
                  </div>
                  <div className="form-row">
                    <label>Nom</label>
                    <input value={candidateLastName} onChange={(e) => setCandidateLastName(e.target.value)} placeholder="Nom" />
                  </div>
                </div>
                <div className="form-row">
                  <label>Téléphone</label>
                  <input value={candidatePhone} onChange={(e) => setCandidatePhone(e.target.value)} placeholder="+33 6 12 34 56 78" />
                </div>
              </>
            )}

            <div className="form-grid">
              <div className="form-row">
                <label>Mot de passe</label>
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ caractères" />
              </div>
              <div className="form-row">
                <label>Confirmer</label>
                <input required type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Répétez le mot de passe" />
              </div>
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Création..." : "Créer mon compte"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => nav("/login")}>Retour</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
