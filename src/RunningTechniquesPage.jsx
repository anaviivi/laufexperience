// src/RunningTechniquesPage.jsx
import React, { useMemo, useState } from "react";
import { useLanguage } from "./LanguageContext.jsx";
import { useNavigate } from "react-router-dom";
import { RunnerHero } from "./RunnerHero.jsx"; // 3D-Runner
import { ThemeProvider } from "./ThemeContext.jsx";
const texts = {
  de: {
    eyebrow: "3D Demo – Lauftechnik",
    backLabel: "Zurück zum 3D Training",
    title: "Die 3 Auftrete-Arten im Überblick",
    description:
      "Lerne, wie du richtig aufsetzt – mit 3D-Ansicht, Technik-Hinweisen und klaren Vor- und Nachteilen. Wechsle zwischen Fersenlauf, Mittelfußlauf und Vorfußlauf, um zu sehen, wie sich deine Lauftechnik verändert.",

    // ✅ Controls (unten rechts bei den Buttons)
    speedLabel: "Speed",
    cameraLabel: "Kamera",
    camFront: "Vorne",
    camSide: "Seite",
    camBack: "Hinten",

    modes: {
      heel: {
        label: "Fersenlauf",
        title: "Fersenlauf (Heel Strike)",
        intro:
          "Die Ferse setzt zuerst auf, der Körperschwerpunkt liegt oft hinter dem Fuß. Häufig bei Einsteigern und gemütlichem Tempo zu sehen.",
        pros: [
          "Für Einsteiger oft natürlich und vertraut",
          "Bei langsamem Tempo gut kontrollierbar",
        ],
        cons: [
          "Höhere Stoßbelastung für Knie und Hüfte",
          "Fördert Überstriding, wenn der Schritt zu weit vorn landet",
        ],
      },
      mid: {
        label: "Mittelfußlauf",
        title: "Mittelfußlauf (Midfoot Strike)",
        intro:
          "Ferse und Ballen kommen fast gleichzeitig auf – der Fuß landet näher unter dem Körperschwerpunkt. Häufig eine gute Balance aus Effizienz und Schonung.",
        pros: [
          "Ausgewogene Belastung von Gelenken und Muskulatur",
          "Gut für Tempoläufe und längere Distanzen",
        ],
        cons: [
          "Erfordert anfänglich Technikfokus",
          "Waden- und Fußmuskulatur müssen ausreichend gekräftigt sein",
        ],
      },
      fore: {
        label: "Vorfußlauf",
        title: "Vorfußlauf (Forefoot Strike)",
        intro:
          "Der Ballen setzt zuerst auf, die Ferse berührt den Boden nur wenig oder später. Wird eher bei Sprints und sehr schnellen Läufen genutzt.",
        pros: [
          "Sehr direkte Kraftübertragung und reaktiver Abdruck",
          "Belastung wird stärker über Muskulatur abgefangen",
        ],
        cons: [
          "Hohe Belastung für Waden und Achillessehne",
          "Für lange Distanzen ungeeignet, wenn nicht gut aufgebaut",
        ],
      },
    },

    metricsTitle: "TECHNIK-ÜBERSICHT",
    prosLabel: "Vorteile",
    consLabel: "Nachteile",
    analysisTitle: "Analyse",
    metricImpact: "Stoßbelastung",
    metricCalves: "Waden/Achilles-Last",
    metricEfficiency: "Effizienz",
    metricHint:
      "Hinweis: Werte dienen dem Vergleich (didaktisch), nicht als medizinische Bewertung.",
  },

  en: {
    eyebrow: "3D Demo – Running technique",
    backLabel: "Back to 3D training",
    title: "The 3 foot strike patterns",
    description:
      "Learn how to land correctly – with a 3D-style view, technique cues and clear pros and cons. Switch between heel, midfoot and forefoot strike to see how your running mechanics change.",

    // ✅ Controls (bottom near buttons)
    speedLabel: "Speed",
    cameraLabel: "Camera",
    camFront: "Front",
    camSide: "Side",
    camBack: "Back",

    modes: {
      heel: {
        label: "Heel strike",
        title: "Heel strike",
        intro:
          "Heel hits the ground first, with the center of mass often behind the foot. Common with beginners and at easy paces.",
        pros: [
          "Feels natural for many beginners",
          "Well controllable at slower paces",
        ],
        cons: [
          "Higher impact forces on knee and hip",
          "Encourages overstriding when the foot lands too far in front",
        ],
      },
      mid: {
        label: "Midfoot strike",
        title: "Midfoot strike",
        intro:
          "Heel and ball of the foot touch almost simultaneously, landing closer under the body. Often a good balance of efficiency and joint friendliness.",
        pros: [
          "Balanced load on joints and muscles",
          "Great for tempo runs and longer distances",
        ],
        cons: [
          "Needs some initial technique focus",
          "Requires strong calves and foot muscles",
        ],
      },
      fore: {
        label: "Forefoot strike",
        title: "Forefoot strike",
        intro:
          "Ball of the foot lands first, with the heel only touching lightly or later. Mostly seen in sprints and very fast running.",
        pros: [
          "Very direct power transfer and reactive push-off",
          "More load absorbed by the muscles",
        ],
        cons: [
          "High stress for calves and Achilles tendon",
          "Can be fatiguing on long runs if not well prepared",
        ],
      },
    },

    metricsTitle: "TECHNIQUE OVERVIEW",
    prosLabel: "Pros",
    consLabel: "Cons",
    analysisTitle: "Analysis",
    metricImpact: "Impact load",
    metricCalves: "Calf/Achilles load",
    metricEfficiency: "Efficiency",
    metricHint:
      "Note: values are for comparison/learning, not a medical assessment.",
  },
};

// ✅ Zentrale Mode-Konfiguration: Analyse synced
const MODE_CONFIG = {
  heel: { metrics: { impact: 0.85, calves: 0.35, efficiency: 0.45 } },
  mid: { metrics: { impact: 0.55, calves: 0.55, efficiency: 0.75 } },
  fore: { metrics: { impact: 0.45, calves: 0.85, efficiency: 0.65 } },
};

const styles = {
  page: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "24px 24px 80px",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  eyebrow: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 8,
  },
  backLink: {
    fontSize: 14,
    color: "#4b5563",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  backArrow: { fontSize: 16 },

  mainSection: { display: "flex", gap: 56, alignItems: "stretch" },
  left: { flex: 1 },
  title: { fontSize: 36, fontWeight: 700, marginBottom: 16 },
  desc: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 1.6,
    maxWidth: 580,
    marginBottom: 24,
  },
  areaIntroTitle: { fontSize: 16, fontWeight: 600, marginTop: 16, marginBottom: 6 },
  areaIntroText: { fontSize: 14, color: "#374151", lineHeight: 1.6 },

  metricsCard: {
    marginTop: 28,
    background: "#34506dff",
    borderRadius: 18,
    padding: 18,
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
  },
  metricsTitle: {
    gridColumn: "1 / -1",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#d3d8e4ff",
    marginBottom: 4,
  },
  metricsLabel: { fontSize: 14, fontWeight: 600, marginBottom: 4, color: "#f3f4f6" },
  metricsList: {
    fontSize: 13,
    color: "#c5cdd8ff",
    lineHeight: 1.5,
    paddingLeft: 18,
    margin: 0,
  },

  analysisBox: {
    gridColumn: "1 / -1",
    marginTop: 6,
    paddingTop: 10,
    borderTop: "1px solid rgba(255,255,255,0.12)",
  },
  analysisTitle: { fontSize: 13, fontWeight: 700, color: "#f3f4f6", marginBottom: 8 },
  barRow: { display: "grid", gridTemplateColumns: "160px 1fr 48px", gap: 10, alignItems: "center", marginBottom: 8 },
  barLabel: { fontSize: 12, color: "#e5e7eb" },
  barTrack: {
    height: 10,
    borderRadius: 999,
    background: "rgba(255,255,255,0.16)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    background: "rgba(249,250,251,0.9)",
  },
  barValue: { fontSize: 12, color: "#e5e7eb", textAlign: "right" },
  hint: { marginTop: 6, fontSize: 11, color: "rgba(229,231,235,0.8)", lineHeight: 1.4 },

  // Rechts: 3D-Bereich
  right: {
    flex: 1.1,
    borderRadius: 24,
    backgroundImage:
      "radial-gradient(circle at 20% 20%, rgba(34,148,255,0.45), transparent 55%)," +
      "radial-gradient(circle at 80% 70%, rgba(230, 169, 198, 0.4), transparent 55%)," +
      "linear-gradient(135deg, #889ecdff 0%, #4b515dff 50%, #101726 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 18,
  },
  figureWrapper: { flex: 1, borderRadius: 18, position: "relative", overflow: "hidden" },

  // ✅ Bottom-Bar: alles zusammen
  bottomBar: {
    marginTop: 14,
    alignSelf: "center",
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },

  modeSwitch: {
    background: "rgba(15,23,42,0.9)",
    borderRadius: 999,
    padding: 4,
    display: "flex",
    gap: 4,
  },
  modeBtn: {
    padding: "7px 16px",
    borderRadius: 999,
    border: "none",
    background: "transparent",
    color: "#e5e7eb",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 700,
  },
  modeBtnActive: { background: "#f9fafb", color: "#111827" },

  // ✅ Mini-Controls rechts neben den Mode-Buttons
  miniControls: {
    background: "rgba(15,23,42,0.9)",
    borderRadius: 999,
    padding: "6px 10px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#e5e7eb",
  },
  miniLabel: { fontSize: 12, fontWeight: 800, opacity: 0.95 },
  miniValue: { fontSize: 12, width: 48, textAlign: "right", opacity: 0.9 },
  miniRange: { width: 120 },

  camGroup: { display: "flex", gap: 6 },
  camBtn: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "transparent",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
  },
  camBtnActive: { background: "#f9fafb", color: "#111827", border: "1px solid transparent" },
};

function MetricBar({ label, value }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div style={styles.barRow}>
      <div style={styles.barLabel}>{label}</div>
      <div style={styles.barTrack}>
        <div style={{ ...styles.barFill, width: `${pct}%` }} />
      </div>
      <div style={styles.barValue}>{pct}%</div>
    </div>
  );
}

export default function RunningTechniquesPage() {
  const { language } = useLanguage();
  const t = texts[language];
  const navigate = useNavigate();

  const [mode, setMode] = useState("heel");

  // ✅ NEW: Runner Controls (greifen direkt im RunnerHero)
  const [timeScale, setTimeScale] = useState(1.0);       // Speed
  const [cameraView, setCameraView] = useState("front"); // front|side|back
  const [cameraPadding] = useState(1.0);                 // optional; fix bei 1.0 (kannst du später als Slider machen)

  const current = t.modes[mode];
  const modeConfig = useMemo(() => MODE_CONFIG[mode], [mode]);

  return (
    <div style={styles.page}>
      {/* Top row */}
      <div style={styles.topRow}>
        <div>
          <div style={styles.eyebrow}>{t.eyebrow}</div>
        </div>

        <div style={styles.backLink} onClick={() => navigate("/3d-training")}>
          <span style={styles.backArrow}>←</span>
          <span>{t.backLabel}</span>
        </div>
      </div>

      {/* Main layout */}
      <section style={styles.mainSection}>
        {/* LEFT */}
        <div style={styles.left}>
          <h1 style={styles.title}>{t.title}</h1>
          <p style={styles.desc}>{t.description}</p>

          <div>
            <div style={styles.areaIntroTitle}>{current.title}</div>
            <p style={styles.areaIntroText}>{current.intro}</p>
          </div>

          {/* Pros/Cons + Analyse */}
          <div style={styles.metricsCard}>
            <div style={styles.metricsTitle}>{t.metricsTitle}</div>

            <div>
              <div style={styles.metricsLabel}>{t.prosLabel}</div>
              <ul style={styles.metricsList}>
                {current.pros.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <div style={styles.metricsLabel}>{t.consLabel}</div>
              <ul style={styles.metricsList}>
                {current.cons.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div style={styles.analysisBox}>
              <div style={styles.analysisTitle}>{t.analysisTitle}</div>
              <MetricBar label={t.metricImpact} value={modeConfig.metrics.impact} />
              <MetricBar label={t.metricCalves} value={modeConfig.metrics.calves} />
              <MetricBar label={t.metricEfficiency} value={modeConfig.metrics.efficiency} />
              <div style={styles.hint}>{t.metricHint}</div>
            </div>
          </div>
        </div>

        {/* RIGHT: 3D */}
        <div style={styles.right}>
          <div style={styles.figureWrapper}>
            <div style={{ position: "absolute", inset: 0 }}>
              <RunnerHero
                key={`${mode}-${cameraView}`} // optional remount
                showControls={false}
                interactive={true}
                selectedMode={mode}           // heel|mid|fore
                timeScale={timeScale}         // ✅ Speed greift
                cameraView={cameraView}       // ✅ Kamera greift
                cameraPadding={cameraPadding} // ✅ Zoom/Distance
                targetMode={mode}             // ✅ Marker folgt Strike (heel/mid/fore)
                showJointMarker={true}        // ✅ echter 3D Marker (statt Linie/Overlay)
              />
            </div>
          </div>

          {/* ✅ Alles unten zusammen (Mode + Kamera + Speed) */}
          <div style={styles.bottomBar}>
            {/* Mode Buttons */}
            <div style={styles.modeSwitch}>
              {["heel", "mid", "fore"].map((key) => {
                const isActive = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    style={{
                      ...styles.modeBtn,
                      ...(isActive ? styles.modeBtnActive : {}),
                    }}
                  >
                    {t.modes[key].label}
                  </button>
                );
              })}
            </div>

            {/* Kamera + Speed Controls */}
            <div style={styles.miniControls}>
              <span style={styles.miniLabel}>{t.cameraLabel}:</span>
              <div style={styles.camGroup}>
                {["front", "side", "back"].map((v) => {
                  const active = cameraView === v;
                  const label =
                    v === "front" ? t.camFront : v === "side" ? t.camSide : t.camBack;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCameraView(v)}
                      style={{ ...styles.camBtn, ...(active ? styles.camBtnActive : {}) }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <span style={{ opacity: 0.5 }}>•</span>

              <span style={styles.miniLabel}>{t.speedLabel}</span>
              <input
                style={styles.miniRange}
                type="range"
                min={0.2}
                max={1.8}
                step={0.05}
                value={timeScale}
                onChange={(e) => setTimeScale(parseFloat(e.target.value))}
              />
              <span style={styles.miniValue}>{timeScale.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
