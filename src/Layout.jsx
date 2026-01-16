// src/Layout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "./LanguageContext.jsx";
import { useTheme } from "./ThemeContext.jsx";

import Logo from "./assets/logo.jpg";
import ProfileImg from "./assets/profil.png";

const NAV_ITEMS = [
  { type: "link", path: "/", key: "navMainPage" },
  {
    type: "dropdown",
    key: "navTraining",
    items: [
      { path: "/3d-training", key: "navTraining" },
      { path: "/demo", key: "navDemo" },
    ],
  },
  { type: "link", path: "/ki-coaching", key: "navCoach" },
  { type: "link", path: "/wissenswert", key: "navKnowledge" },
  { type: "link", path: "/quiz", key: "navQuiz" },
];

const TRANSLATIONS = {
  de: {
    navMainPage: "Home",
    navTraining: "3D Training",
    navDemo: "Demo ansehen",
    navCoach: "KI-Coaching",
    navKnowledge: "Wissenswert",
    navQuiz: "Quiz",
    dropdownProfile: "Profil",
    dropdownRegister: "Registrieren",
    dropdownDashboard: "Mein Dashboard",
    dropdownAdmin: "Admin-Bereich",
    dropdownTheme: "Darstellung",
    dropdownLanguage: "Sprache",
    footerRights: "Alle Rechte vorbehalten",
  },
  en: {
    navMainPage: "Home",
    navTraining: "3D Training",
    navDemo: "Watch Demo",
    navCoach: "AI Coaching",
    navKnowledge: "Knowledge",
    navQuiz: "Quiz",
    dropdownProfile: "Profile",
    dropdownRegister: "Sign up",
    dropdownDashboard: "My Dashboard",
    dropdownAdmin: "Admin Area",
    dropdownTheme: "Theme",
    dropdownLanguage: "Language",
    footerRights: "All rights reserved",
  },
};

// Grundstyles / Hilfsobjekte
const layoutStyles = {
  // Vollbreite Wrapper
  wrapper: (theme) => ({
    width: "100vw",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: theme === "dark" ? "#020910ff" : "#f5f7fb",
    margin: 0,
    padding: 0,
    overflowX: "hidden",
  }),
  // Header über komplette Breite, ohne seitliche Padding-Einrückung
  header: (theme) => ({
    boxSizing: "border-box",
    padding: "10px 0",
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: theme === "dark" ? "#020617" : "#020617",
    boxShadow: "0 10px 25px rgba(15,23,42,0.25)",
    width: "100vw",
  }),
  // Innerer Header-Content, damit Text nicht ganz am Rand klebt
  headerInner: {
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 24,
    boxSizing: "border-box",
  },
  logoButton: {
    borderRadius: "50%",
    width: 60,
    height: 60,
    marginRight: 10,
    border: "2px solid transparent",
    padding: 0,
    overflow: "hidden",
    cursor: "pointer",
    background: "transparent",
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  brandTitle: (theme) => ({
    fontSize: 22,
    fontWeight: 200,
    lineHeight: 1.1,
    color: theme === "dark" ? "#e2e4ecff" : "#ffffffff",
    letterSpacing: 0.4,
  }),
  brandSubtitle: (theme) => ({
    marginTop: 2,
    fontSize: 14,
    fontWeight: 100,
    color: theme === "dark" ? "#ecedefff" : "#e5e7eb",
  }),
  nav: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 24,
  },
 navLink: () => ({
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 700,
}),


  navDropdownLabel: {
    cursor: "pointer",
    color: "#e2e3e4ff",
    fontWeight: 600,
  },
  navDropdownMenu: (theme) => ({
    position: "absolute",
    top: "110%",
    right: 0,
    background: theme === "dark" ? "#1c2434ff" : "#cbd5e1",
    borderRadius: 10,
    padding: "10px 0",
    minWidth: 160,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  }),
  profileBtn: {
    width: 65,
    height: 65,
    borderRadius: "50%",
    overflow: "hidden",
    background: "transparent",
    border: "none",
    cursor: "pointer",
  },
  profileImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  profileMenu: {
    position: "absolute",
    top: "110%",
    right: 0,
    background: "#fff",
    color: "#111",
    borderRadius: 12,
    padding: "10px 0",
    minWidth: 240,
    boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
  },
  // Content wirklich über gesamte Breite, kein Padding
  main: {
    flex: 1,
    width: "100vw",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
  },
  // Falls du wieder einen zentrierten Container willst, kannst du ihn im Outlet benutzen
  footer: (theme) => ({
    width: "100vw",
    padding: "18px 16px",
    textAlign: "center",
    fontSize: 14,
    color: theme === "dark" ? "#cbd5e1" : "#1f2937",
    background: theme === "dark" ? "#0b1220" : "#e5e7eb",
    borderTop: `1px solid ${theme === "dark" ? "#1e293b" : "#cbd5e1"}`,
    boxSizing: "border-box",
  }),
};

const ddItem = {
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: 14,
};

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openNavDropdown, setOpenNavDropdown] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const { language, setLanguage } = useLanguage();
  const { theme, setTheme, isDark } = useTheme();

  const t = TRANSLATIONS[language] || TRANSLATIONS.de;

  const goHome = () => navigate("/");

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  useEffect(() => {
    const raw = localStorage.getItem("laufx_profile");
    if (!raw) return;
    try {
      const profile = JSON.parse(raw);
      setAvatar(profile.avatar || null);
      setIsAdmin(profile.role === "admin");
    } catch (e) {
      console.warn("Profil konnte nicht geparst werden:", e);
    }
  }, []);

  return (
    <div style={layoutStyles.wrapper(theme)}>
      {/* HEADER */}
      <header style={layoutStyles.header(theme)}>
        <div style={layoutStyles.headerInner}>
          <button
            onClick={goHome}
            style={layoutStyles.logoButton}
            aria-label="Zur Startseite"
          >
            <img
              src={Logo}
              alt="LaufXperience Logo"
              style={layoutStyles.logoImg}
            />
          </button>

          <div style={{ textAlign: "left" }}>
            <div style={layoutStyles.brandTitle(theme)}>LaufXperience</div>
            <div style={layoutStyles.brandSubtitle(theme)}>
              Knowledge Moves You
            </div>
          </div>

          {/* Navigation */}
          <nav style={layoutStyles.nav}>
            {NAV_ITEMS.map((item) =>
              item.type === "link" ? (
                <Link
                  key={item.path}
                  to={item.path}
                  style={layoutStyles.navLink(isActive(item.path), theme)}
                >
                  {t[item.key]}
                </Link>
              ) : (
                <div
                  key={item.key}
                  style={{ position: "relative" }}
                  onMouseEnter={() => setOpenNavDropdown(item.key)}
                  onMouseLeave={() => setOpenNavDropdown(null)}
                >
                  <span style={layoutStyles.navDropdownLabel}>
                    {t[item.key]} ▾
                  </span>

                  {openNavDropdown === item.key && (
                    <div style={layoutStyles.navDropdownMenu(theme)}>
                      {item.items.map((sub) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          style={{
                            display: "block",
                            padding: "8px 14px",
                            color: theme === "dark" ? "#e5e7eb" : "#111",
                            textDecoration: "none",
                          }}
                        >
                          {t[sub.key]}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </nav>

          {/* Profilbild + Menü */}
          <div style={{ position: "relative", marginLeft: 20 }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={layoutStyles.profileBtn}
              aria-label="Profilmenü öffnen"
            >
              <img
                src={avatar || ProfileImg}
                alt="Profil"
                style={layoutStyles.profileImg}
              />
            </button>

            {menuOpen && (
              <div style={layoutStyles.profileMenu}>
                <div style={ddItem} onClick={() => navigate("/profil")}>
                  {t.dropdownProfile}
                </div>
                <div style={ddItem} onClick={() => navigate("/dashboard")}>
                  {t.dropdownDashboard}
                </div>
                <div style={ddItem} onClick={() => navigate("/signup")}>
                  {t.dropdownRegister}
                </div>

                {isAdmin && (
                  <div style={ddItem} onClick={() => navigate("/admin")}>
                    {t.dropdownAdmin}
                  </div>
                )}

                <div
                  style={{
                    borderTop: "1px solid #eee",
                    margin: "6px 0",
                  }}
                />

                {/* Sprache Toggle */}
                <div
                  style={{
                    ...ddItem,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span>{t.dropdownLanguage}</span>
                  <ToggleSwitch
                    checked={language === "de"}
                    leftLabel="EN"
                    rightLabel="DE"
                    onToggle={() => 
                      setLanguage(language === "de" ? "en" : "de")
                      
                    }
                  />
                </div>

                {/* Theme Toggle */}
                <div
                  style={{
                    ...ddItem,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span>{t.dropdownTheme}</span>
                  <ToggleSwitch
                    checked={isDark}
                    leftLabel="☀️"
                    rightLabel="🌙"
                    onToggle={() => setTheme(isDark ? "light" : "dark")}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTENT – 100vw */}
      <main style={layoutStyles.main}>
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer style={layoutStyles.footer(theme)}>
        © {new Date().getFullYear()} LaufXperience – {t.footerRights}
      </footer>
    </div>
  );
}

// Toggle-Komponente für Sprache & Darkmode
function ToggleSwitch({ checked, leftLabel, rightLabel, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "left",
          gap: 6,
          fontSize: 11,
          fontWeight: 500,
        }}
      >
        <span style={{ opacity: checked ? 0.5 : 1 }}>{leftLabel}</span>
        <div
          style={{
            width: 44,
            height: 22,
            borderRadius: 999,
            background: checked ? "#0f766e" : "#e5e7eb",
            position: "relative",
            transition: "background 0.2s ease",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              left: checked ? 22 : 2,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 4px rgba(153, 153, 153, 0.35)",
              transition: "left 0.2s ease",
            }}
          />
        </div>
        <span style={{ opacity: checked ? 1 : 0.5 }}>{rightLabel}</span>
      </div>
    </button>
  );
}

export default Layout;
