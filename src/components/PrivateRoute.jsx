import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  // if backend returned a full profile with user_type, enforce role
  if (role && user.user_type && user.user_type !== role) return <Navigate to="/login" replace />;
  // if no full profile but authenticated flag present, allow
  if (role && !user.user_type && !user.authenticated) return <Navigate to="/login" replace />;
  return children;
}