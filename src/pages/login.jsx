import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(emailOrUsername.trim(), password);

      // Redirection basée sur le rôle de l'utilisateur
      const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
      const userRole = userInfo.role || userInfo.user_type;

      if (userRole === 'candidate') {
        navigate("/candidate/dashboard", { replace: true });
      } else {
        navigate("/recruiter/dashboard", { replace: true });
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Échec de l'authentification. Veuillez vérifier vos identifiants.";
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    setEmailOrUsername(role === "recruiter" ? "recruiter@demo.com" : "candidate@demo.com");
    setPassword("demo123");
  };

  return (
    <div className="login-container">
      {/* Illustration side panel */}
      <div className="login-illustration">
        <div className="login-illustration-content">
          <div className="login-logo">
            <span className="login-logo-icon">⚡</span>
            <span className="login-logo-text">OneWay</span>
          </div>
          <h1 className="login-illustration-title">
            Bienvenue sur OneWay
          </h1>
          <p className="login-illustration-subtitle">
            La plateforme de recrutement vidéo innovante qui transforme votre processus de sélection.
          </p>
          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">🎯</span>
              <span>Recrutement simplifié</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">🎥</span>
              <span>Entretiens vidéo asynchrones</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">⚡</span>
              <span>Processus accéléré</span>
            </div>
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="login-form-container">
        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h2 className="login-form-title">Connexion</h2>
            <p className="login-form-subtitle">
              Entrez vos identifiants pour accéder à votre espace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="identifier" className="form-label">
                Email
              </label>
              <input
                id="identifier"
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="form-input"
                placeholder="votre@email.com"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mot de passe
              </label>
              <div className="password-input-container">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Votre mot de passe"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
            
            <div className="login-links">
              <Link to="/forgot-password" className="login-link">
                Mot de passe oublié ?
              </Link>
              <Link to="/register" className="login-link">
                Créer un compte
              </Link>
            </div>
          </form>

          <div className="login-footer">
            <p className="login-footer-text">
              © 2024 OneWay. Tous droits réservés.
            </p>
            <div className="login-footer-links">
              <a href="#" className="footer-link">Confidentialité</a>
              <a href="#" className="footer-link">Conditions</a>
              <a href="#" className="footer-link">Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}