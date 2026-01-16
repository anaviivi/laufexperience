// src/RunnerDemo.jsx
import React, { useMemo, useState } from "react";
import { RunnerHero } from "./RunnerHero.jsx";
import { Link } from "react-router-dom";
import { useLanguage } from "./LanguageContext.jsx";
import { useTheme } from "./ThemeContext.jsx";

/* -------------------------------------------------- */
/* Text                                                */
/* -------------------------------------------------- */
const copy = {
  de: {
    title: "3D Demo – Lauftechnik",
    back: "← Zurück zur Startseite",
    intro:
      "Wechsle zwischen verschiedenen Laufgeschwindigkeiten und beobachte Unterschiede in Bewegungsfluss, Bodenkontakt und Stabilität. Nutze die Demo wie eine kleine Technik-Checkliste: Schau dir an, wie sich Rhythmus, Armführung und Haltung mit dem Tempo verändern.",
    extra:
      "Tipp: Achte zuerst auf den Oberkörper (ruhig & stabil), dann auf die Schritte (kurz & elastisch) und zuletzt auf die Arme (locker & geführt). Kleine Änderungen wirken oft größer, als man denkt.",
    observeTitle: "Worauf du achten kannst",
    observe: [
      "Bodenkontakt: weich vs. „stampfen“",
      "Schrittlänge: kurz/elastisch vs. zu weit vorn",
      "Arme: locker geführt vs. zu steif",
      "Oberkörper: stabil vs. zu viel Rotation",
    ],
    modes: {
      easy: {
        label: "Easy Run",
        desc: "Locker, ruhig und rhythmisch – ideal für Erholung und saubere Technik. Der Fokus liegt auf entspannter Haltung, gleichmäßigem Schritt und minimaler Spannung.",
        hint: "Regeneration · Ruhiger Ablauf",
      },
      tempo: {
        label: "Tempo",
        desc: "Dynamischer, effizienter Laufstil – kürzere Bodenkontaktzeit und aktiverer Armeinsatz. Hier siehst du oft den besten „Sweet Spot“ aus Spannung und Leichtigkeit.",
        hint: "Effizienz · Kürzere Kontaktzeit",
      },
      sprint: {
        label: "Sprint",
        desc: "Schneller, aber kontrolliert – kraftvoll, ohne hektisch zu wirken. Mehr Vortrieb, aber weiterhin sauberer Bewegungsfluss.",
        hint: "Kontrolliert schneller · Nicht übertrieben",
      },
    },
  },
  en: {
    title: "3D Demo – Running Technique",
    back: "← Back to home",
    intro:
      "Switch between different running speeds and observe changes in motion flow, ground contact, and stability. Use it like a quick technique checklist: posture, cadence, arms, and stride behavior.",
    extra:
      "Tip: Look at the torso first (steady & stable), then the steps (short & springy), and finally the arms (relaxed & guided). Small tweaks often have a big visual impact.",
    observeTitle: "What to look for",
    observe: [
      "Ground contact: soft vs. “slapping”",
      "Stride length: short/springy vs. overreaching",
      "Arms: relaxed swing vs. stiff",
      "Torso: stable vs. excessive rotation",
    ],
    modes: {
      easy: {
        label: "Easy Run",
        desc: "Relaxed and smooth — perfect for recovery and clean mechanics. The focus is on an easy posture, even rhythm, and minimal tension.",
        hint: "Recovery · Smooth rhythm",
      },
      tempo: {
        label: "Tempo",
        desc: "More dynamic and efficient — shorter ground contact and active arm swing. Often the best “sweet spot” between tension and ease.",
        hint: "Efficiency · Shorter contact",
      },
      sprint: {
        label: "Sprint",
        desc: "Faster but controlled — powerful without looking hectic. More drive, still keeping a clean flow.",
        hint: "Controlled speed-up · Not overdone",
      },
    },
  },
};

/* -------------------------------------------------- */
/* Mode Mapping (Sprint = sanft)                       */
/* -------------------------------------------------- */
const MODE_TO_SELECTED = {
  easy: "easy_run",
  tempo: "tempo_run",
  sprint: "sprint_run",
};

function modeColor(mode) {
  if (mode === "easy") return "rgba(59,130,246,0.95)";
  if (mode === "tempo") return "rgba(245,158,11,0.95)";
  return "rgba(239,68,68,0.95)";
}

/* -------------------------------------------------- */
/* Small helper: hex -> rgba                           */
/* -------------------------------------------------- */
function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== "string") return `rgba(0,0,0,${alpha})`;
  const h = hex.replace("#", "").trim();
  const isShort = h.length === 3;
  const full = isShort
    ? h
        .split("")
        .map((c) => c + c)
        .join("")
    : h;

  if (full.length !== 6) return `rgba(0,0,0,${alpha})`;

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* -------------------------------------------------- */
/* Styles (theme-aware)                                */
/* -------------------------------------------------- */
function createStyles({ colors, isDark }) {
  const cardGlass = hexToRgba(colors.card, isDark ? 0.82 : 0.72);
  const cardGlassStrong = hexToRgba(
    colors.card7ed ?? colors.card,
    isDark ? 0.92 : 0.86
  );

  const ink = colors.text;
  const muted = colors.muted;

  const demoBg = isDark
    ? [
        "radial-gradient(circle at 18% 20%, rgba(59,130,246,0.38), transparent 56%)",
        "radial-gradient(circle at 82% 72%, rgba(236,72,153,0.30), transparent 58%)",
        "radial-gradient(circle at 55% 10%, rgba(34,197,94,0.18), transparent 62%)",
        "linear-gradient(135deg, #111827 0%, #0b1220 55%, #020617 100%)",
      ].join(",")
    : [
        "radial-gradient(circle at 18% 18%, rgba(59,130,246,0.18), transparent 62%)",
        "radial-gradient(circle at 82% 72%, rgba(236,72,153,0.14), transparent 64%)",
        "radial-gradient(circle at 58% 10%, rgba(34,197,94,0.10), transparent 68%)",
        `linear-gradient(135deg, ${colors.soft} 0%, ${colors.bg} 55%, ${colors.soft} 100%)`,
      ].join(",");

  const topFade = isDark
    ? "linear-gradient(180deg, rgba(2,6,23,0.55) 0%, rgba(2,6,23,0.10) 44%, rgba(2,6,23,0.55) 100%)"
    : "linear-gradient(180deg, rgba(248,250,252,0.65) 0%, rgba(248,250,252,0.08) 44%, rgba(248,250,252,0.65) 100%)";

  return {
    page: {
      maxWidth: "1180px",
      margin: "0 auto",
      padding: "44px 24px 88px",
    },

    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 16,
      marginBottom: 22,
    },

    title: {
      fontSize: 46,
      fontWeight: 760,
      margin: 0,
      color: ink,
      letterSpacing: -0.6,
      lineHeight: 1.05,
    },

    backLink: {
      fontSize: 14,
      color: colors.headerText ?? ink,
      textDecoration: "none",
      padding: "8px 12px",
      borderRadius: 999,
      border: `1px solid ${colors.border}`,
      background: hexToRgba(colors.panelBg ?? colors.card, isDark ? 0.55 : 0.72),
      boxShadow: colors.shadow,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      transition: "transform 120ms ease, box-shadow 120ms ease",
    },

    contentRow: {
      display: "flex",
      gap: 34,
      alignItems: "flex-start",
    },

    /* LEFT */
    textCol: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      alignItems: "stretch",
    },

    leftCard: {
      borderRadius: 22,
      border: `1px solid ${colors.border}`,
      background: cardGlass,
      boxShadow: colors.panelShadow ?? colors.shadow,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      padding: "18px 18px 16px",
      textAlign: "left",
    },

    intro: {
      margin: 0,
      color: ink,
      fontSize: 16,
      lineHeight: 1.8,
      maxWidth: 560,
    },

    extra: {
      margin: "10px 0 0",
      color: muted,
      fontSize: 14,
      lineHeight: 1.75,
      maxWidth: 560,
    },

    sectionTitle: {
      margin: "16px 0 10px",
      fontSize: 12.5,
      fontWeight: 900,
      letterSpacing: 0.25,
      textTransform: "none",
      color: muted,
      display: "flex",
      alignItems: "center",
      gap: 10,
    },

    sectionBar: {
      width: 10,
      height: 10,
      borderRadius: 999,
      background: isDark ? "rgba(96,165,250,0.90)" : "rgba(59,130,246,0.85)",
      boxShadow: isDark
        ? "0 10px 24px rgba(59,130,246,0.22)"
        : "0 10px 24px rgba(59,130,246,0.18)",
      flex: "0 0 auto",
    },

    bulletList: {
      margin: 0,
      paddingLeft: 18,
      maxWidth: 560,
      color: ink,
      lineHeight: 1.8,
      fontSize: 14.5,
      textAlign: "left",
    },

    modeBlock: {
      marginTop: 14,
      borderRadius: 22,
      border: `1px solid ${colors.border}`,
      background: cardGlassStrong,
      boxShadow: colors.panelShadow ?? colors.shadow,
      padding: "16px 16px 14px",
      textAlign: "left",
    },

    modeTitleRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 8,
    },

    modeTitle: {
      fontSize: 20,
      fontWeight: 900,
      margin: 0,
      color: ink,
      letterSpacing: -0.2,
    },

    modeHint: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      width: "fit-content",
      padding: "6px 10px",
      borderRadius: 999,
      border: `1px solid ${colors.border}`,
      background: hexToRgba(colors.soft, isDark ? 0.35 : 0.75),
      color: ink,
      fontSize: 12,
      fontWeight: 900,
      letterSpacing: 0.3,
      whiteSpace: "nowrap",
    },

    dot: { width: 9, height: 9, borderRadius: 999, display: "inline-block" },

    modeDesc: {
      margin: 0,
      color: muted,
      fontSize: 14.5,
      lineHeight: 1.75,
      maxWidth: 560,
    },

    /* RIGHT */
    demoCol: {
      flex: 1.2,
      height: 560,
      marginTop: 8,
      borderRadius: 28,
      position: "relative",
      overflow: "hidden",
      border: `1px solid ${colors.borderSubtle ?? colors.border}`,
      boxShadow: colors.panelShadow ?? colors.shadow,
      background: demoBg,
    },

    topFade: {
      position: "absolute",
      inset: 0,
      background: topFade,
      pointerEvents: "none",
      zIndex: 2,
    },

    demoHintOverlay: {
      position: "absolute",
      left: 16,
      right: 16,
      top: 16,
      zIndex: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      pointerEvents: "none",
    },

    demoBadge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      borderRadius: 999,
      border: `1px solid ${hexToRgba("#ffffff", isDark ? 0.18 : 0.22)}`,
      background: isDark ? "rgba(2,6,23,0.45)" : hexToRgba(colors.card, 0.70),
      color: isDark ? "rgba(255,255,255,0.90)" : ink,
      fontSize: 12.5,
      fontWeight: 900,
      letterSpacing: 0.2,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      textShadow: isDark ? "0 10px 30px rgba(0,0,0,0.35)" : "none",
    },

    demoSmall: {
      color: isDark ? "rgba(255,255,255,0.70)" : muted,
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 0.2,
    },

    buttonRow: {
      position: "absolute",
      bottom: 16,
      left: 16,
      right: 16,
      display: "flex",
      justifyContent: "center",
      gap: 12,
      zIndex: 15,
      flexWrap: "wrap",
    },

    btn: {
      padding: "10px 18px",
      borderRadius: 999,
      border: isDark
        ? "1px solid rgba(255,255,255,0.20)"
        : `1px solid ${colors.border}`,
      background: isDark ? "rgba(2,6,23,0.42)" : hexToRgba(colors.card, 0.70),
      color: isDark ? "rgba(255,255,255,0.92)" : ink,
      fontSize: 14,
      fontWeight: 900,
      cursor: "pointer",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      boxShadow: isDark
        ? "0 14px 22px rgba(0,0,0,0.22)"
        : colors.shadow ?? "0 10px 24px rgba(15,23,42,0.10)",
      transition: "transform 120ms ease, background 120ms ease, border 120ms ease",
    },

    btnActive: {
      background: isDark ? "rgba(255,255,255,0.92)" : ink,
      color: isDark ? "#111827" : colors.bg,
      border: isDark ? "1px solid rgba(255,255,255,0.92)" : `1px solid ${ink}`,
    },

    btnDot: { width: 10, height: 10, borderRadius: 999, display: "inline-block" },
  };
}

/* -------------------------------------------------- */
/* Component                                          */
/* -------------------------------------------------- */
function RunnerDemo() {
  const { language } = useLanguage();
  const { colors, isDark } = useTheme();

  const t = copy[language] || copy.de;
  const [mode, setMode] = useState("easy");

  const styles = useMemo(() => createStyles({ colors, isDark }), [colors, isDark]);

  const selectedMode = useMemo(
    () => MODE_TO_SELECTED[mode] ?? "easy_run",
    [mode]
  );

  // ✅ sanft / flüssig: Sprint nur leicht schneller (und nutzt Tempo-GLB)
  const timeScale = useMemo(() => {
    if (mode === "easy") return 0.95;
    if (mode === "tempo") return 1.0;
    return 1.08;
  }, [mode]);

  // ✅ Kamera: ruhig, weniger Verzerrung
  const camera = useMemo(
    () => ({
      position: [0.35, 1.18, 3.15],
      target: [0, 1.2, 0],
      fov: 36,
    }),
    []
  );

  const dot = modeColor(mode);

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>{t.title}</h1>
        <Link to="/" style={styles.backLink}>
          {t.back}
        </Link>
      </div>

      <div style={styles.contentRow}>
        {/* LEFT */}
        <div style={styles.textCol}>
          <div style={styles.leftCard}>
            <p style={styles.intro}>{t.intro}</p>
            <p style={styles.extra}>{t.extra}</p>

            <div style={styles.sectionTitle}>
              <span style={styles.sectionBar} />
              {t.observeTitle}
            </div>

            <ul style={styles.bulletList}>
              {t.observe.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div style={styles.modeBlock}>
            <div style={styles.modeTitleRow}>
              <h2 style={styles.modeTitle}>{t.modes[mode].label}</h2>
              <span style={styles.modeHint}>
                <span style={{ ...styles.dot, background: dot }} />
                {t.modes[mode].hint}
              </span>
            </div>

            <p style={styles.modeDesc}>{t.modes[mode].desc}</p>
          </div>
        </div>

        {/* RIGHT */}
        <div style={styles.demoCol}>
          <div style={styles.topFade} />

          <div style={styles.demoHintOverlay}>
            <div style={styles.demoBadge}>
              <span style={{ ...styles.dot, background: dot }} />
              {t.modes[mode].label}
            </div>
            <div style={styles.demoSmall}>{t.modes[mode].hint}</div>
          </div>

          <RunnerHero
            selectedMode={selectedMode}
            timeScale={timeScale}
            showControls={false}
            camera={camera}
          />

          <div style={styles.buttonRow}>
            {["easy", "tempo", "sprint"].map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    ...styles.btn,
                    ...(active ? styles.btnActive : {}),
                    transform: active ? "translateY(-1px)" : "translateY(0)",
                  }}
                >
                  <span
                    style={{
                      ...styles.btnDot,
                      background: modeColor(m),
                      boxShadow: active
                        ? `0 0 0 6px ${colors.borderSubtle ?? colors.border}`
                        : "none",
                    }}
                  />
                  {t.modes[m].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ✅ WICHTIG: beides exportieren, damit beide Import-Arten funktionieren:
 * - import RunnerDemo from "./RunnerDemo.jsx"
 * - import { RunnerDemo } from "./RunnerDemo.jsx"
 */
export default RunnerDemo;
export { RunnerDemo };
