import React from "react";
import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-main">
        <div className="app-container">
          {children}
        </div>
      </main>
    </div>
  );
}