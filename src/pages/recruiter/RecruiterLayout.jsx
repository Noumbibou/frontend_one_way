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
    <div style={{ minHeight: "100vh", background: "#f6f8fb" }}>
      <Header title="Tableau recruteur" showUser={true} showNavigation={true} />
      <main style={{ padding: 20, maxWidth: 1100, margin: "0 auto" }}>
        <Outlet />
      </main>
    </div>
  );
}