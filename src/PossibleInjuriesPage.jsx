// src/PossibleInjuriesPage.jsx
import React, { useCallback, useMemo, useState } from "react";
import { useLanguage } from "./LanguageContext.jsx";
import { useNavigate } from "react-router-dom";
import { RunnerHero } from "./RunnerHero.jsx";
import { useTheme } from "./ThemeContext.jsx";
function getProfileGender() {
  try {
    const raw = localStorage.getItem("userProfile");
    if (!raw) return "male";
    const p = JSON.parse(raw);
    return p?.gender === "female" ? "female" : "male";
  } catch {
    return "male";
  }
}

const texts = {
  de: {
    eyebrow: "3D Analyse – Verletzungsrisiken",
    backLabel: "Zurück",
    title: "Mögliche Laufverletzungen",
    description:
      "Typische Problemzonen beim Laufen. Wähle einen Bereich, um Risikofaktoren und Prävention zu sehen.",
    riskLabel: "Risikofaktoren",
    prevLabel: "Prävention",
    overlay: {
      label: "Belasteter Bereich",
      hint: "Rot markiert = erhöhte Belastung",
    },
    areas: {
      knee: {
        label: "Knie",
        title: "Kniegelenk",
        intro: "Das Knie ist besonders bei starkem Fersenlauf und Überstriding belastet.",
        risk: [
          "Hohe Stoßbelastung",
          "Schritt zu weit vor dem Körperschwerpunkt",
          "Schwache Hüft- und Gesäßmuskulatur",
        ],
        prev: ["Schrittfrequenz erhöhen", "Kräftigung von Hüfte & Gesäß", "Weicherer Fußaufsatz"],
      },
      shin: {
        label: "Schienbein",
        title: "Schienbein (Tibia)",
        intro: "Das Schienbein reagiert empfindlich auf harte Untergründe und schnelle Belastungssteigerung.",
        risk: ["Zu schneller Trainingsaufbau", "Harte Böden", "Unzureichende Dämpfung"],
        prev: ["Belastung langsam steigern", "Untergrund variieren", "Fuß- und Unterschenkelmuskulatur stärken"],
      },
      achilles: {
        label: "Achillessehne",
        title: "Achillessehne",
        intro: "Die Achillessehne wird besonders beim Vorfußlauf stark beansprucht.",
        risk: ["Hohe Zugbelastung", "Plötzlicher Technikwechsel", "Verkürzte Wadenmuskulatur"],
        prev: ["Waden regelmäßig dehnen", "Exzentrisches Training", "Technikwechsel langsam durchführen"],
      },
    },
  },
  en: {
    eyebrow: "3D analysis – injury risks",
    backLabel: "Back",
    title: "Common running injuries",
    description:
      "Typical problem areas in running. Select a region to learn about risks and prevention.",
    riskLabel: "Risk factors",
    prevLabel: "Prevention",
    overlay: {
      label: "Loaded area",
      hint: "Red highlight = increased load",
    },
    areas: {
      knee: {
        label: "Knee",
        title: "Knee joint",
        intro: "The knee is heavily loaded with strong heel striking and overstriding.",
        risk: ["High impact forces", "Foot landing too far in front", "Weak hip and glute muscles"],
        prev: ["Increase cadence", "Strengthen hips & glutes", "Softer landing pattern"],
      },
      shin: {
        label: "Shin",
        title: "Shin (tibia)",
        intro: "The shin reacts sensitively to hard surfaces and rapid load increases.",
        risk: ["Rapid training progression", "Hard running surfaces", "Insufficient shock absorption"],
        prev: ["Gradual load progression", "Vary surfaces", "Strengthen lower leg muscles"],
      },
      achilles: {
        label: "Achilles tendon",
        title: "Achilles tendon",
        intro: "The Achilles tendon is highly stressed, especially during forefoot running.",
        risk: ["High tensile load", "Sudden technique changes", "Tight calf muscles"],
        prev: ["Regular calf stretching", "Eccentric strength training", "Gradual technique changes"],
      },
    },
  },
};

const AREA_KEYS = ["knee", "shin", "achilles"];

// ✅ nur kleiner Zoom in die Richtung (kein Marker / keine Kreise)
const cameraPaddingByArea = {
  knee: 0.88,
  shin: 0.86,
  achilles: 0.86,
};

const styles = {
  page: { maxWidth: 1180, margin: "0 auto", padding: "24px 24px 80px" },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    gap: 12,
  },

  eyebrow: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 8,
    textAlign: "left",
  },

  backBtn: {
    fontSize: 14,
    color: "#2a2f3bff",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(72, 73, 80, 0.78)",
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 10px 24px rgba(2,6,23,0.08)",
    padding: "9px 12px",
    borderRadius: 14,
    backdropFilter: "blur(10px)",
  },

  mainSection: { display: "flex", gap: 44, alignItems: "stretch", flexWrap: "wrap" },

  left: { flex: "1 1 420px", minWidth: 320 },

  title: {
    fontSize: 36,
    fontWeight: 780,
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 1.08,
    textAlign: "left",
  },

  desc: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 1.7,
    maxWidth: 620,
    marginBottom: 18,
    textAlign: "left",
  },

  infoTitle: {
    marginTop: 6,
    marginBottom: 8,
    fontSize: 18,
    letterSpacing: -0.2,
    textAlign: "left",
  },

  intro: {
    marginTop: 0,
    color: "#334155",
    lineHeight: 1.65,
    textAlign: "left",
    maxWidth: 640,
  },

  metricsCard: {
    marginTop: 16,
    background: "rgba(255,255,255,0.70)",
    borderRadius: 18,
    padding: 16,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 18px 45px rgba(2,6,23,0.12)",
    backdropFilter: "blur(12px)",
    alignItems: "start",
    textAlign: "left",
  },

  col: { minWidth: 0, textAlign: "left" },

  list: {
    margin: "8px 0 0",
    paddingLeft: 18,
    lineHeight: 1.6,
    textAlign: "left",
  },

  right: {
    flex: "1.1 1 520px",
    minWidth: 320,
    borderRadius: 24,
    background:
      "radial-gradient(circle at 20% 20%, rgba(34,148,255,0.35), transparent 55%)," +
      "radial-gradient(circle at 80% 70%, rgba(248,113,113,0.28), transparent 55%)," +
      "linear-gradient(135deg, rgba(219,234,254,0.9), rgba(254,202,202,0.75))",
    border: "1px solid rgba(15,23,42,0.10)",
    boxShadow: "0 24px 60px rgba(2,6,23,0.16)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 14,
  },

  figureWrapper: {
    flex: 1,
    minHeight: 420,
    borderRadius: 18,
    position: "relative",
    overflow: "hidden",
    background: "rgba(255,255,255,0.35)",
  },

  // ✅ Overlay im 3D-Fenster
  overlay: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 30,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 16px 40px rgba(2,6,23,0.28)",
    maxWidth: 260,
    pointerEvents: "none",
  },

  overlayTop: { display: "flex", gap: 10, alignItems: "center", marginBottom: 6 },

  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "rgba(239,68,68,0.95)",
    boxShadow: "0 0 0 4px rgba(239,68,68,0.25)",
    flex: "0 0 auto",
  },

  overlayTitle: { fontWeight: 800, fontSize: 13, letterSpacing: 0.2, margin: 0 },
  overlayHint: { margin: 0, fontSize: 12, opacity: 0.9, lineHeight: 1.35 },

  modeSwitch: {
    marginTop: 14,
    alignSelf: "center",
    background: "rgba(15,23,42,0.92)",
    borderRadius: 999,
    padding: 5,
    display: "flex",
    gap: 6,
    boxShadow: "0 16px 40px rgba(2,6,23,0.22)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  modeBtn: {
    padding: "8px 16px",
    borderRadius: 999,
    border: "none",
    background: "transparent",
    color: "rgba(226,232,240,0.95)",
    fontSize: 13,
    cursor: "pointer",
    transition: "transform 120ms ease, background 120ms ease",
  },

  modeBtnActive: {
    background: "rgba(255,255,255,0.96)",
    color: "#0b1220",
    transform: "translateY(-1px)",
    boxShadow: "0 10px 24px rgba(2,6,23,0.22)",
  },
};

export default function PossibleInjuriesPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const t = texts[language] ?? texts.en;

  const gender = useMemo(() => getProfileGender(), []);
  const [activeArea, setActiveArea] = useState("knee");

  const area = useMemo(() => t.areas?.[activeArea] ?? t.areas.knee, [t, activeArea]);

  const onBack = useCallback(() => navigate("/3d-training"), [navigate]);
  const onSelectArea = useCallback((key) => setActiveArea(key), []);

  const pad = cameraPaddingByArea[activeArea] ?? 1.0;

  return (
    <div style={styles.page}>
      <div style={styles.topRow}>
        <div>
          <div style={styles.eyebrow}>{t.eyebrow}</div>
        </div>

        <button type="button" style={styles.backBtn} onClick={onBack} aria-label={t.backLabel}>
          <span aria-hidden="true">←</span>
          <span>{t.backLabel}</span>
        </button>
      </div>

      <section style={styles.mainSection}>
        <div style={styles.left}>
          <h1 style={styles.title}>{t.title}</h1>
          <p style={styles.desc}>{t.description}</p>

          <h2 style={styles.infoTitle}>{area.title}</h2>
          <p style={styles.intro}>{area.intro}</p>

          <div style={styles.metricsCard} role="region" aria-label={`${area.title}: ${t.riskLabel} & ${t.prevLabel}`}>
            <div style={styles.col}>
              <strong>{t.riskLabel}</strong>
              <ul style={styles.list}>
                {area.risk.map((r, i) => (
                  <li key={`${activeArea}-risk-${i}`}>{r}</li>
                ))}
              </ul>
            </div>

            <div style={styles.col}>
              <strong>{t.prevLabel}</strong>
              <ul style={styles.list}>
                {area.prev.map((p, i) => (
                  <li key={`${activeArea}-prev-${i}`}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div style={styles.right}>
          <div style={styles.figureWrapper} aria-label="3D runner model">
            {/* ✅ Overlay: macht sofort klar, was die Markierung bedeutet */}
            <div style={styles.overlay} aria-hidden="true">
              <div style={styles.overlayTop}>
                <span style={styles.badgeDot} />
                <p style={styles.overlayTitle}>{t.overlay?.label ?? "Loaded area"}</p>
              </div>
              <p style={styles.overlayHint}>
                <strong style={{ fontWeight: 800 }}>{area.title}:</strong> {t.overlay?.hint ?? "Red highlight = increased load"}
              </p>
            </div>

            <RunnerHero
              key={`injury-${activeArea}`}
              selectedMode="injury"
              gender={gender}
              timeScale={0.18}
              followArea={activeArea} // knee | shin | achilles

              // ❌ keine Punkte/Marker (wie vorher)
              showJointMarker={false}
              showControls={false}

              // ✅ kleiner Zoom je nach Bereich
              cameraPadding={pad}

              // ✅ OPTIONAL (nur relevant, wenn deine RunnerHero.jsx diese Props unterstützt)
              emphasizeInjuries={true}
              injuryPulse={true}
              injuryDimOthers={true}
              injuryOthersOpacity={0.22}
              injuryColor="#ef4444"
              injuryEmissive="#7f1d1d"
              injuryBaseEmissiveIntensity={0.55}
            />
          </div>

          <div style={styles.modeSwitch} role="tablist" aria-label="Injury area selection">
            {AREA_KEYS.map((key) => {
              const isActive = activeArea === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectArea(key)}
                  aria-pressed={isActive}
                  role="tab"
                  style={{ ...styles.modeBtn, ...(isActive ? styles.modeBtnActive : {}) }}
                >
                  {t.areas[key].label}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
