import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "./LanguageContext.jsx";
import { elearningModules } from "./elearningContent.js";
import "./elearning-ui.css";
import { ThemeProvider } from "./ThemeContext.jsx";

function normalizeModules(modulesObj) {
  return Object.entries(modulesObj || {})
    .map(([key, mod]) => ({ ...(mod || {}), id: key }))
    .sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999));
}

function readDoneMap() {
  try {
    return JSON.parse(localStorage.getItem("elearning_done") || "{}") || {};
  } catch {
    return {};
  }
}

export default function ELearningPage() {
  const { language } = useLanguage();
  const lang = language === "en" ? "en" : "de";

  const modules = useMemo(() => normalizeModules(elearningModules), []);
  const doneMap = readDoneMap();
  const doneCount = modules.filter((m) => doneMap[m.id]).length;

  return (
    <div className="el-page">
      <div className="el-wrap">
        <div className="el-hero">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 className="el-title">E-Learning</h1>
              <p className="el-sub">
                Schritt-für-Schritt Module mit Wissen, Kernpunkten und Praxis-Aufgaben.
              </p>
            </div>

            <div className="el-panel" style={{ alignSelf: "start", minWidth: 220 }}>
              <div style={{ fontWeight: 950, marginBottom: 6 }}>Dein Fortschritt</div>
              <div className="el-muted">
                Erledigt: <strong style={{ color: "#111827" }}>{doneCount}</strong> /{" "}
                {modules.length}
              </div>
            </div>
          </div>
        </div>

        <div className="el-grid">
          {modules.map((mod) => {
            const m = mod?.[lang] || mod?.de || mod;
            const minutes = mod?.meta?.minutes;
            const level = mod?.meta?.level;
            const isDone = !!doneMap[mod.id];

            return (
              <div className="el-card" key={mod.id}>
                <div className="el-cardTop">
                  <div className="el-cardTitle">{m?.title || "Modul"}</div>

                  <span className={`el-badge ${isDone ? "el-badgeDone" : ""}`}>
                    {isDone ? "Erledigt" : `#${mod.order ?? "—"}`}
                  </span>
                </div>

                <div className="el-metaRow">
                  {typeof minutes === "number" && (
                    <span className="el-badge">{minutes} min</span>
                  )}
                  {level && <span className="el-badge">{level}</span>}
                </div>

                {m?.description && <div className="el-desc">{m.description}</div>}

                <div className="el-btnRow">
                  <Link className="el-btn el-btnSolid" to={`/e-learning/${mod.id}`}>
                    Modul starten →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
