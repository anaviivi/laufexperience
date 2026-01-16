// src/DeviceConnectionsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";

const FUNCTIONS_BASE_URL =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_BASE_URL ??
  "https://fjiuvfypkvsjybyfxaoe.functions.supabase.co";

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID ?? "";

const CONNECTIONS_CACHE_KEY = "laufx_device_connections_cache";

const ui = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 20% -10%, rgba(16,185,129,0.18), transparent 60%), radial-gradient(900px 500px at 110% 0%, rgba(59,130,246,0.18), transparent 55%), #0b1220",
    padding: 24,
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#e5e7eb",
  },
  shell: { maxWidth: 860, margin: "0 auto" },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  backLink: { color: "#93c5fd", fontSize: 13, textDecoration: "none" },
  card: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
  },
  title: { fontSize: 22, fontWeight: 900, margin: 0 },
  subtitle: { margin: "6px 0 0", fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 },

  row: {
    marginTop: 14,
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(148,163,184,0.16)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  left: { display: "flex", gap: 12, alignItems: "flex-start" },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(148,163,184,0.18)",
    fontSize: 18,
  },
  label: { fontSize: 13, fontWeight: 900, color: "#ffffff", margin: 0 },
  desc: { margin: "4px 0 0", fontSize: 12, color: "#cbd5e1", lineHeight: 1.45 },

  pill: (tone) => ({
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(148,163,184,0.20)",
    background:
      tone === "good"
        ? "rgba(34,197,94,0.16)"
        : tone === "warn"
        ? "rgba(251,191,36,0.16)"
        : "rgba(148,163,184,0.10)",
    color:
      tone === "good"
        ? "#bbf7d0"
        : tone === "warn"
        ? "#fde68a"
        : "#e5e7eb",
  }),

  btn: (variant) => ({
    padding: "10px 12px",
    borderRadius: 999,
    border:
      variant === "danger"
        ? "1px solid rgba(239,68,68,0.30)"
        : "1px solid rgba(96,165,250,0.35)",
    background:
      variant === "danger"
        ? "rgba(239,68,68,0.18)"
        : "rgba(96,165,250,0.18)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  }),

  error: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.28)",
    color: "#fecaca",
    fontSize: 12,
  },
  small: { fontSize: 12, color: "#cbd5e1", marginTop: 12, lineHeight: 1.5 },
};

export default function DeviceConnectionsPage() {
  const [session, setSession] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load session
  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setErrorMsg("Fehler beim Laden der Sitzung.");
        setLoading(false);
        return;
      }
      setSession(data.session ?? null);
    };
    loadSession();
  }, []);

  // Load connections (only to determine Strava status) + cache
  useEffect(() => {
    const loadConnections = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("device_connections")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMsg("Geräte-Verknüpfungen konnten nicht geladen werden.");
        setConnections([]);
        setLoading(false);
        return;
      }

      const next = data || [];
      setConnections(next);

      try {
        localStorage.setItem(CONNECTIONS_CACHE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }

      setLoading(false);
    };

    if (session?.user) loadConnections();
  }, [session]);

  const stravaConnection = useMemo(
    () => connections.find((c) => c.provider === "other") || null,
    [connections]
  );

  const connected = Boolean(stravaConnection);

  const startStravaOAuth = async () => {
    if (!session?.user) return;

    setBusy(true);
    setErrorMsg("");

    try {
      const clientId = String(STRAVA_CLIENT_ID ?? "").trim();
      const functionsBase = String(
  (import.meta.env.VITE_SUPABASE_FUNCTIONS_BASE_URL ||
    "https://fjiuvfypkvsjybyfxaoe.functions.supabase.co")
).replace(/\/+\$/g, "");

      if (!functionsBase || !clientId) {
        setErrorMsg("Strava-Konfiguration fehlt (VITE_SUPABASE_FUNCTIONS_BASE_URL / VITE_STRAVA_CLIENT_ID).");
        return;
      }
      if (!/^\d+$/.test(clientId)) {
        setErrorMsg("Strava Client-ID muss eine Zahl sein.");
        return;
      }

      const url = new URL("https://www.strava.com/oauth/authorize");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("redirect_uri", `${functionsBase}/strava-oauth`);
      url.searchParams.set("state", session.user.id);
      url.searchParams.set("scope", "activity:read_all");
      url.searchParams.set("approval_prompt", "auto");

      console.log("STRAVA_AUTH_URL:", url.toString());
  window.location.href = url.toString();
    } catch (e) {
      setErrorMsg("Verknüpfung konnte nicht gestartet werden.");
    } finally {
      setBusy(false);
    }
  };

  const disconnectStrava = async () => {
    if (!session?.user || !stravaConnection) return;

    setBusy(true);
    setErrorMsg("");

    try {
      const { error } = await supabase
        .from("device_connections")
        .delete()
        .eq("id", stravaConnection.id)
        .eq("user_id", session.user.id);

      if (error) {
        setErrorMsg("Trennen fehlgeschlagen.");
        return;
      }

      const next = connections.filter((c) => c.id !== stravaConnection.id);
      setConnections(next);

      try {
        localStorage.setItem(CONNECTIONS_CACHE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={ui.page}>
      <div style={ui.shell}>
        <div style={ui.topbar}>
          <Link to="/" style={ui.backLink}>← Zurück zum Dashboard</Link>
          <Link to="/ki-coaching" style={ui.backLink}>→ Zum KI-Coaching</Link>
        </div>

        <div style={ui.card}>
          <h1 style={ui.title}>Strava verbinden</h1>
          <p style={ui.subtitle}>
            Aktuell ist <strong>nur Strava</strong> als Datenquelle aktiv. Sobald verbunden, fließen Aktivitäten ins Coaching
            und dein Dashboard zeigt den Status an.
          </p>

          {errorMsg && <div style={ui.error}>{errorMsg}</div>}
          {loading && <p style={ui.small}>Lade Status…</p>}

          <div style={ui.row}>
            <div style={ui.left}>
              <div style={ui.icon}>🔥</div>
              <div>
                <p style={ui.label}>Strava Sync</p>
                <p style={ui.desc}>
                  Importiert Aktivitäten automatisch. Benötigt Zugriff auf <code>activity:read_all</code>.
                  {connected && stravaConnection?.created_at
                    ? ` Verbunden seit ${new Date(stravaConnection.created_at).toLocaleDateString()}.`
                    : ""}
                </p>
                <div style={{ marginTop: 8 }}>
                  <span style={ui.pill(connected ? "good" : "warn")}>
                    {connected ? "Verbunden" : "Nicht verbunden"}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {!connected ? (
                <button style={{ ...ui.btn("primary"), opacity: busy ? 0.7 : 1 }} disabled={busy} onClick={startStravaOAuth}>
                  {busy ? "Bitte warten…" : "Verbinden"}
                </button>
              ) : (
                <button style={{ ...ui.btn("danger"), opacity: busy ? 0.7 : 1 }} disabled={busy} onClick={disconnectStrava}>
                  {busy ? "Bitte warten…" : "Trennen"}
                </button>
              )}
            </div>
          </div>

          <p style={ui.small}>
            Tipp: Nach dem Verbinden zurück ins Dashboard → „Uhr & Daten“ zeigt sofort „Verbunden“.
          </p>
        </div>
      </div>
    </div>
  );
}
