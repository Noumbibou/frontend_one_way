import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./Header.css";

export default function Header({ title, children, showUser = true, showNavigation = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const navigationItems = [
    { path: "/recruiter/dashboard", label: "Tableau de bord", icon: "📊" },
    { path: "/recruiter/campaigns", label: "Campagnes", icon: "🎯" },
    { path: "/recruiter/sessions", label: "Sessions", icon: "🎥" }
  ];

  return (
    <header className="header">
      <div className="header__container">
        {/* Logo et titre */}
        <div className="header__brand">
          <div className="header__logo">
            <span className="header__logo-icon">⚡</span>
            <span className="header__logo-text">OneWay</span>
          </div>
          {title && (
            <h1 className="header__title">
              {title}
            </h1>
          )}
        </div>

        {/* Navigation */}
        {showNavigation && (
          <nav className="header__nav">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                className={`header__nav-item ${isActiveRoute(item.path) ? 'header__nav-item--active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="header__nav-icon">{item.icon}</span>
                <span className="header__nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Actions et utilisateur */}
        <div className="header__actions">
          {/* Bouton "Nouvelle campagne" — utilise les classes de navigation pour conserver le design */}
          {showNavigation && (
            <button
              className="header__nav-item header__new-campaign"
              onClick={() => navigate("/recruiter/campaigns/create")}
            >
              <span className="header__nav-icon">➕</span>
              <span className="header__nav-label">Nouvelle campagne</span>
            </button>
          )}

          {/* Contenu personnalisé */}
          {children && (
            <div className="header__custom-content">
              {children}
            </div>
          )}

          {/* Informations utilisateur */}
          {showUser && user && (
            <div className="header__user">
              <div className="header__user-info">
                <span className="header__user-name">
                  {user.name || user.email || "Utilisateur"}
                </span>
                <span className="header__user-role">
                  {user.user_type === "hiring_manager" ? "Recruteur" : "Candidat"}
                </span>
              </div>
              <div className="header__user-avatar">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="header__user-menu">
                <button className="header__menu-trigger">
                  <span>▼</span>
                </button>
                <div className="header__menu-dropdown">
                  <button 
                    className="header__menu-item"
                    onClick={handleLogout}
                  >
                    <span className="header__menu-icon">🚪</span>
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bouton de déconnexion simple si pas d'utilisateur détaillé */}
          {showUser && user && !user.name && (
            <button 
              className="header__logout-btn"
              onClick={handleLogout}
              title="Se déconnecter"
            >
              <span className="header__logout-icon">🚪</span>
              <span className="header__logout-text">Déconnexion</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}