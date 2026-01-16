#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d-%H%M%S)"
ROOT="$(pwd)"

backup() {
  local f="$1"
  cp -a "$f" "$f.bak.$TS"
  echo "Backup: $f -> $f.bak.$TS"
}

echo "== Suche Backend (Express) =="
BACKEND_DIR=""
for d in "$ROOT/backend" "$ROOT/server" "$ROOT/api"; do
  if [[ -f "$d/package.json" ]] && grep -qi '"express"' "$d/package.json"; then
    BACKEND_DIR="$d"; break
  fi
done
if [[ -z "$BACKEND_DIR" ]]; then
  # fallback: finde package.json mit express maxdepth 3
  while IFS= read -r p; do
    d="$(dirname "$p")"
    if grep -qi '"express"' "$p"; then BACKEND_DIR="$d"; break; fi
  done < <(find "$ROOT" -maxdepth 3 -name package.json -not -path "*/node_modules/*")
fi
if [[ -z "$BACKEND_DIR" ]]; then
  echo "❌ Backend nicht gefunden (kein package.json mit express)."
  exit 1
fi
echo "Backend: $BACKEND_DIR"

echo "== Finde Express Server-Datei (app.listen) =="
SERVER_FILE="$(grep -RIl --exclude-dir=node_modules --include='*.js' --include='*.mjs' --include='*.cjs' 'app\.listen' "$BACKEND_DIR" | head -n 1 || true)"
if [[ -z "$SERVER_FILE" ]]; then
  echo "❌ Keine Server-Datei mit app.listen gefunden."
  exit 1
fi
echo "Server file: $SERVER_FILE"

echo "== Finde profile router (profile.js) =="
PROFILE_ROUTER_FILE="$(find "$ROOT" -type f -name 'profile.js' -not -path '*/node_modules/*' | head -n 1 || true)"
if [[ -z "$PROFILE_ROUTER_FILE" ]]; then
  echo "❌ profile.js nicht gefunden."
  exit 1
fi
echo "profile router: $PROFILE_ROUTER_FILE"

echo "== Berechne relativen Importpfad =="
REL_PROFILE_PATH="$(python3 - <<PY
import os,sys
server=sys.argv[1]
router=sys.argv[2]
base=os.path.dirname(server)
rel=os.path.relpath(router, base).replace(os.sep,'/')
if not rel.startswith(('.', '/')): rel='./'+rel
if not rel.startswith('./') and not rel.startswith('../'): rel='./'+rel
print(rel)
PY
"$SERVER_FILE" "$PROFILE_ROUTER_FILE")"
echo "rel path: $REL_PROFILE_PATH"

echo "== Backend-Port grob erkennen (default 5000) =="
PORT="5000"
PORT_GUESS="$(perl -ne 'if(/app\.listen\s*\(\s*(\d+)/){print $1; exit}' "$SERVER_FILE" 2>/dev/null || true)"
if [[ -n "$PORT_GUESS" ]]; then PORT="$PORT_GUESS"; fi
echo "Backend port: $PORT"

echo "== Patch Express: /api/profile mounten =="
backup "$SERVER_FILE"

CONTENT="$(cat "$SERVER_FILE")"
IS_ESM="0"
if echo "$CONTENT" | grep -Eq '^\s*import\s+.*from\s+["'\'']'; then IS_ESM="1"; fi

IMPORT_ESM="import profileRouter from \"${REL_PROFILE_PATH}\";"
IMPORT_CJS="const profileRouter = require(\"${REL_PROFILE_PATH}\");"
MOUNT_LINE='app.use("/api/profile", profileRouter);'

if ! echo "$CONTENT" | grep -q 'profileRouter'; then
  echo "➕ Füge profileRouter Import hinzu"
  if [[ "$IS_ESM" == "1" ]]; then
    # nach letztem import einfügen
    perl -0777 -i -pe "s/^((?:\\s*import[^\\n]*\\n)+)/\$1$IMPORT_ESM\\n/m" "$SERVER_FILE"
  else
    # oben einfügen
    perl -0777 -i -pe "s/^/$IMPORT_CJS\\n/" "$SERVER_FILE"
  fi
else
  echo "✅ profileRouter bereits vorhanden"
fi

CONTENT2="$(cat "$SERVER_FILE")"
if ! echo "$CONTENT2" | grep -q 'app\.use\(["'\'']\/api\/profile'; then
  echo "➕ Füge app.use(\"/api/profile\", profileRouter) vor app.listen ein"
  perl -0777 -i -pe "s/(\\n\\s*app\\.listen\\s*\\()/(\\n$MOUNT_LINE\\n\\n\\s*app.listen\\(/m" "$SERVER_FILE"
else
  echo "✅ /api/profile Mount existiert bereits"
fi

echo "== Vite Proxy setzen (falls vite.config.* existiert) =="
VITE_CFG=""
for f in "$ROOT/vite.config.js" "$ROOT/vite.config.mjs" "$ROOT/vite.config.ts"; do
  if [[ -f "$f" ]]; then VITE_CFG="$f"; break; fi
done

if [[ -n "$VITE_CFG" ]]; then
  echo "Vite config: $VITE_CFG"
  backup "$VITE_CFG"
  CFG="$(cat "$VITE_CFG")"
  if echo "$CFG" | grep -q 'proxy' && echo "$CFG" | grep -q '\/api'; then
    echo "✅ Proxy scheint vorhanden"
  else
    echo "➕ Füge Proxy /api -> http://localhost:$PORT hinzu"
    if echo "$CFG" | grep -q 'defineConfig' && echo "$CFG" | grep -q 'server\s*:\s*{'; then
      perl -0777 -i -pe "s/server\\s*:\\s*\\{\\s*/server: {\\n    proxy: {\\n      '\\/api': 'http:\\/\\/localhost:$PORT',\\n    },\\n    /s" "$VITE_CFG"
    elif echo "$CFG" | grep -q 'defineConfig'; then
      perl -0777 -i -pe "s/defineConfig\\(\\{\\s*/defineConfig({\\n  server: {\\n    proxy: {\\n      '\\/api': 'http:\\/\\/localhost:$PORT',\\n    },\\n  },\\n/s" "$VITE_CFG"
    else
      echo "⚠️ Konnte Vite config nicht sicher patchen — bitte proxy manuell setzen."
    fi
  fi
else
  echo "ℹ️ Keine vite.config.* gefunden (evtl. CRA/Next). Proxy Schritt übersprungen."
fi

echo "== Dashboard: Gast/Preview Mode aktivieren (statt leerer Error Screen) =="
DASH_FILE="$(find "$ROOT" -type f \( -name 'DashboardPage.jsx' -o -name 'Dashboard.jsx' -o -name 'DashboardPage.tsx' \) -not -path '*/node_modules/*' | head -n 1 || true)"
if [[ -z "$DASH_FILE" ]]; then
  echo "❌ Dashboard Datei nicht gefunden (DashboardPage.jsx)."
  exit 1
fi
echo "Dashboard file: $DASH_FILE"
backup "$DASH_FILE"

# Wir ersetzen die Datei bewusst durch eine robuste Version (Guest Mode + API fetch).
cat > "$DASH_FILE" <<'JSX'
import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "./LanguageContext.jsx";

const CONNECTIONS_CACHE_KEY = "laufx_device_connections_cache";

// ✅ API Endpoints (passen, falls dein Backend anders gemountet ist)
const API_PROFILE = "/api/profile";
const API_RUNLOG = "/api/profile/runlog";

const texts = {
  de: {
    pageTitle: "Dein Dashboard",
    subtitle: "Auch ohne Login siehst du eine Vorschau. Mit Login werden deine Daten geladen.",
    hello: (name) => `Hi ${name || "Runner"}, willkommen zurück!`,
    loading: "Lade Dashboard …",
    guestHint:
      "Du bist nicht eingeloggt oder die API ist gerade nicht erreichbar. Du siehst eine Vorschau – melde dich an, um deine echten Daten zu sehen.",
    retry: "Neu laden",
    unitKm: "km",
    dayShort: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  },
  en: {
    pageTitle: "Your dashboard",
    subtitle: "You can see a preview without login. With login we load your data.",
    hello: (name) => `Hi ${name || "Runner"}, welcome back!`,
    loading: "Loading dashboard …",
    guestHint:
      "You are not logged in or the API is not reachable. You see a preview — log in to load your real data.",
    retry: "Reload",
    unitKm: "km",
    dayShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
};

const styles = {
  page: { maxWidth: 1180, margin: "0 auto", padding: "32px 24px 80px", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" },
  header: { marginBottom: 18 },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap" },
  title: { fontSize: 26, fontWeight: 800, margin: 0 },
  subtitle: { fontSize: 14, color: "#4b5563", marginTop: 6 },
  card: { background: "#fff", borderRadius: 18, padding: 18, border: "1px solid #eef2f7", boxShadow: "0 10px 25px rgba(15,23,42,0.06)" },
  hint: { marginTop: 12, padding: 12, borderRadius: 14, background: "#f8fafc", border: "1px solid #e5e7eb", color: "#111827", fontSize: 13, lineHeight: 1.45 },
  grid: { display: "grid", gridTemplateColumns: "minmax(0, 7fr) minmax(0, 4fr)", gap: 18, alignItems: "start" },
  hero: { background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(37,99,235,0.08))" },
  stats: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 12 },
  statBox: { background: "#0b1e32", borderRadius: 14, padding: 12, color: "#fff" },
  statLabel: { fontSize: 12, opacity: 0.8 },
  statValue: { fontSize: 16, fontWeight: 800, marginTop: 2 },
  progressOuter: { marginTop: 14, width: "100%", height: 10, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" },
  progressInner: (p) => ({ width: `${p}%`, height: "100%", background: "linear-gradient(90deg,#2563eb,#10b981)", transition: "width .25s ease" }),
  weekStrip: { marginTop: 14, display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8 },
  day: (active) => ({ padding: "10px 8px", borderRadius: 14, border: "1px solid #e5e7eb", background: active ? "rgba(16,185,129,0.10)" : "#f9fafb", textAlign: "center", fontSize: 12, fontWeight: 700 }),
  daySub: { marginTop: 2, fontSize: 11, color: "#6b7280", fontWeight: 650 },
  btn: { marginTop: 12, width: "100%", padding: "10px 12px", borderRadius: 14, border: "1px solid #0b1e32", background: "#0b1e32", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" },
};

function startOfIsoWeek(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmt1(x) { const n = Number(x); return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0; }

async function fetchJson(url) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

export default function DashboardPage() {
  const { language } = useLanguage();
  const t = texts[language] || texts.de;

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
      // ✅ Wichtig: NICHT Error-Screen -> Guest Preview
      setProfile(null);
      setSummary(null);
      setLogs([]);
      setMode("guest");
    }
  };

  useEffect(() => { load(); }, []);

  const derived = useMemo(() => {
    const now = new Date();
    const running = profile?.running || {};
    const weeklyTarget = Number.isFinite(Number(running.weeklyKm)) ? Number(running.weeklyKm) : 20;

    const sow = startOfIsoWeek(now);
    const eow = addDays(sow, 7);

    const weekRuns = (Array.isArray(logs) ? logs : []).filter((x) => {
      const ts = Number(x?.ts || 0);
      if (!Number.isFinite(ts)) return false;
      const d = new Date(ts);
      return d >= sow && d < eow;
    });

    const weeklyDone = fmt1(weekRuns.reduce((s, x) => s + (Number(x?.distanceKm) || 0), 0));
    const progressPercent = weeklyTarget > 0 ? Math.min(100, (weeklyDone / weeklyTarget) * 100) : 0;

    // last 7 days
    const day0 = new Date(); day0.setHours(0,0,0,0);
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

    return {
      name: profile?.name || "Runner",
      weeklyTarget,
      weeklyDone,
      progressPercent,
      last7,
    };
  }, [profile, logs, t.dayShort]);

  const responsiveCss = `
    @media (max-width: 980px) { .dash-grid { grid-template-columns: 1fr !important; } }
    @media (max-width: 860px) { .stats { grid-template-columns: 1fr !important; } }
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
          <div style={{ color: "#6b7280", fontSize: 14, fontWeight: 650 }}>{t.hello(derived.name)}</div>
        </div>
        <div style={styles.subtitle}>{t.subtitle}</div>
      </header>

      <div style={styles.grid} className="dash-grid">
        <section>
          <div style={{ ...styles.card, ...styles.hero }}>
            {mode === "guest" && <div style={styles.hint}>{t.guestHint}</div>}

            <div style={styles.stats} className="stats">
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Wochenziel</div>
                <div style={styles.statValue}>{fmt1(derived.weeklyTarget)} {t.unitKm}</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Erledigt</div>
                <div style={styles.statValue}>{fmt1(derived.weeklyDone)} {t.unitKm}</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Fortschritt</div>
                <div style={styles.statValue}>{Math.round(derived.progressPercent)}%</div>
              </div>
            </div>

            <div style={styles.progressOuter}>
              <div style={styles.progressInner(derived.progressPercent)} />
            </div>

            <div style={{ marginTop: 14, fontWeight: 800, fontSize: 13 }}>Letzte 7 Tage</div>
            <div style={styles.weekStrip}>
              {derived.last7.map((d, idx) => (
                <div key={idx} style={styles.day(d.ran)}>
                  {d.label}
                  <div style={styles.daySub}>{d.ran ? `${fmt1(d.km)} ${t.unitKm}` : "—"}</div>
                </div>
              ))}
            </div>

            <button type="button" style={styles.btn} onClick={load}>{t.retry}</button>
          </div>
        </section>

        <aside style={{ display: "grid", gap: 18 }}>
          <div style={styles.card}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Geräte</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.45 }}>
              Status ist lokal gecached ({CONNECTIONS_CACHE_KEY}). Öffne “Geräte verwalten”, um zu verbinden.
            </div>
            <pre style={{ marginTop: 10, fontSize: 11, background: "#f9fafb", padding: 10, borderRadius: 12, border: "1px solid #e5e7eb", overflow: "auto" }}>
{JSON.stringify(deviceCache, null, 2) || "—"}
            </pre>
          </div>
        </aside>
      </div>
    </div>
  );
}
JSX

echo "✅ Dashboard ersetzt (Guest Mode aktiv)."

cat <<EOF

== Fertig. Jetzt so testen ==
1) Backend starten:
   cd "$BACKEND_DIR"
   npm install
   npm run dev || npm start

2) Teste die Route:
   curl -i http://localhost:$PORT/api/profile

3) Frontend starten (in deinem Frontend-Ordner):
   npm run dev

Wenn /api/profile jetzt nicht mehr 404 ist, lädt dein Dashboard Daten.
Wenn nicht eingeloggt -> du siehst trotzdem Dashboard als Preview (kein roter Error-Screen).
EOF
