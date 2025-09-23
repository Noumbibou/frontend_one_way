import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import "./Header.css";
import { useThemeApp } from "../contexts/ThemeContext";

export default function Header({
  title,
  children,
  showUser = true,
  showNavigation = false,
  navItems,
  showNewButton = true,
  newButtonLabel = 'Nouvelle campagne',
  onNewClick,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleTheme } = useThemeApp();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const defaultNavigationItems = [
    { path: "/recruiter/dashboard", label: "Tableau de bord", icon: "📊" },
    { path: "/recruiter/campaigns", label: "Campagnes", icon: "🎯" },
    { path: "/recruiter/sessions", label: "Sessions", icon: "🎥" }
  ];
  const navigationItems = Array.isArray(navItems) && navItems.length ? navItems : defaultNavigationItems;

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
          {/* Theme toggle */}
          <button
            className="header__nav-item"
            title={mode === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            onClick={toggleTheme}
          >
            <span className="header__nav-icon" aria-hidden>
              {mode === 'dark' ? '🌞' : '🌙'}
            </span>
            <span className="header__nav-label">{mode === 'dark' ? 'Clair' : 'Sombre'}</span>
          </button>
          {/* Bouton "Nouvelle campagne" — utilise les classes de navigation pour conserver le design */}
          {showNavigation && showNewButton && (
            <button
              className="header__nav-item header__new-campaign"
              onClick={onNewClick ? onNewClick : () => navigate("/recruiter/campaigns/create")}
            >
              <span className="header__nav-icon">➕</span>
              <span className="header__nav-label">{newButtonLabel}</span>
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

              <div className="header__user-avatar">
                {user.username ? user.username.charAt(0).toUpperCase() : "U"}
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