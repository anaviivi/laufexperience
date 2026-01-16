import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./LanguageContext.jsx";
import { ThemeProvider } from "./ThemeContext.jsx";
/* ===================== TEXTE ===================== */
const texts = {
  de: {
    eyebrow: "3D Training",
    title: "3D Lauftraining & Analyse",
    description:
      "Verbessere deine Lauftechnik mit interaktiven 3D-Animationen und verständlichen Erklärungen.",
    analyzeBtn: "Lauftechniken ansehen",
    uploadBtn: "Mögliche Verletzungen",
    eSectionHeading: "E-Learning",
    eTitle: "Interaktives Lernen",
    eSubtitle:
      "Lerne Schritt für Schritt alles über Lauftechnik, Prävention und Performance.",
    eBtn: "Zum E-Learning",
  },
  en: {
    eyebrow: "3D Training",
    title: "3D Running Training & Analysis",
    description:
      "Improve your running technique with interactive 3D animations and clear explanations.",
    analyzeBtn: "View running techniques",
    uploadBtn: "Possible injuries",
    eSectionHeading: "E-Learning",
    eTitle: "Interactive learning",
    eSubtitle:
      "Learn step by step everything about running technique, prevention and performance.",
    eBtn: "Go to E-Learning",
  },
};

/* ===================== STYLES ===================== */
const styles = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "80px 32px 120px",
    textAlign: "left",
  },

  eyebrow: {
    fontSize: 13,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "#5f6265ff",
    marginBottom: 16,
    fontWeight: 700,
  },

  title: {
    fontSize: 52,
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: 22,
    letterSpacing: "-0.02em",
    color: "#606266ff",
  },

  desc: {
    fontSize: 18,
    maxWidth: 720,
    color: "#6d7077ff",
    lineHeight: 1.6,
  },

  heroActions: {
    marginTop: 28,
    marginBottom: 96,
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },

  button: {
    padding: "14px 30px",
    borderRadius: 999,
    border: "none",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },

  eSectionHeading: {
    marginBottom: 14,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: "#64748b",
    fontWeight: 800,
    textAlign: "left",
  },

  eLearning: {
    borderRadius: 26,
    padding: "40px 42px",
    background:
      "linear-gradient(135deg, #0b1e32 0%, #141e36ff 55%, #020617 100%)",
    color: "#e5e7eb",
    boxShadow: "0 20px 60px rgba(132, 138, 164, 0.35)",
    textAlign: "left",
  },
};

export default function Training3DPage() {
  const { language } = useLanguage();
  const t = texts[language] || texts.de;
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <style>{`
        .btn-dark {
          background: #383c4fff;
          color: #caced2ff;
          transition:
            background 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.15s ease;
        }
        .btn-dark:hover {
          box-shadow:
            0 0 0 3px rgba(23, 33, 55, 0.18),
            0 14px 36px rgba(2,6,23,0.35);
          transform: translateY(-2px);
        }
        .btn-dark:active { transform: scale(0.97); }

        .btn-dark-soft {
          background: #f1f5f9;
          color: #020617;
          border: 1px solid rgba(2,6,23,0.12);
          transition:
            background 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.15s ease;
        }
        .btn-dark-soft:hover {
          background: #e2e8f0;
          box-shadow: 0 10px 28px rgba(2,6,23,0.12);
          transform: translateY(-2px);
        }

        @media (max-width: 600px) {
          h1 { font-size: 40px !important; }
        }
      `}</style>

      <div>
        <div style={styles.eyebrow}>{t.eyebrow}</div>
        <h1 style={styles.title}>{t.title}</h1>
        <p style={styles.desc}>{t.description}</p>

        <div style={styles.heroActions}>
          {/* ✅ Absolut navigieren (passt zu deinen Routes in App.jsx) */}
          <button
            type="button"
            className="btn-dark"
            style={styles.button}
            onClick={() => navigate("/lauftechnik")}
          >
            {t.analyzeBtn}
          </button>

          <button
            type="button"
            className="btn-dark-soft"
            style={styles.button}
            onClick={() => navigate("/verletzungen")}
          >
            {t.uploadBtn}
          </button>
        </div>
      </div>

      <div style={styles.eSectionHeading}>{t.eSectionHeading}</div>

      <section style={styles.eLearning}>
        <h2>{t.eTitle}</h2>
        <p>{t.eSubtitle}</p>

        <button
          type="button"
          className="btn-dark"
          style={{ ...styles.button, marginTop: 22 }}
          onClick={() => navigate("/e-learning")}
        >
          {t.eBtn}
        </button>
      </section>
    </div>
  );
}
