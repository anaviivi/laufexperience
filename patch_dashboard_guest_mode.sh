#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d-%H%M%S)"

# Dashboard-Datei finden
DASH_FILE="$(find . -type f -name 'DashboardPage.jsx' -not -path '*/node_modules/*' | head -n 1 || true)"
if [[ -z "$DASH_FILE" ]]; then
  echo "❌ DashboardPage.jsx nicht gefunden."
  exit 1
fi

echo "✅ Gefunden: $DASH_FILE"
cp -a "$DASH_FILE" "$DASH_FILE.bak.$TS"
echo "🧷 Backup: $DASH_FILE.bak.$TS"

# Datei komplett ersetzen (robust + Guest Mode)
cat > "$DASH_FILE" <<'JSX'
import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "./LanguageContext.jsx";

const CONNECTIONS_CACHE_KEY = "laufx_device_connections_cache";

// ✅ Wenn dein Backend anders gemountet ist, hier anpassen
const API_PROFILE = "/api/profile";
const API_RUNLOG = "/api/profile/runlog";

const texts = {
  de: {
    pageTitle: "Dein Dashboard",
    subtitle:
      "Du siehst immer eine Vorschau. Personenbezogene Daten werden erst nach Login/Verbindung geladen.",
    hello: (name) => `Hi ${name || "Runner"}, willkommen zurück!`,

    guestBanner:
      "Vorschau-Modus: Du bist nicht verbunden oder die API ist nicht erreichbar. Melde dich an / verbinde dein Konto, um deine Daten zu sehen.",

    loading: "Lade Dashboard …",
    retry: "Neu laden",
    unitKm: "km",

    // Bereiche
    weekBlockTitle: "Aktuelle Woche",
    kmTargetLabel: "Ziel",
    kmDoneLabel: "Erledigt",
    progressLabel: "Fortschritt",
    last7Title: "Letzte 7 Tage",

    modulesTitle: "Module",
    module3dTitle: "3D Training",
    module3dText: "Analysiere Haltung, Fußaufsatz und Kadenz in 3D.",
    moduleAiTitle: "KI-Coaching",
    moduleAiText: "Passe deinen Trainingsplan dynamisch an deine Belastung an.",
    moduleQuizTitle: "Quiz / Lernmodul",
    moduleQuizText: "Teste dein Wissen zu Technik, Ernährung und Regeneration.",

    buttonTo3d: "Zu 3D Training",
    buttonToAi: "Zu KI-Coaching",
    buttonToQuiz: "Quiz starten",

    nextStepsTitle: "Nächste Schritte",
    nextStepsText:
      "Verbinde dein Konto/Profil oder importiere Läufe. Ohne Verbindung siehst du eine Vorschau.",

    quickActionsTitle: "Quick Actions",
    qaLogin: "Login / Verbinden",
    qaDevices: "Geräte verbinden",
    qaProfile: "Profil",

    devicesTitle: "Geräte",
    devicesText:
      "Verbindung-Status kommt aus deinem Device-Setup (lokal gecached).",
    openDevices: "Geräte verwalten",

    dayShort: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  },
  en: {
    pageTitle: "Your dashboard",
    subtitle:
      "You always see a preview. Personal data loads only after login/connection.",
    hello: (name) => `Hi ${name || "Runner"}, welcome back!`,

    guestBanner:
      "Preview mode: You are not connected or the API is not reachable. Log in / connect to see your data.",

    loading: "Loading dashboard …",
    retry: "Reload",
    unitKm: "km",

    weekBlockTitle: "Current week",
    kmTargetLabel: "Target",
    kmDoneLabel: "Done",
    progressLabel: "Progress",
    last7Title: "Last 7 days",

    modulesTitle: "Modules",
    module3dTitle: "3D training",
    module3dText: "Analyze posture, foot strike and cadence in 3D.",
    moduleAiTitle: "AI coaching",
    moduleAiText: "Adapt your plan dynamically to your current load.",
    moduleQuizTitle: "Quiz / learning",
    moduleQuizText: "Test technique, nutrition and recovery knowledge.",

    buttonTo3d: "Go to 3D training",
    buttonToAi: "Go to AI coaching",
    buttonToQuiz: "Start quiz",

    nextStepsTitle: "Next steps",
    nextStepsText:
      "Connect your account/profile or import runs. Without connection you see a preview.",

    quickActionsTitle: "Quick actions",
    qaLogin: "Login / Connect",
    qaDevices: "Connect devices",
    qaProfile: "Profile",

    devicesTitle: "Devices",
    devicesText: "Connection status is cached locally from your device setup.",
    openDevices: "Manage devices",

    dayShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
};

const styles = {
  page: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "32px 24px 80px",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  header: { marginBottom: 20 },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 16,
    flexWrap: "wrap",
  },
  title: { fontSize: 26, fontWeight: 800, margin: 0 },
  subtitle: { fontSize: 14, color: "#4b5563", marginTop: 6, marginBottom: 0 },
  hello: { fontSize: 14, color: "#6b7280", fontWeight: 650 },

  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 7fr) minmax(0, 4fr)",
    gap: 18,
    alignItems: "flex-start",
  },

  card: {
    background: "#ffffff",
    borderRadius: 18,
    padding: 18,
    border: "1px solid #eef2f7",
    boxShadow: "0 10px 25px rgba(15,23,42,0.06)",
  },
  hero: {
    background:
      "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(37,99,235,0.08))",
  },

  banner: {
    padding: 12,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#111827",
    fontSize: 13,
    lineHeight: 1.45,
    marginBottom: 12,
  },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginTop: 10,
  },
  statBox: {
    background: "#0b1e32",
    borderRadius: 14,
    padding: 12,
    color: "#fff",
  },
  statLabel: { fontSize: 12, opacity: 0.8 },
  statValue: { fontSize: 16, fontWeight: 800, marginTop: 2 },

  progressOuter: {
    marginTop: 14,
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "#e5e7eb",
    overflow: "hidden",
  },
  progressInner: (p) => ({
    width: `${p}%`,
    height: "100%",
    background: "linear-gradient(90deg,#2563eb,#10b981)",
    transition: "width .25s ease",
  }),

  weekStrip: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: 8,
  },
  day: (active) => ({
    padding: "10px 8px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: active ? "rgba(16,185,129,0.10)" : "#f9fafb",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 750,
  }),
  daySub: { marginTop: 2, fontSize: 11, color: "#6b7280", fontWeight: 650 },

  modulesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
    marginTop: 16,
  },
  moduleCard: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 14,
    border: "1px solid #eef2f7",
    boxShadow: "0 10px 20px rgba(15,23,42,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minHeight: 150,
  },
  moduleTitle: { fontSize: 15, fontWeight: 800, display: "flex", gap: 8, alignItems: "center" },
  moduleText: { fontSize: 13, color: "#4b5563", margin: 0, lineHeight: 1.45, flexGrow: 1 },
  moduleBtn: {
    marginTop: 4,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #0b1e32",
    background: "#fff",
    color: "#0b1e32",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    alignSelf: "flex-start",
  },

  sideTitle: { fontSize: 16, fontWeight: 800, marginBottom: 6 },
  small: { fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.5 },

  qaRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginTop: 12,
  },
  qaBtn: {
    padding: "10px 10px",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 800,
    color: "#111827",
  },

  primaryBtn: {
    marginTop: 10,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid #0b1e32",
    background: "#0b1e32",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
};

function startOfIsoWeek(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmt1(x) {
  const n = Number(x);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;
}

async function fetchJson(url) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export default function DashboardPage() {
  const { language } = useLanguage();
  const t = texts[language] || texts.de;

  // mode: auth = echte Daten, guest = Vorschau
  const [mode, setMode] = useState("loading"); // loading | auth | guest
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);

  const [deviceCache, setDeviceCache] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONNECTIONS_CACHE_KEY);
      setDeviceCache(raw ? JSON.parse(raw) : null);
    } catch {
      setDeviceCache(null);
    }
  }, []);

  const load = async () => {
    setMode("loading");
    try {
      const p = await fetchJson(API_PROFILE);
      const r = await fetchJson(API_RUNLOG);
      setProfile(p.profile ?? null);
      setSummary(r.summary ?? p.summary ?? null);
      setLogs(Array.isArray(r.logs) ? r.logs : []);
      setMode("auth");
    } catch {
      // ✅ Hier ist der Kern: NICHT Error-Screen -> Dashboard bleibt sichtbar (Preview)
      setProfile(null);
      setSummary(null);
      setLogs([]);
      setMode("guest");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const derived = useMemo(() => {
    const now = new Date();

    const name = profile?.name || profile?.user?.name || (mode === "auth" ? "Runner" : "Gast");
    const weeklyTarget =
      Number.isFinite(Number(profile?.running?.weeklyKm)) ? Number(profile.running.weeklyKm) : 20;

    const sow = startOfIsoWeek(now);
    const eow = addDays(sow, 7);

    const weekRuns = (Array.isArray(logs) ? logs : []).filter((x) => {
      const ts = Number(x?.ts || 0);
      if (!Number.isFinite(ts)) return false;
      const d = new Date(ts);
      return d >= sow && d < eow;
    });

    const weeklyDone = fmt1(
      weekRuns.reduce((s, x) => s + (Number(x?.distanceKm) || 0), 0)
    );

    const progressPercent =
      weeklyTarget > 0 ? Math.min(100, (weeklyDone / weeklyTarget) * 100) : 0;

    // Last 7 days
    const day0 = new Date();
    day0.setHours(0, 0, 0, 0);

    const last7 = Array.from({ length: 7 }).map((_, idx) => {
      const d = addDays(day0, idx - 6);
      const start = new Date(d);
      const end = addDays(start, 1);
      const total = fmt1(
        (Array.isArray(logs) ? logs : [])
          .filter((x) => {
            const ts = Number(x?.ts || 0);
            if (!Number.isFinite(ts)) return false;
            const dd = new Date(ts);
            return dd >= start && dd < end;
          })
          .reduce((s, x) => s + (Number(x?.distanceKm) || 0), 0)
      );
      const weekdayMon0 = (d.getDay() + 6) % 7;
      return { label: t.dayShort[weekdayMon0] || "", km: total, ran: total > 0 };
    });

    return { name, weeklyTarget, weeklyDone, progressPercent, last7 };
  }, [profile, logs, mode, t.dayShort]);

  const responsiveCss = `
    @media (max-width: 980px) { .dash-layout { grid-template-columns: 1fr !important; } }
    @media (max-width: 860px) {
      .stats-row { grid-template-columns: 1fr !important; }
      .modules-grid { grid-template-columns: 1fr !important; }
      .qa-row { grid-template-columns: 1fr !important; }
    }
  `;

  if (mode === "loading") {
    return (
      <div style={styles.page}>
        <style>{responsiveCss}</style>
        <div style={styles.card}>{t.loading}</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{responsiveCss}</style>

      <header style={styles.header}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>{t.pageTitle}</h1>
          <span style={styles.hello}>{t.hello(derived.name)}</span>
        </div>
        <p style={styles.subtitle}>{t.subtitle}</p>
      </header>

      <div style={styles.layout} className="dash-layout">
        {/* LINKS */}
        <section>
          <div style={{ ...styles.card, ...styles.hero }}>
            {mode === "guest" && <div style={styles.banner}>{t.guestBanner}</div>}

            <div style={{ fontSize: 16, fontWeight: 900 }}>{t.weekBlockTitle}</div>

            <div style={styles.statsRow} className="stats-row">
              <div style={styles.statBox}>
                <div style={styles.statLabel}>{t.kmTargetLabel}</div>
                <div style={styles.statValue}>
                  {fmt1(derived.weeklyTarget)} {t.unitKm}
                </div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>{t.kmDoneLabel}</div>
                <div style={styles.statValue}>
                  {fmt1(derived.weeklyDone)} {t.unitKm}
                </div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>{t.progressLabel}</div>
                <div style={styles.statValue}>{Math.round(derived.progressPercent)}%</div>
              </div>
            </div>

            <div style={styles.progressOuter}>
              <div style={styles.progressInner(derived.progressPercent)} />
            </div>

            <div style={{ marginTop: 14, fontWeight: 900, fontSize: 13 }}>
              {t.last7Title}
            </div>
            <div style={styles.weekStrip}>
              {derived.last7.map((d, idx) => (
                <div key={idx} style={styles.day(d.ran)}>
                  {d.label}
                  <div style={styles.daySub}>
                    {d.ran ? `${fmt1(d.km)} ${t.unitKm}` : "—"}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" style={styles.primaryBtn} onClick={load}>
              {t.retry}
            </button>
          </div>

          {/* Module bleiben IMMER sichtbar */}
          <div style={{ ...styles.card, marginTop: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{t.modulesTitle}</div>

            <div style={styles.modulesGrid} className="modules-grid">
              <div style={styles.moduleCard}>
                <div style={styles.moduleTitle}>🧍‍♂️ {t.module3dTitle}</div>
                <p style={styles.moduleText}>{t.module3dText}</p>
                <button
                  style={styles.moduleBtn}
                  onClick={() => (window.location.href = "/3d-training")}
                >
                  {t.buttonTo3d}
                </button>
              </div>

              <div style={styles.moduleCard}>
                <div style={styles.moduleTitle}>🤖 {t.moduleAiTitle}</div>
                <p style={styles.moduleText}>{t.moduleAiText}</p>
                <button
                  style={styles.moduleBtn}
                  onClick={() => (window.location.href = "/ki-coaching")}
                >
                  {t.buttonToAi}
                </button>
              </div>

              <div style={styles.moduleCard}>
                <div style={styles.moduleTitle}>🧠 {t.moduleQuizTitle}</div>
                <p style={styles.moduleText}>{t.moduleQuizText}</p>
                <button
                  style={styles.moduleBtn}
                  onClick={() => (window.location.href = "/quiz")}
                >
                  {t.buttonToQuiz}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* RECHTS */}
        <aside style={{ display: "grid", gap: 18 }}>
          <div style={styles.card}>
            <div style={styles.sideTitle}>{t.nextStepsTitle}</div>
            <p style={styles.small}>{t.nextStepsText}</p>

            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 900 }}>
              {t.quickActionsTitle}
            </div>
            <div style={styles.qaRow} className="qa-row">
              <button
                style={styles.qaBtn}
                type="button"
                onClick={() => (window.location.href = "/login")}
              >
                {t.qaLogin}
              </button>
              <button
                style={styles.qaBtn}
                type="button"
                onClick={() => (window.location.href = "/device-connections")}
              >
                {t.qaDevices}
              </button>
              <button
                style={styles.qaBtn}
                type="button"
                onClick={() => (window.location.href = "/profile")}
              >
                {t.qaProfile}
              </button>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.sideTitle}>{t.devicesTitle}</div>
            <p style={styles.small}>{t.devicesText}</p>

            <pre
              style={{
                marginTop: 10,
                fontSize: 11,
                background: "#f9fafb",
                padding: 10,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                overflow: "auto",
              }}
            >
              {JSON.stringify(deviceCache, null, 2) || "—"}
            </pre>

            <button
              type="button"
              style={styles.primaryBtn}
              onClick={() => (window.location.href = "/device-connections")}
            >
              {t.openDevices}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
JSX

echo "✅ Guest/Preview Mode eingebaut: Dashboard bleibt immer sichtbar."
echo "➡️ Jetzt Frontend neu starten (npm run dev)."
