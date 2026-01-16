import React, { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "./LanguageContext.jsx";
import { elearningModules } from "./elearningContent.js";
import "./elearning-ui.css";


function normalizeModules(modulesObj) {
  return Object.entries(modulesObj || {})
    .map(([key, mod]) => ({ ...(mod || {}), id: key }))
    .sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999));
}

function localize(mod, lang) {
  return mod ? mod?.[lang] || mod?.de || mod : null;
}

function readDoneMap() {
  try {
    return JSON.parse(localStorage.getItem("elearning_done") || "{}") || {};
  } catch {
    return {};
  }
}
function writeDoneMap(map) {
  localStorage.setItem("elearning_done", JSON.stringify(map || {}));
}

/** Beautifier: bullets, callouts, paragraphs */
function renderRichText(text) {
  if (!text || typeof text !== "string") return null;

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let buf = [];
  let bullets = [];

  const flushParagraph = () => {
    const t = buf.join(" ").trim();
    if (t) blocks.push({ type: "p", text: t });
    buf = [];
  };
  const flushBullets = () => {
    if (bullets.length) blocks.push({ type: "ul", items: bullets });
    bullets = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      flushParagraph();
      continue;
    }

    const calloutMatch = line.match(/^(tipp|fehler|check|merke)\s*:\s*(.+)$/i);
    if (calloutMatch) {
      flushBullets();
      flushParagraph();
      blocks.push({
        type: "callout",
        title:
          calloutMatch[1].charAt(0).toUpperCase() +
          calloutMatch[1].slice(1).toLowerCase(),
        text: calloutMatch[2].trim(),
      });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      bullets.push(line.slice(2).trim());
      continue;
    }

    flushBullets();
    buf.push(line);
  }

  flushBullets();
  flushParagraph();

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {blocks.map((b, i) => {
        if (b.type === "p") {
          return (
            <p key={i} style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {b.text}
            </p>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={i} className="el-list">
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "callout") {
          return (
            <div key={i} className="el-callout">
              <div className="el-calloutTitle">{b.title}</div>
              <div style={{ color: "#374151", lineHeight: 1.65 }}>{b.text}</div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((it, idx) => {
        const isOpen = idx === open;
        return (
          <div className="el-accItem" key={idx}>
            <button
              type="button"
              className="el-accBtn"
              onClick={() => setOpen(isOpen ? -1 : idx)}
            >
              <span>{it?.heading || `Abschnitt ${idx + 1}`}</span>
              <span style={{ color: "#6b7280", fontWeight: 900 }}>
                {isOpen ? "–" : "+"}
              </span>
            </button>
            {isOpen && <div className="el-accBody">{renderRichText(it?.text || "")}</div>}
          </div>
        );
      })}
    </div>
  );
}

function StepShell({ title, subtitle, children }) {
  return (
    <div className="el-panel">
      <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>{title}</div>
      {subtitle ? <div className="el-muted" style={{ marginBottom: 10 }}>{subtitle}</div> : null}
      {children}
    </div>
  );
}

function Resources({ resources }) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return <div className="el-muted">Noch keine Materialien hinterlegt.</div>;
  }

  return (
    <div className="el-resourceList">
      {resources.map((r, idx) => (
        <div key={idx} className="el-resource">
          <div className="el-resourceMeta">
            <span className="el-chip">{r.type || "Link"}</span>
            {r.duration ? <span className="el-chip">{r.duration}</span> : null}
            {r.source ? <span className="el-chip">{r.source}</span> : null}
          </div>

          <a className="el-link" href={r.url} target="_blank" rel="noreferrer">
            {r.title || r.url}
          </a>

          {r.note ? <div className="el-muted">{r.note}</div> : null}
        </div>
      ))}
    </div>
  );
}

function Quiz({ quiz, onDone }) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    setIdx(0);
    setPicked(null);
    setScore(0);
  }, [quiz]);

  if (questions.length === 0) {
    return <div className="el-muted">Noch kein Quiz hinterlegt.</div>;
  }

  const q = questions[idx];
  const correct = q?.correctIndex;

  const choose = (optIndex) => {
    if (picked !== null) return;
    setPicked(optIndex);
    if (optIndex === correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1);
      setPicked(null);
    } else {
      onDone?.(score + (picked === correct ? 1 : 0), questions.length);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="el-muted">Frage {idx + 1} / {questions.length}</div>
      <div className="el-quizQ">{q.q}</div>

      <div style={{ display: "grid", gap: 10 }}>
        {q.options.map((opt, i) => {
          let cls = "el-quizOpt";
          if (picked !== null) {
            if (i === correct) cls += " el-quizOptCorrect";
            else if (i === picked) cls += " el-quizOptWrong";
          }
          return (
            <button key={i} type="button" className={cls} onClick={() => choose(i)}>
              {opt}
            </button>
          );
        })}
      </div>

      {picked !== null && q.explanation ? (
        <div className="el-callout">
          <div className="el-calloutTitle">Warum?</div>
          <div className="el-muted">{q.explanation}</div>
        </div>
      ) : null}

      <div className="el-btnRow">
        <button
          type="button"
          className="el-btn el-btnSolid"
          disabled={picked === null}
          style={{ opacity: picked === null ? 0.5 : 1 }}
          onClick={next}
        >
          {idx < questions.length - 1 ? "Nächste Frage →" : "Quiz abschließen ✅"}
        </button>
      </div>
    </div>
  );
}

export default function ELearningModulePage() {
  const { moduleId } = useParams();
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "de";

  const modulesList = useMemo(() => normalizeModules(elearningModules), []);
  let moduleRaw = elearningModules?.[moduleId] ?? null;
  if (!moduleRaw) {
    moduleRaw = Object.values(elearningModules || {}).find((m) => m?.id === moduleId) ?? null;
  }
  const m = useMemo(() => localize(moduleRaw, lang), [moduleRaw, lang]);

  const nav = useMemo(() => {
    const i = modulesList.findIndex((x) => x?.id === moduleId);
    return {
      prev: i > 0 ? modulesList[i - 1] : null,
      next: i >= 0 && i < modulesList.length - 1 ? modulesList[i + 1] : null,
    };
  }, [modulesList, moduleId]);

  const [doneMap, setDoneMap] = useState(() => readDoneMap());
  const isDone = !!doneMap[moduleId];

  const toggleDone = () => {
    const next = { ...doneMap, [moduleId]: !isDone };
    setDoneMap(next);
    writeDoneMap(next);
  };

  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => setStepIndex(0), [moduleId]);

  if (!moduleRaw || !m) {
    return (
      <div className="el-content">
        <Link className="el-btn" to="/e-learning">← Zur Übersicht</Link>
        <div className="el-panel" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>Modul nicht gefunden</div>
          <div className="el-muted">Unbekannte Modul-ID: <code>{String(moduleId)}</code></div>
        </div>
      </div>
    );
  }

  const resources = (moduleRaw?.resources?.[lang] || moduleRaw?.resources?.de || moduleRaw?.resources || []);
  const quiz = (moduleRaw?.quiz?.[lang] || moduleRaw?.quiz?.de || moduleRaw?.quiz || null);

  const hasGoals = Array.isArray(m.learningGoals) && m.learningGoals.length > 0;
  const hasKeyPoints = Array.isArray(m.keyPoints) && m.keyPoints.length > 0;
  const hasLesson = Array.isArray(m.lesson) && m.lesson.length > 0;
  const hasTask = !!m.task;

  const steps = [
    { key: "overview", label: "Überblick", show: true },
    { key: "goals", label: "Lernziele", show: hasGoals },
    { key: "keypoints", label: "Kernpunkte", show: hasKeyPoints },
    { key: "lesson", label: "Wissen & Kontext", show: hasLesson },
    { key: "task", label: "Praxis-Aufgabe", show: hasTask },
    { key: "resources", label: "Material", show: true },
    { key: "quiz", label: "Quiz", show: true },
  ].filter((s) => s.show);

  const current = steps[stepIndex] || steps[0];
  const progressPct = Math.round(((stepIndex + 1) / steps.length) * 100);

  const goPrevStep = () => setStepIndex((i) => Math.max(0, i - 1));
  const goNextStep = () => setStepIndex((i) => Math.min(steps.length - 1, i + 1));

  const minutes = moduleRaw?.meta?.minutes;
  const level = moduleRaw?.meta?.level;

  const [quizResult, setQuizResult] = useState(null);

  return (
    <div className="el-content">
      {/* Top nav */}
      <div className="el-topbar">
        <Link className="el-btn" to="/e-learning">← Zurück</Link>

        <div className="el-topbarRight">
          {nav.prev ? (
            <Link className="el-btn" to={`/e-learning/${nav.prev.id}`}>← Vorheriges Modul</Link>
          ) : (
            <span className="el-btn" style={{ opacity: 0.5, cursor: "default" }}>← Vorheriges Modul</span>
          )}
          {nav.next ? (
            <Link className="el-btn el-btnSolid" to={`/e-learning/${nav.next.id}`}>Nächstes Modul →</Link>
          ) : (
            <span className="el-btn el-btnSolid" style={{ opacity: 0.5, cursor: "default" }}>Nächstes Modul →</span>
          )}
        </div>
      </div>

      {/* Compact header */}
      <div className="el-panel el-moduleHeader" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 260 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {typeof minutes === "number" && <span className="el-badge">{minutes} min</span>}
              {level && <span className="el-badge">{level}</span>}
              <span className={`el-badge ${isDone ? "el-badgeDone" : ""}`}>{isDone ? "Erledigt" : "Offen"}</span>
            </div>

            <h1 className="el-h1" style={{ textAlign: "left" }}>{m.title || "Modul"}</h1>
            {m.description && <div className="el-muted">{m.description}</div>}
          </div>

          <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
            <button type="button" className={`el-btn ${isDone ? "" : "el-btnSolid"}`} onClick={toggleDone}>
              {isDone ? "Als offen markieren" : "Als erledigt markieren ✅"}
            </button>

            {quizResult ? (
              <div className="el-callout">
                <div className="el-calloutTitle">Quiz Ergebnis</div>
                <div className="el-muted">{quizResult.score} / {quizResult.total} richtig</div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="el-progress">
          <div className="el-progressBar" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Layout: small legend left, big content right */}
      <div className="el-moduleLayout">
        <aside className="el-moduleSidebar">
          <div className="el-panel">
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Inhalt</div>
            <div className="el-contents">
              {steps.map((s, idx) => (
                <button
                  key={s.key}
                  type="button"
                  className={`el-stepItem ${idx === stepIndex ? "el-stepItemActive" : ""}`}
                  onClick={() => setStepIndex(idx)}
                >
                  <span className={`el-stepNr ${idx === stepIndex ? "" : "el-stepNrInactive"}`}>{idx + 1}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            <div className="el-btnRow" style={{ marginTop: 12 }}>
              <button type="button" className="el-btn" onClick={goPrevStep} disabled={stepIndex === 0} style={{ opacity: stepIndex === 0 ? 0.5 : 1 }}>
                ←
              </button>
              <button type="button" className="el-btn el-btnSolid" onClick={goNextStep} disabled={stepIndex === steps.length - 1} style={{ opacity: stepIndex === steps.length - 1 ? 0.5 : 1 }}>
                →
              </button>
            </div>
          </div>
        </aside>

        <main>
          {current.key === "overview" && (
            <StepShell title="Überblick" subtitle="Kurz: Was, warum, worauf du achtest.">
              {renderRichText(m.description || "")}
            </StepShell>
          )}

          {current.key === "goals" && (
            <StepShell title="Lernziele" subtitle="Das nimmst du mit.">
              <ul className="el-list">{m.learningGoals.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </StepShell>
          )}

          {current.key === "keypoints" && (
            <StepShell title="Kernpunkte" subtitle="Die wichtigsten Punkte auf einen Blick.">
              <ul className="el-list">{m.keyPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </StepShell>
          )}

          {current.key === "lesson" && (
            <StepShell title="Wissen & Kontext" subtitle="Öffne die Abschnitte und arbeite sie durch.">
              <Accordion items={m.lesson} />
            </StepShell>
          )}

          {current.key === "task" && (
            <StepShell title="Praxis-Aufgabe" subtitle="Mach’s praktisch – dann reflektieren.">
              {m.task?.title && <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>{m.task.title}</div>}
              {Array.isArray(m.task?.steps) && <ol className="el-list">{m.task.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>}
              {m.task?.reflection && (
                <div className="el-callout" style={{ marginTop: 12 }}>
                  <div className="el-calloutTitle">Reflexion</div>
                  {renderRichText(m.task.reflection)}
                </div>
              )}
            </StepShell>
          )}

          {current.key === "resources" && (
            <StepShell title="Material" subtitle="Videos & Artikel passend zum Modul.">
              <Resources resources={resources} />
            </StepShell>
          )}

          {current.key === "quiz" && (
            <StepShell title="Quiz" subtitle="Kurzer Check – hast du’s verstanden?">
              <Quiz quiz={quiz} onDone={(score, total) => setQuizResult({ score, total })} />
            </StepShell>
          )}
        </main>
      </div>
    </div>
  );
}
