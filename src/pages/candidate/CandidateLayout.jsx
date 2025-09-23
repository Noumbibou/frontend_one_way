import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../../components/Header";

// Layout pour l'espace candidat
// - Réutilise le Header avec le même design que le recruteur
// - Adapte la navigation pour le candidat
export default function CandidateLayout() {
  const candidateNav = [
    { path: "/candidate/dashboard", label: "Mes entretiens", icon: "🎥" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-body)", display: 'flex', flexDirection: 'column' }}>
      <Header
        title="Espace candidat"
        showUser={true}
        showNavigation={true}
        navItems={candidateNav}
        showNewButton={false}
      />
      <main style={{ flex: 1, padding: '20px 24px', width: '100%', maxWidth: '100%', margin: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}
