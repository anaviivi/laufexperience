import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getProfile } from "./utils/auth";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const profile = getProfile();

  if (!profile) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
