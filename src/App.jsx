import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "./Layout.jsx";

import MainPage from "./MainPage.jsx";
import Training3DPage from "./Training3DPage.jsx";
import RunnerDemo from "./RunnerDemo.jsx";
import RunningTechniquesPage from "./RunningTechniquesPage.jsx";
import PossibleInjuriesPage from "./PossibleInjuriesPage.jsx";
import ELearningPage from "./ELearningPage.jsx";
import ELearningModulePage from "./ELearningModulePage.jsx";
import KICoachingPage from "./KICoachingPage.jsx";
import WissenswertPage from "./WissenswertPage.jsx";
import ArticlePage from "./ArticlePage.jsx"; // ✅ NEU: Artikelseite (slug-basiert)
import QuizPage from "./QuizPage.jsx";

import ProfilePage from "./ProfilePage.jsx";
import DashboardPage from "./DashboardPage.jsx";
import DeviceConnectionsPage from "./DeviceConnectionsPage.jsx";
import LoginPage from "./LoginPage.jsx";
import LandingPage from "./LandingPage.jsx";

import AdminRoute from "./AdminRoute.jsx";
import AdminLayout from "./AdminLayout.jsx";
import AdminDashboardPage from "./AdminDashboardPage.jsx";
import AdminUsersPage from "./AdminUsersPage.jsx";
import AdminPermissionsPage from "./AdminPermissionsPage.jsx";
import AdminArticlesPage from "./AdminArticlesPage.jsx";
import AdminFlyerEditor from "./AdminFlyerEditor.jsx";

export default function App() {
  return (
    <Routes>
      {/* Alle "normalen" Seiten hängen unter dem allgemeinen Layout */}
      <Route element={<Layout />}>
        {/* Home */}
        <Route index element={<MainPage />} />
        <Route path="home" element={<MainPage />} />

        {/* NAV */}
        <Route path="3d-training" element={<Training3DPage />} />
        <Route path="demo" element={<RunnerDemo />} />
        <Route path="lauftechnik" element={<RunningTechniquesPage />} />
        <Route path="verletzungen" element={<PossibleInjuriesPage />} />
        <Route path="e-learning" element={<ELearningPage />} />
        <Route path="e-learning/:moduleId" element={<ELearningModulePage />} />
        <Route path="ki-coaching" element={<KICoachingPage />} />

        {/* Wissenswert */}
        <Route path="wissenswert" element={<WissenswertPage />} />
        {/* ✅ Wichtig: Artikelseite (z.B. /wissenswert/mein-artikel-slug) */}
        <Route path="wissenswert/:slug" element={<ArticlePage />} />

        <Route path="quiz" element={<QuizPage />} />

        {/* Profil / Auth */}
        <Route path="profil" element={<ProfilePage />} />
        <Route path="profil/devices" element={<DeviceConnectionsPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="landing" element={<LandingPage />} />
        <Route path="register" element={<LandingPage />} />
        <Route path="signup" element={<LandingPage />} />

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="permissions" element={<AdminPermissionsPage />} />
            <Route path="articles" element={<AdminArticlesPage />} />
            <Route path="flyer" element={<AdminFlyerEditor />} />
          </Route>
        </Route>

        {/* Fallback: unbekannte Routen -> Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
