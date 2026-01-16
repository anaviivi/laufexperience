// src/MainPage.jsx
import React, { useState } from "react";
import { useLanguage } from "./LanguageContext.jsx";
import aboutImg from "./assets/About.png";
import { Link } from "react-router-dom";
import { RunnerHero } from "./RunnerHero.jsx";

const texts = {
  de: {
    eyebrow: "Smart Running Coach",
    titleLine1: "Verbessere deine",
    titleLine2: "Lauftechnik",
    description:
      "Interaktive 3D-Visualisierungen, personalisiertes Coaching und Gamification für nachhaltiges Lauftraining – direkt im Browser.",
    primaryBtn: "Jetzt starten",
    secondaryBtn: "Demo ansehen",

    featuresTitle: "Was dich erwartet",
    f1Title: "3D Laufanalyse",
    f1Text:
      "Sieh deine Bewegung aus jedem Winkel und erkenne sofort, welche Bereiche du verbessern kannst.",
    f2Title: "Individuelles Coaching",
    f2Text:
      "KI-basierte Empfehlungen zu Technik, Training und Regeneration, abgestimmt auf dein Level.",
    f3Title: "Motivierendes Feedback",

    aboutEyebrow: "LEARN MORE",
    aboutTitle: "Über uns",
    aboutText1:
      "Wir kombinieren Sportwissenschaft, moderne Technologie und didaktische Konzepte, um Lauftraining greifbar zu machen. Statt trockener Theorie bekommst du konkrete, visuelle Hinweise, die du direkt in deinem nächsten Lauf umsetzen kannst. Egal ob Einsteiger oder ambitionierte Läufer: Unser Ziel ist, dass du effizienter, gesünder und mit mehr Spaß läufst.",

    c1Title: "10 km Aufbauprogramm",
    c2Title: "Streak: 3 Läufe pro Woche",
    c3Title: "Technik-Challenge: Schrittfrequenz",

    ctaTitle: "Bereit für deinen nächsten Lauf?",
    ctaText: "Lege deine Ziele fest und starte deinen Fortschritt.",
    ctaBtn: "Zum Dashboard",
  },

  en: {
    eyebrow: "Smart Running Coach",
    titleLine1: "Improve your",
    titleLine2: "running technique",
    description:
      "Interactive 3D visualizations, personalized coaching and gamification for sustainable running training – right in your browser.",
    primaryBtn: "Start now",
    secondaryBtn: "Watch demo",

    featuresTitle: "What awaits you",
    f1Title: "3D Running Analysis",
    f1Text:
      "See your movement from every angle and instantly detect what can be improved.",
    f2Title: "Individual Coaching",
    f2Text:
      "AI-based recommendations for technique, training and recovery adapted to your level.",
    f3Text:
      "Levels, achievements and progress bars keep you motivated over time.",
    f3Title: "Motivating Feedback",

    c1Title: "10k build-up plan",
    c2Title: "Streak: 3 runs per week",
    c3Title: "Technique challenge: cadence",

    ctaTitle: "Ready for your next run?",
    ctaText: "Set your goals and start progressing.",
    ctaBtn: "Go to dashboard",
  },
};

const styles = {
  // Full-Width Hintergrund
  page: {
    width: "100vw",
    margin: 0,
    padding: "0 0 80px",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
  },
  // Zentrierter Inhalt wie im Header
  pageInner: {
    width: "100%",
    maxWidth: "1400px",
    padding: "40px 16px 0", // 16px links/rechts, damit es mit dem Header fluchtet
    boxSizing: "border-box",
  },


  hero: {
    display: "flex",
    gap: "56px",
    alignItems: "center",
  },

  // ⬇️ HIER: Hero-Textbereich links ausrichten
  heroLeft: {
    flex: 1,
    textAlign: "left",
  },

  heroEyebrow: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 8,
  },

  // ⬇️ HIER: Überschrift explizit linksbündig
  heroTitle: {
    fontSize: 44,
    lineHeight: 1.1,
    marginBottom: 16,
    fontWeight: 700,
    color: "#54555aff",
    textAlign: "left",
  },

  heroText: {
    fontSize: 16,
    lineHeight: 1.6,
    color: "#4b5563",
    maxWidth: 460,
    textAlign: "left",
  },

  // ...

  heroActions: {
    marginTop: 28,
    display: "flex",
    gap: 12,
    alignItems: "left",
  },
  primaryBtn: {
    padding: "12px 22px",
    background: "#0b1e32",
    color: "#ffffff",
    borderRadius: 999,
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 500,
  },
  ghostBtn: {
    padding: "11px 20px",
    borderRadius: 999,
    border: "1px solid #cbd5f5",
    background: "white",
    cursor: "pointer",
    fontSize: 14,
    color: "#111827",
  },

  heroRight: {
    flex: 1.1,
    height: 380,
    borderRadius: 24,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundImage:
      "radial-gradient(circle at 20% 20%, rgba(34,148,255,0.45), transparent 55%)," +
      "radial-gradient(circle at 80% 70%, rgba(27, 220, 230, 0.4), transparent 55%)," +
      "linear-gradient(135deg, #9a9b9eff 0%, #8b95a8ff 50%, #74777dff 100%)",
  },

  // FEATURES
  featuresSection: { marginTop: 60 },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 20,
    marginTop: 24,
  },
  featureCard: {
    background: "#72869aff",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
  },
  featureTitle: { fontSize: 16, fontWeight: 600, marginBottom: 8 },
  featureText: { fontSize: 14, color: "#2f343bff", lineHeight: 1.5 },

  // ABOUT
  aboutSection: {
    marginTop: 72,
    padding: "40px 32px",
    borderRadius: 24,
    background: "#72869aff",
    display: "grid",
    gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
    gap: 48,
    alignItems: "center",
  },
  aboutContent: {
    textAlign: "left",
  },
  aboutEyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#40444bff",
  },
  aboutTitle: { marginTop: 8, fontSize: 28, fontWeight: 600 },
  aboutText: {
    marginTop: 16,
    lineHeight: 1.7,
    color: "#34393fff",
    fontSize: 15,
    maxWidth: 560,
  },
  aboutImgWrapper: {
    justifySelf: "center",
  },
  aboutImg: {
    width: "100%",
    maxWidth: 260,
    height: "auto",
    display: "block",
    margin: "0 auto",
    borderRadius: 20,
    objectFit: "cover",
    boxShadow: "0 18px 45px rgba(15,23,42,0.25)",
  },

  // CTA
  ctaSection: {
    marginTop: 80,
    padding: "26px 28px",
    borderRadius: 24,
    background: "linear-gradient(90deg,#0b1e32,#1f2937)",
    color: "#4a5464ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },
  ctaTitle: { fontSize: 22, fontWeight: 600, marginBottom: 6 },
  ctaText: { fontSize: 14, opacity: 0.9, maxWidth: 420 },
};

export default function MainPage() {
  const { language } = useLanguage();
  const t = texts[language];

  const [hovered, setHovered] = useState(null); // "start" | "demo" | "cta" | null

  const isLoggedIn =
    typeof window !== "undefined" &&
    !!window.localStorage.getItem("authToken");

  const challenges = [
    { id: 1, name: t.c1Title, progress: 72 },
    { id: 2, name: t.c2Title, progress: 45 },
    { id: 3, name: t.c3Title, progress: 30 },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.pageInner}>
        {/* HERO */}
        <section style={styles.hero}>
          <div style={styles.heroLeft}>
            <div style={styles.heroEyebrow}>{t.eyebrow}</div>
            <h1 style={styles.heroTitle}>
              {t.titleLine1}
              <br />
              {t.titleLine2}
            </h1>
            <p style={styles.heroText}>{t.description}</p>

            <div style={styles.heroActions}>
              <Link to="/3d-training" style={{ textDecoration: "none" }}>
                <button
                  style={
                    hovered === "start" ? styles.ghostBtn : styles.primaryBtn
                  }
                  onMouseEnter={() => setHovered("start")}
                  onMouseLeave={() => setHovered(null)}
                >
                  {t.primaryBtn}
                </button>
              </Link>

              <Link to="/demo" style={{ textDecoration: "none" }}>
                <button
                  style={
                    hovered === "demo" ? styles.ghostBtn : styles.primaryBtn
                  }
                  onMouseEnter={() => setHovered("demo")}
                  onMouseLeave={() => setHovered(null)}
                >
                  {t.secondaryBtn}
                </button>
              </Link>
            </div>
          </div>

          <div style={styles.heroRight}>
            <RunnerHero showControls={false} />
          </div>
        </section>

        {/* FEATURES */}
        <section style={styles.featuresSection}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>{t.featuresTitle}</h3>

          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <h4 style={styles.featureTitle}>{t.f1Title}</h4>
              <p style={styles.featureText}>{t.f1Text}</p>
            </div>
            <div style={styles.featureCard}>
              <h4 style={styles.featureTitle}>{t.f2Title}</h4>
              <p style={styles.featureText}>{t.f2Text}</p>
            </div>
            <div style={styles.featureCard}>
              <h4 style={styles.featureTitle}>{t.f3Title}</h4>
              <p style={styles.featureText}>{t.f3Text}</p>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section style={styles.aboutSection}>
          <div style={styles.aboutContent}>
            <div style={styles.aboutEyebrow}>{t.aboutEyebrow}</div>
            <h2 style={styles.aboutTitle}>{t.aboutTitle}</h2>
            <p style={styles.aboutText}>{t.aboutText1}</p>
          </div>

          <div style={styles.aboutImgWrapper}>
            <img
              src={aboutImg}
              alt="LaufXperience About"
              style={styles.aboutImg}
            />
          </div>
        </section>

        {/* CTA */}
        <section style={styles.ctaSection}>
          <div>
            <div style={styles.ctaTitle}>{t.ctaTitle}</div>
            <div style={styles.ctaText}>{t.ctaText}</div>
          </div>

          <Link to="/dashboard" style={{ textDecoration: "none" }}>
            <button
              style={hovered === "cta" ? styles.ghostBtn : styles.primaryBtn}
              onMouseEnter={() => setHovered("cta")}
              onMouseLeave={() => setHovered(null)}
            >
              {t.ctaBtn}
            </button>
          </Link>
        </section>
      </div>
    </div>
  );
}
