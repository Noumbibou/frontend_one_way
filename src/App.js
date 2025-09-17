import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "./App.css";
import './index.css'
import './styles/theme.css'
import Login from "./pages/login";
import Register from "./pages/register";
import RecruiterLayout from "./pages/recruiter/RecruiterLayout";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import CreateCampaign from "./pages/recruiter/CreateCampaign";
import CampaignList from "./pages/recruiter/CampaignList";
import CampaignDetail from "./pages/recruiter/CampaignDetail";
import SessionDetail from "./pages/recruiter/SessionDetail";
import SessionList from "./pages/recruiter/SessionList";
import CandidateLanding from "./pages/candidate/CandidateLanding";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Analytics from "./pages/recruiter/Analytics";
import { ThemeProviderApp, useThemeApp } from "./contexts/ThemeContext";

function ThemedRoutes() {
  const { theme } = useThemeApp();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Navigate to="/recruiter/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* recruteur : layout + routes imbriquées */}
        <Route
          path="/recruiter"
          element={
            <PrivateRoute role="hiring_manager">
              <RecruiterLayout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<RecruiterDashboard />} />
          <Route path="campaigns" element={<CampaignList />} />
          <Route path="campaigns/create" element={<CreateCampaign />} />
          <Route path="campaigns/:id" element={<CampaignDetail />} />
          <Route path="sessions" element={<SessionList />} />
          <Route path="sessions/:id" element={<SessionDetail />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        <Route path="/session/:accessToken" element={<CandidateLanding />} />
      </Routes>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProviderApp>
          <ThemedRoutes />
        </ThemeProviderApp>
      </AuthProvider>
    </BrowserRouter>
  );
}
