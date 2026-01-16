import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "./supabaseClient";
import { useTheme } from "./ThemeContext.jsx";

/**
 * Komplett überarbeitete, production-taugliche Version von KICoachingPage:
 * - Nutzt ThemeContext (Light/Dark) sauber via CSS-Variablen / Tokens
 * - Entfernt harte Farben & dark-mode Hacks
 * - Robustes API Base Handling + sauberes Error Parsing
 * - AbortController gegen Race Conditions
 * - History wird korrekt mitgesendet
 * - PDF Download ohne "doppelt fetchen"
 * - Quick Prompts + Intent + Rezept-Flow
 * - Markdown Rendering (GFM)
 */

const WELCOME = `Hi 👋 Ich bin dein KI-Coach für Training, Technik & Ernährung.

Schreib mir dein Ziel (z.B. 10 km / HM / Marathon) + deinen Wochenumfang. Wenn Infos fehlen, frage ich kurz nach.`;

function uid() {
  try {
    return crypto?.randomUUID?.() ?? (Date.now().toString(36) + Math.random().toString(36).slice(2));
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}

function hhmm() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildPdfMessages(messages) {
  return messages.map((m) => ({ role: m.role, content: m.content, time: m.time }));
}

function lastAssistantMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "assistant") return messages[i];
  }
  return null;
}

// API base detection:
// 1) If VITE_API_BASE is set -> use it (e.g. http://localhost:3001)
// 2) Else try relative "/api" (works with Vite proxy)
// 3) Else fallback to localhost:3001 (dev on 5173 without proxy)
function getApiBase() {
  const envBase = import.meta?.env?.VITE_API_BASE;
  if (envBase && String(envBase).trim()) return String(envBase).trim().replace(/\/$/, "");

  const isDev = import.meta?.env?.DEV;
  const port = window?.location?.port;
  if (isDev && port === "5173") return "http://localhost:3001";

  return "";
}

function apiUrl(path) {
  const base = getApiBase();
  return base ? `${base}${path}` : path;
}

async function readAsTextSafe(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function parseJsonSafe(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function pickErrorDetail({ text, json, res }) {
  const j = json || {};
  const fallback = text ? text.slice(0, 400) : `${res.status} ${res.statusText}`;
  return String(j?.message || j?.error || j?.detail || fallback || "request_failed").slice(0, 800);
}

export default function KICoachingPage() {
  const { colors, isDark } = useTheme();

  const [intent, setIntent] = useState("training"); // training | technique | nutrition
  const [wantRecipe, setWantRecipe] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState(() => [
    { id: uid(), role: "assistant", content: WELCOME, time: hhmm() },
  ]);

  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading, showRecipe]);

  // auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(180, Math.max(54, el.scrollHeight));
    el.style.height = `${next}px`;
  }, [input]);

  // abort inflight on unmount
  useEffect(() => {
    return () => {
      try {
        abortRef.current?.abort?.();
      } catch {}
    };
  }, []);

  const canSend = input.trim().length > 0 && !loading;

  const intentLabel = useMemo(() => {
    if (intent === "training") return "Training";
    if (intent === "technique") return "Technik";
    return "Ernährung";
  }, [intent]);

  const recipeMessage = useMemo(() => lastAssistantMessage(messages), [messages]);

  const PROMPTS = useMemo(() => {
    return {
      training:
        "Erstelle mir bitte einen Trainingsplan passend zu meinem Profil (Ziel, Level, verfügbare Tage). Gib ihn als Wochenplan mit konkreten Einheiten aus.",
      technique:
        "Gib mir konkrete Technik-Tipps fürs Laufen (3 häufige Fehler + 3 Drills + ein 10-Min Warm-up). Pass es an mein Level an.",
      nutrition:
        "Erstelle mir einen Ernährungsplan für 7 Tage (Mo–So) passend zu meinem Profil (Ernährungsstil, Ziel). Bitte mit Einkaufsliste & Meal-Prep.",
      recipe:
        "Gib mir ein passendes Rezept (mit Zutaten & Zubereitung) passend zu meinem Profil und meinem heutigen Ziel.",
    };
  }, []);

  function pushUser(text) {
    setMessages((prev) => [...prev, { id: uid(), role: "user", content: text, time: hhmm() }]);
  }

  function pushAssistant(text) {
    setMessages((prev) => [...prev, { id: uid(), role: "assistant", content: text, time: hhmm() }]);
  }

  function historyForApi(nextMessages) {
    // role/content History – ohne ids/time
    return nextMessages.map((m) => ({ role: m.role, content: m.content }));
  }

  async function sendMessage(textOverride = null, nextIntent = null, nextWantRecipe = null) {
    const trimmed = (textOverride ?? input).trim();
    if (!trimmed || loading) return;

    setShowRecipe(false);

    const resolvedIntent = nextIntent ?? intent;
    const resolvedWantRecipe = typeof nextWantRecipe === "boolean" ? nextWantRecipe : wantRecipe;

    if (nextIntent) setIntent(nextIntent);
    if (typeof nextWantRecipe === "boolean") setWantRecipe(nextWantRecipe);

    // optimistic UI
    const userMsg = { id: uid(), role: "user", content: trimmed, time: hhmm() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // abort previous inflight request
    try {
      abortRef.current?.abort?.();
    } catch {}
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        pushAssistant(
          "❌ Du bist nicht eingeloggt. Bitte logge dich ein, damit ich dein Profil (inkl. Ernährung) aus der Datenbank nutzen kann."
        );
        return;
      }

      // compute history including the new user message
      const nextMessages = [...messages, userMsg];
      const history = historyForApi(nextMessages);

      const res = await fetch(apiUrl("/api/coach/chat"), {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: trimmed,
          history,
          intent: resolvedIntent,
          wantRecipe: resolvedWantRecipe,
        }),
      });

      const text = await readAsTextSafe(res);
      const json = parseJsonSafe(text);

      if (!res.ok) {
        const detail = pickErrorDetail({ text, json, res });
        pushAssistant(`❌ Fehler: ${res.status} ${res.statusText}\n\n${detail}`);
        return;
      }

      const reply = (json && json.reply) ? json.reply : (text || "⚠️ Keine Antwort.");
      pushAssistant(reply);
    } catch (e) {
      const isAbort = e?.name === "AbortError";
      pushAssistant(isAbort ? "⚠️ Anfrage abgebrochen." : `❌ Fehler: request_failed\n\n${String(e?.message || e)}`);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function downloadPdf() {
    try {
      const messagesForPdf = buildPdfMessages(messages);
      const title = `LaufX Coach – ${intentLabel}`;

      const res = await fetch(apiUrl("/api/pdf/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, messages: messagesForPdf }),
      });

      if (!res.ok) {
        const text = await readAsTextSafe(res);
        pushAssistant(`❌ Fehler: PDF konnte nicht erstellt werden.\n\n${text ? text.slice(0, 500) : ""}`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "laufx-coach-chat.pdf";
      a.click();

      URL.revokeObjectURL(url);
    } catch (e) {
      pushAssistant(`❌ Fehler: PDF Download fehlgeschlagen.\n\n${String(e?.message || e)}`);
    }
  }

  function resetChat() {
    // abort inflight request
    try {
      abortRef.current?.abort?.();
    } catch {}

    setShowRecipe(false);
    setWantRecipe(false);
    setIntent("training");
    setInput("");
    setMessages([{ id: uid(), role: "assistant", content: WELCOME, time: hhmm() }]);
    setLoading(false);
  }

  function handleIntentClick(next) {
    setShowRecipe(false);
    // Auto-send prompt:
    sendMessage(PROMPTS[next] ?? "", next, false);
  }

  function handleRecipeRequest() {
    setShowRecipe(false);
    // Rezept anfordern (ohne intent zu wechseln)
    sendMessage(PROMPTS.recipe, intent, true);
  }

  const S = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <div style={S.page}>
      {/* Scoped CSS (Markdown + anim) – nutzt nur Theme-Variablen / Tokens */}
      <style>{scopedCss()}</style>

      {/* Top / Header */}
      <div style={S.top}>
        <div style={S.topRow}>
          <div style={S.brand}>
            <div style={S.badge} aria-hidden="true">KI</div>

            <div style={S.titles}>
              <h1 style={S.h1}>Coach</h1>
              <div style={S.sub}>
                <span>Training</span><span style={S.sep}>•</span>
                <span>Technik</span><span style={S.sep}>•</span>
                <span>Ernährung</span><span style={S.sep}>•</span>
                <span style={S.dot} />
                <span>Bereit</span>
                <span style={S.intentPill}>({intentLabel})</span>
              </div>
            </div>
          </div>

          <div style={S.btnbar}>
            <button style={chipBtn(S, intent === "training")} onClick={() => handleIntentClick("training")} disabled={loading}>
              🏃 Training
            </button>
            <button style={chipBtn(S, intent === "technique")} onClick={() => handleIntentClick("technique")} disabled={loading}>
              🧠 Technik
            </button>
            <button style={chipBtn(S, intent === "nutrition")} onClick={() => handleIntentClick("nutrition")} disabled={loading}>
              🥗 Ernährung
            </button>

            <button
              style={chipBtn(S, wantRecipe, "soft")}
              onClick={handleRecipeRequest}
              disabled={loading}
              title="Rezept passend zu deinem Profil anfordern"
            >
              ✨ Rezept anfordern
            </button>

            <button style={chipBtn(S, false, "pdf")} onClick={downloadPdf} disabled={loading} title="Chat als PDF exportieren">
              📄 PDF
            </button>

            <button style={chipBtn(S, false, "reset")} onClick={resetChat} disabled={loading} title="Chat zurücksetzen">
              ♻️ Reset
            </button>
          </div>
        </div>
      </div>

      {/* Card / Chat */}
      <div style={S.card}>
        <div style={S.cardHead}>
          <h2 style={S.h2}>Chat</h2>
          <div style={S.hint}>
            Enter = senden · Shift+Enter = neue Zeile
          </div>
        </div>

        <div style={S.list} ref={listRef}>
          {messages.map((m) => (
            <div key={m.id} style={{ ...S.row, ...(m.role === "user" ? S.rowUser : null) }}>
              {m.role !== "user" && <div style={{ ...S.avatar, ...S.avatarCoach }}>C</div>}

              <div style={{ ...S.bubble, ...(m.role === "user" ? S.bubbleUser : S.bubbleCoach) }}>
                <div style={S.meta}>
                  <div style={S.who}>{m.role === "user" ? "Du" : "Coach"}</div>
                  <div style={S.time}>{m.time}</div>
                </div>
                <div className="md">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>

                {/* Optional: mini actions */}
                <div style={S.bubbleActions}>
                  <button
                    style={S.miniBtn}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(String(m.content || ""));
                      } catch {}
                    }}
                    title="Antwort kopieren"
                    type="button"
                  >
                    ⧉ Kopieren
                  </button>

                  {m.role === "assistant" && (
                    <button
                      style={S.miniBtn}
                      onClick={() => {
                        setShowRecipe(true);
                      }}
                      title="Letzte Coach-Antwort unten anzeigen"
                      type="button"
                    >
                      ↧ Unten anzeigen
                    </button>
                  )}
                </div>
              </div>

              {m.role === "user" && <div style={{ ...S.avatar, ...S.avatarUser }}>D</div>}
            </div>
          ))}

          {loading && (
            <div style={S.row}>
              <div style={{ ...S.avatar, ...S.avatarCoach }}>C</div>
              <div style={{ ...S.bubble, ...S.bubbleCoach }}>
                <div style={S.meta}>
                  <div style={S.who}>Coach</div>
                  <div style={S.time}>{hhmm()}</div>
                </div>
                <div style={S.typing}>
                  <span className="dots" aria-hidden="true">
                    <span className="dotAnim" />
                    <span className="dotAnim" style={{ animationDelay: "120ms" }} />
                    <span className="dotAnim" style={{ animationDelay: "240ms" }} />
                  </span>
                  <span style={{ opacity: 0.8 }}>… schreibt</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {showRecipe && recipeMessage && (
          <div style={S.drawer}>
            <div style={S.drawerTitle}>
              <b>🍽️ Letzte Coach-Antwort</b>
              <span style={S.small}>Tipp: Für PDF wird der komplette Chat exportiert.</span>
            </div>
            <div className="md">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{recipeMessage.content}</ReactMarkdown>
            </div>
          </div>
        )}

        <div style={S.inputRow}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder='z.B. "Ich möchte einen Ernährungsplan für die Woche"'
            style={S.textarea}
            disabled={loading}
          />
          <button style={{ ...S.sendBtn, ...(loading ? S.sendBtnDisabled : null) }} onClick={() => sendMessage()} disabled={!canSend}>
            {loading ? "Sende …" : "Senden →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Theme-aware styles using semantic tokens from ThemeContext.jsx */
function makeStyles(colors, isDark) {
  const ring = isDark ? "rgba(255,255,255,.10)" : "rgba(15,23,42,.10)";

  return {
    page: {
      maxWidth: 1100,
      margin: "0 auto",
      padding: 18,
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
      color: colors.text,
    },

    top: {
      position: "relative",
      zIndex: 50,
      borderRadius: 20,
      padding: "14px 16px",
      background: colors.card,
      border: `1px solid ${colors.border}`,
      boxShadow: colors.shadow,
    },

    topRow: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 14,
      flexWrap: "wrap",
    },

    brand: { display: "flex", alignItems: "center", gap: 12 },
    badge: {
      width: 46,
      height: 46,
      borderRadius: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 950,
      color: colors.onLight,
      background: `linear-gradient(135deg, ${isDark ? "rgba(99,102,241,.55)" : "rgba(147,197,253,1)"}, ${isDark ? "rgba(16,185,129,.45)" : "rgba(196,181,253,1)"})`,
      border: `1px solid ${colors.borderSubtle}`,
    },

    titles: { lineHeight: 1.05 },
    h1: { margin: 0, fontSize: 22, letterSpacing: -0.3 },
    sub: {
      margin: "3px 0 0",
      color: colors.muted,
      fontSize: 13,
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
    },
    sep: { opacity: 0.55 },

    dot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      background: "rgba(34,197,94,1)",
      boxShadow: `0 0 0 3px rgba(34,197,94,.14)`,
      display: "inline-block",
    },

    intentPill: {
      marginLeft: 6,
      fontWeight: 900,
      color: colors.text,
      opacity: 0.9,
    },

    btnbar: {
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
      justifyContent: "flex-end",
      position: "relative",
      zIndex: 60,
    },

    chipBase: {
      userSelect: "none",
      padding: "10px 14px",
      borderRadius: 999,
      border: `1px solid ${colors.panelBorder}`,
      background: colors.panelBg,
      color: colors.panelText,
      fontWeight: 850,
      fontSize: 13,
      cursor: "pointer",
      boxShadow: colors.shadow,
      transition: "transform .05s ease, filter .15s ease, border-color .15s ease",
      outline: "none",
    },
    chipActive: {
      borderColor: isDark ? "rgba(99,102,241,.55)" : "rgba(99,102,241,.45)",
      boxShadow: `${colors.shadow}, 0 0 0 4px ${ring}`,
      filter: "brightness(1.02)",
    },
    chipSoft: {
      borderColor: isDark ? "rgba(16,185,129,.38)" : "rgba(16,185,129,.35)",
    },
    chipPdf: {
      borderColor: isDark ? "rgba(107,114,128,.42)" : "rgba(107,114,128,.35)",
    },
    chipReset: {
      borderColor: isDark ? "rgba(239,68,68,.45)" : "rgba(239,68,68,.35)",
    },

    card: {
      marginTop: 14,
      borderRadius: 20,
      background: colors.card,
      border: `1px solid ${colors.borderSubtle}`,
      boxShadow: colors.shadow,
      overflow: "hidden",
    },

    cardHead: {
      padding: "12px 14px",
      background: colors.soft,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      borderBottom: `1px solid ${colors.borderSubtle}`,
    },
    h2: { margin: 0, fontSize: 16 },
    hint: { color: colors.muted, fontSize: 13 },

    list: {
      height: "58vh",
      minHeight: 420,
      overflow: "auto",
      padding: 16,
      background: colors.soft,
    },

    row: { display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-end" },
    rowUser: { justifyContent: "flex-end" },

    avatar: {
      width: 38,
      height: 38,
      borderRadius: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 950,
      color: colors.text,
      flex: "0 0 auto",
      border: `1px solid ${colors.borderSubtle}`,
      background: isDark ? "rgba(255,255,255,.04)" : "rgba(15,23,42,.04)",
    },
    avatarCoach: { background: isDark ? "rgba(59,130,246,.10)" : "rgba(219,234,254,1)" },
    avatarUser: { background: isDark ? "rgba(34,197,94,.10)" : "rgba(220,252,231,1)" },

    bubble: {
      maxWidth: 780,
      padding: "14px 16px",
      borderRadius: 18,
      border: `1px solid ${colors.borderSubtle}`,
      boxShadow: colors.shadow,
      background: colors.card,
      color: colors.text,
    },
    bubbleCoach: { background: colors.card },
    bubbleUser: { background: colors.card7ed },

    meta: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8 },
    who: { fontWeight: 950, color: colors.text },
    time: { fontSize: 12, color: colors.muted },

    bubbleActions: {
      marginTop: 10,
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      justifyContent: "flex-end",
    },
    miniBtn: {
      borderRadius: 999,
      border: `1px solid ${colors.borderSubtle}`,
      background: isDark ? "rgba(255,255,255,.04)" : "rgba(15,23,42,.04)",
      color: colors.text,
      padding: "6px 10px",
      fontWeight: 850,
      fontSize: 12,
      cursor: "pointer",
    },

    drawer: {
      borderTop: `1px solid ${colors.borderSubtle}`,
      background: colors.soft,
      padding: 14,
    },
    drawerTitle: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      gap: 12,
      flexWrap: "wrap",
    },
    small: { color: colors.muted, fontSize: 12 },

    inputRow: {
      display: "flex",
      gap: 10,
      padding: 14,
      borderTop: `1px solid ${colors.borderSubtle}`,
      background: colors.card,
      alignItems: "flex-end",
    },

    textarea: {
      flex: 1,
      resize: "none",
      minHeight: 54,
      maxHeight: 180,
      padding: "12px 12px",
      borderRadius: 14,
      border: `1px solid ${colors.border}`,
      outline: "none",
      fontSize: 14,
      background: colors.card,
      color: colors.text,
      lineHeight: 1.4,
      boxShadow: "none",
    },

    sendBtn: {
      padding: "12px 16px",
      borderRadius: 14,
      border: `1px solid ${colors.border}`,
      cursor: "pointer",
      fontWeight: 950,
      background: colors.text,
      color: colors.onLight,
      whiteSpace: "nowrap",
    },
    sendBtnDisabled: { opacity: 0.65, cursor: "not-allowed" },

    typing: { display: "flex", alignItems: "center", gap: 10 },
  };
}

function chipBtn(S, active, variant = "default") {
  const base = { ...S.chipBase };
  const v =
    variant === "soft"
      ? S.chipSoft
      : variant === "pdf"
      ? S.chipPdf
      : variant === "reset"
      ? S.chipReset
      : null;

  const merged = { ...base, ...(v || null), ...(active ? S.chipActive : null) };
  return merged;
}

function scopedCss() {
  return `
/* Markdown */
.md { color: var(--color-text); }
.md h1,.md h2,.md h3 { margin: 10px 0 6px; line-height: 1.2; }
.md h2 { font-size: 16px; }
.md h3 { font-size: 14px; }
.md p { margin: 6px 0; line-height: 1.55; white-space: pre-wrap; }
.md ul,.md ol { margin: 8px 0 8px 18px; }
.md li { margin: 3px 0; }
.md code { background: rgba(0,0,0,.06); padding: 2px 6px; border-radius: 8px; }
[data-theme="dark"] .md code { background: rgba(255,255,255,.08); }
.md hr { border: none; border-top: 1px solid var(--color-borderSubtle); margin: 12px 0; }
.md blockquote { border-left: 3px solid rgba(99,102,241,.35); padding-left: 10px; color: var(--color-muted); margin: 8px 0; }

/* Typing dots */
.dots { display:inline-flex; align-items:center; gap:6px; }
.dotAnim{
  width:6px; height:6px; border-radius:999px;
  background: currentColor;
  opacity:.35;
  display:inline-block;
  animation: coachDot 900ms infinite ease-in-out;
}
@keyframes coachDot{
  0%,100%{ transform: translateY(0); opacity:.25; }
  50%{ transform: translateY(-3px); opacity:.75; }
}
`;
}
