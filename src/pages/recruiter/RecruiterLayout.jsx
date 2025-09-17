import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../../components/Header";

/**
 * Layout partagé pour toutes les pages recruteur :
 * - affiche le Header (avec navigation)
 * - rend le contenu via <Outlet/>
 */
export default function RecruiterLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-body)", display: 'flex', flexDirection: 'column' }}>
      <Header title="Tableau recruteur" showUser={true} showNavigation={true} />
      <main style={{ flex: 1, padding: '20px 24px', width: '100%', maxWidth: '100%', margin: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}