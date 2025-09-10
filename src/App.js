import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./pages/login";
import Register from "./pages/register";
import RecruiterLayout from "./pages/recruiter/RecruiterLayout";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import CreateCampaign from "./pages/recruiter/CreateCampaign";
import CampaignList from "./pages/recruiter/CampaignList";
import CampaignDetail from "./pages/recruiter/CampaignDetail";
import CampaignEdit from "./pages/recruiter/CampaignEdit";
import SessionDetail from "./pages/recruiter/SessionDetail";
import SessionList from "./pages/recruiter/SessionList";
import CandidateLanding from "./pages/candidate/CandidateLanding";
import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import 'bootstrap/dist/css/bootstrap.min.css';
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="campaigns/:id/edit" element={<CampaignEdit />} />
            <Route path="sessions" element={<SessionList />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
          </Route>

          <Route path="/session/:accessToken" element={<CandidateLanding />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

