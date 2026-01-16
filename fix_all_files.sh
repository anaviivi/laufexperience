#!/usr/bin/env bash
set -euo pipefail

echo "==[0] Projekt-Root prüfen =="
ROOT="$(pwd)"
echo "ROOT=$ROOT"

# --- Backend coach route finden ---
COACH="$(find "$ROOT" -maxdepth 4 -path "*backend/routes/coach.js" -print | head -n1 || true)"
if [ -z "$COACH" ]; then
  COACH="$(find "$ROOT" -maxdepth 6 -path "*routes/coach.js" -print | head -n1 || true)"
fi
[ -n "$COACH" ] || { echo "❌ backend/routes/coach.js nicht gefunden."; exit 1; }
echo "✅ COACH=$COACH"

# --- Frontend files finden ---
KIPAGE="$(find "$ROOT" -maxdepth 8 -name "KICoachingPage.jsx" -print | head -n1 || true)"
COACHCHAT_UI="$(find "$ROOT" -maxdepth 8 -name "CoachChat.jsx" -print | head -n1 || true)"

[ -n "$KIPAGE" ] || echo "⚠️ KICoachingPage.jsx nicht gefunden (Panel-Patch wird übersprungen)."
[ -n "$COACHCHAT_UI" ] || echo "⚠️ CoachChat.jsx nicht gefunden (userId-Patch wird übersprungen)."

# --- Backups ---
ts="$(date +%s)"
cp "$COACH" "$COACH.bak.$ts"
[ -n "${KIPAGE:-}" ] && cp "$KIPAGE" "$KIPAGE.bak.$ts" || true
[ -n "${COACHCHAT_UI:-}" ] && cp "$COACHCHAT_UI" "$COACHCHAT_UI.bak.$ts" || true

echo "==[1] BACKEND: Rezept-Intents + Filter + Bugfix + Save + Wizard =="

# 1A) Rezeptdetail-Bug: "rezepte" darf NICHT "rezept" triggern -> \brezept\b
perl -0777 -i -pe 's/norm\(message\)\.includes\("rezept"\)/\/\\brezept\\b\/.test(norm(message))/g' "$COACH"

# 1B) Rezept-Filter/Intent Helpers hinzufügen (idempotent)
if ! grep -q "RECIPE_FILTER_V2" "$COACH"; then
  perl -0777 -i -pe 's/(function\s+norm\(s\)\s*\{[\s\S]*?\}\s*)/$1\n\n\/\/ ===== RECIPE_FILTER_V2 =====\nfunction extractRecipeQuery(message=\"\") {\n  const m = norm(message);\n  const tags = [];\n  const wantAll = /\\balle\\b/.test(m) || m === \"rezepte\" || m === \"gerichte\";\n\n  const map = [\n    [\"vegan\", \"vegan\"],\n    [\"vegetarisch\", \"vegetarisch\"],\n    [\"glutenfrei\", \"glutenfrei\"],\n    [\"proteinreich\", \"high-protein\"],\n    [\"high protein\", \"high-protein\"],\n    [\"protein\", \"high-protein\"],\n    [\"low carb\", \"low-carb\"],\n    [\"lowcarb\", \"low-carb\"],\n    [\"pre run\", \"prerun\"],\n    [\"prerun\", \"prerun\"],\n    [\"vor dem lauf\", \"prerun\"],\n    [\"post run\", \"postrun\"],\n    [\"postrun\", \"postrun\"],\n    [\"nach dem lauf\", \"postrun\"],\n    [\"recovery\", \"postrun\"],\n    [\"low fiber\", \"low-fiber\"],\n    [\"low-fiber\", \"low-fiber\"],\n    [\"wenig ballaststoffe\", \"low-fiber\"],\n    [\"carbs\", \"carbs\"],\n    [\"kohlenhydrate\", \"carbs\"],\n    [\"high carb\", \"carbs\"],\n  ];\n\n  for (const [key, tag] of map) {\n    if (m.includes(key)) tags.push(tag);\n  }\n\n  // freie Suche: \"rezepte mit tofu\" -> query \"tofu\"\n  let q = \"\";\n  const mm = m.match(/rezepte\\s+(?:mit|für|aus)\\s+(.+)$/i);\n  if (mm?.[1]) q = mm[1].trim();\n\n  const isList = m.includes(\"rezepte\") || m.includes(\"gerichte\") || m.includes(\"meal\") || m.includes(\"essen\");\n  const wantOther = m.includes(\"andere\") || m.includes(\"mehr\") || m.includes(\"weitere\") || m.includes(\"noch\");\n\n  return { isList, wantAll, wantOther, tags: [...new Set(tags)], q };\n}\n\nfunction formatRecipeList(items, headline) {\n  const list = items.map((r,i)=> `${i+1}. ${r.title || r.name || r.id}`).join(\"\\n\");\n  return `${headline}\\n\\n${list}\\n\\n👉 Sag z.B.: „Gib mir das Rezept 3“ oder „Gib mir ${items[0]?.title || \"das 1. Rezept\"}“`;\n}\n\/\/ ===== \\/RECIPE_FILTER_V2 =====\n\n/s' "$COACH"
fi

# 1C) Wizard Helpers hinzufügen (idempotent)
if ! grep -q "WIZARD_V2" "$COACH"; then
  perl -0777 -i -pe 's/(\/\/ ===== \\/RECIPE_FILTER_V2 =====\n\n)/$1\/\/ ===== WIZARD_V2 =====\nfunction extractAutoProfile(text = \"\") {\n  const t = String(text);\n  const out = {};\n  const days = t.match(/(\\d+)\\s*(x|mal)\\s*(pro|die)\\s*woche/i);\n  if (days?.[1]) out.runs_per_week = Number(days[1]);\n  const mins = t.match(/(\\d+)\\s*(min|minute|minuten)/i);\n  if (mins?.[1]) out.session_minutes = Number(mins[1]);\n  const km = t.match(/(\\d+(?:[.,]\\d+)?)\\s*(k|km)\\b/i);\n  if (km?.[1]) out.current_km = Number(String(km[1]).replace(\",\",\".\"));\n\n  if (/halbmarathon|\\bhm\\b/i.test(t)) out.goal = \"halbmarathon\";\n  else if (/marathon/i.test(t)) out.goal = \"marathon\";\n  else {\n    const g = t.match(/ziel\\s*(\\d+(?:[.,]\\d+)?)\\s*km/i);\n    if (g?.[1]) out.goal = `${String(g[1]).replace(\",\",\".\")}km`;\n  }\n  return out;\n}\n\nfunction wizardNextQuestion(p = {}) {\n  if (!p.goal) return \"1) Was ist dein Ziel? (z.B. 5 km, 10 km, Halbmarathon)\";\n  if (!p.runs_per_week) return \"2) An wie vielen Tagen pro Woche kannst du laufen? (z.B. 3x/Woche)\";\n  if (!p.session_minutes) return \"3) Wie viel Zeit pro Einheit hast du? (z.B. 30 min)\";\n  if (!p.current_km) return \"4) Was schaffst du aktuell locker am Stück? (z.B. 2 km)\";\n  return null;\n}\n\nfunction makeWeekPlan(p = {}) {\n  const d = Math.max(2, Math.min(6, Number(p.runs_per_week || 3)));\n  const m = Math.max(15, Math.min(120, Number(p.session_minutes || 30)));\n  const easy = Math.round(m * 0.8);\n  const quality = Math.round(m * 0.9);\n  const lines = [];\n  if (d >= 3) {\n    lines.push(`Tag 1: Locker ${easy} min (RPE 3–4) + 4×20s Steigerungen`);\n    lines.push(`Tag 2: Intervall leicht: 10 min einlaufen, 6×1 min zügig (RPE 7) / 2 min locker, auslaufen`);\n    lines.push(`Tag 3: Locker ${easy} min (RPE 3–4)`);\n    if (d >= 4) lines.push(`Tag 4: Langer Lauf: ${Math.min(m + 10, 75)} min locker (RPE 3–4)`);\n  } else {\n    lines.push(`Tag 1: Locker ${easy} min (RPE 3–4)`);\n    lines.push(`Tag 2: Fahrtspiel: ${quality} min – 6×30s schneller / 90s locker`);\n  }\n  return `✅ Dein Wochen-Trainingsplan (Vorschau)\\n\\nZiel: ${p.goal} · ${d}×/Woche · ${m} min\\n\\n${lines.map(x=>\"• \"+x).join(\"\\n\")}\\n\\nWenn du willst, erstelle ich dir daraus einen 8-Wochen-Plan.`;\n}\n\/\/ ===== \\/WIZARD_V2 =====\n\n/s' "$COACH"
fi

# 1D) Save Route /plans hinzufügen (idempotent)
if ! grep -q 'router.post("/plans"' "$COACH"; then
  cat >> "$COACH" <<'JS'


// ===============================
// ✅ Saved Plans API (für 💾 Button)
// ===============================
const SAVED_PLANS_DB = path.join(DATA_DIR, "savedCoachPlans.json");

function readPlansDb() {
  return safeReadJson(SAVED_PLANS_DB, { plans: [] });
}
function writePlansDb(db) {
  safeWriteJson(SAVED_PLANS_DB, db);
}

// POST /api/coach/plans
router.post("/plans", (req, res) => {
  try {
    const { userId, title, rawText, jsonData } = req.body || {};
    const uid = String(userId || "guest");
    const t = String(title || "Coach Output").slice(0, 140);

    if (!rawText || String(rawText).trim().length < 5) {
      return res.status(400).json({ error: "rawText fehlt oder zu kurz" });
    }

    const db = readPlansDb();
    const id = `plan_${Date.now().toString(16)}_${Math.random().toString(16).slice(2,8)}`;

    const plan = {
      id,
      userId: uid,
      title: t,
      rawText: String(rawText),
      jsonData: jsonData ?? null,
      createdAt: new Date().toISOString(),
    };

    db.plans = Array.isArray(db.plans) ? db.plans : [];
    db.plans.push(plan);
    writePlansDb(db);

    return res.json({ ok: true, plan });
  } catch (e) {
    return res.status(500).json({ error: "Save failed", details: String(e?.message || e) });
  }
});

// GET /api/coach/plans/:id
router.get("/plans/:id", (req, res) => {
  const id = String(req.params.id || "");
  const db = readPlansDb();
  const plan = (db.plans || []).find(p => p.id === id);
  if (!plan) return res.status(404).json({ error: "Plan nicht gefunden" });
  return res.json({ ok: true, plan });
});

JS
fi

# 1E) In POST /api/coach früh abfangen: Wizard + Rezepte DB-Liste (ohne LLM)
# Wir injizieren nach "const profile/state" (falls vorhanden) sonst nach "const message"
if ! grep -q "DB_RECIPE_GATE_V2" "$COACH"; then
  perl -0777 -i -pe '
s/(const\s+message\s*=\s*[^;]+;\s*\n)/$1\n  \/\/ ===== DB_RECIPE_GATE_V2 =====\n  try {\n    const p0 = getProfile(userId);\n    const st0 = getUserState(userId);\n\n    \/\/ Auto-Profil aus normalen Antworten\n    const auto = extractAutoProfile(message);\n    if (auto && Object.keys(auto).length) patchProfile(userId, auto);\n\n    \/\/ Wizard aktivieren per Keyword oder State\n    const m0 = norm(message);\n    const wantsWizard = m0.includes(\"trainings-wizard\") || m0.includes(\"wizard\") || (st0 && st0.wizardActive);\n    if (wantsWizard) {\n      setUserState(userId, { wizardActive: true });\n      const p1 = getProfile(userId);\n      const q = wizardNextQuestion(p1);\n      if (q) return res.json({ source:\"wizard\", reply: \"🧭 Trainings-Wizard\\n\\n\" + q + \"\\n\\n(Tipp: antworte z.B. „2k, 30 min, 3x die Woche“.)\" });\n      setUserState(userId, { wizardActive: false });\n      return res.json({ source:\"wizard\", reply: makeWeekPlan(p1) });\n    }\n\n    \/\/ Rezepte-Liste aus DB (mit Tag + Textsuche)\n    const rq = extractRecipeQuery(message);\n    if (rq.isList && (m0.includes(\"rezepte\") || m0.includes(\"gerichte\"))) {\n      let items = Array.isArray(recipes) ? recipes : [];\n\n      if (rq.tags.length) {\n        items = items.filter(r => {\n          const tags = Array.isArray(r?.tags) ? r.tags.map(x=>String(x).toLowerCase()) : [];\n          return rq.tags.every(t => tags.includes(String(t).toLowerCase()));\n        });\n      }\n\n      if (rq.q) {\n        const qq = rq.q.toLowerCase();\n        items = items.filter(r => {\n          const title = String(r?.title || r?.name || \"\").toLowerCase();\n          const text = String(r?.text || \"\").toLowerCase();\n          const tags = Array.isArray(r?.tags) ? r.tags.join(\" \").toLowerCase() : \"\";\n          return title.includes(qq) || text.includes(qq) || tags.includes(qq);\n        });\n      }\n\n      if (!items.length) {\n        return res.json({ source:\"db_recipe\", reply: \"⚠️ Keine passenden Rezepte gefunden.\\n\\nBeispiele: „rezepte vegan“, „rezepte glutenfrei“, „rezepte proteinreich“, „rezepte mit tofu“.\" });\n      }\n\n      setUserState(userId, { lastRecipeList: items.slice(0, 200).map(r => ({ id: r.id, title: r.title })) });\n\n      const head = rq.tags.length ? `📚 **Rezepte (${rq.tags.join(\", \")})**` : \"📚 **Rezepte**\";\n      return res.json({ source:\"db_recipe\", reply: formatRecipeList(items.slice(0, 200), head) });\n    }\n\n    \/\/ \"Gib mir Rezept 3\" aus der letzten Liste\n    const pick = m0.match(/(rezept|gericht)\\s*(nr\\.?|nummer)?\\s*(\\d+)/i);\n    if (pick?.[3] && st0?.lastRecipeList?.length) {\n      const idx = Number(pick[3]) - 1;\n      const ref = st0.lastRecipeList[idx];\n      if (ref?.id) {\n        const r = (Array.isArray(recipes) ? recipes : []).find(x => String(x?.id) === String(ref.id));\n        if (r) {\n          return res.json({ source:\"db_recipe\", reply: `🍽️ **${r.title || r.name || r.id}**\\n\\n${r.text ? r.text : \"\"}\\n\\n${r.ingredients ? \"**Zutaten:**\\n\" + r.ingredients.join(\"\\n\") : \"\"}\\n\\n${r.steps ? \"**Zubereitung:**\\n\" + r.steps.join(\"\\n\") : \"\"}` });\n        }\n      }\n    }\n\n  } catch (e) {\n    \/\/ Gate darf Chat nicht kaputt machen\n  }\n  \/\/ ===== \\/DB_RECIPE_GATE_V2 =====\n\n/s
' "$COACH"
fi

echo "✅ Backend fertig gepatcht."

echo "==[2] FRONTEND: Panel zeigt ALLE Rezepte (kein slice-Limit) =="

if [ -n "${KIPAGE:-}" ]; then
  # Entferne NUR im Panel-Render harte Limits: ".slice(0, N).map(" -> ".map("
  perl -0777 -i -pe 's/localPanel\.items\s*\.slice\(\s*0\s*,\s*\d+\s*\)\s*\.map/localPanel.items.map/gs' "$KIPAGE"
  perl -0777 -i -pe 's/filteredLocalItems\s*\.slice\(\s*0\s*,\s*\d+\s*\)\s*\.map/filteredLocalItems.map/gs' "$KIPAGE"
  perl -0777 -i -pe 's/filteredLocalItems\s*\.slice\(\s*0\s*,\s*localLimit\s*\)\s*\.map/filteredLocalItems.map/gs' "$KIPAGE"
  echo "✅ KICoachingPage: slice-Limits entfernt -> zeigt ALLE Items."
fi

echo "==[3] FRONTEND: CoachChat userId stabil (für Profil/Speichern konsistent) =="

if [ -n "${COACHCHAT_UI:-}" ]; then
  # Falls noch "guest" hardcoded:
  if grep -q 'useMemo(() => "guest"' "$COACHCHAT_UI"; then
    perl -0777 -i -pe 's/const userId = useMemo\(\(\) => "guest", \[\]\);/function getOrCreateUserId() {\n  const existing = localStorage.getItem("userId");\n  if (existing && typeof existing === "string" && existing.length > 6) return existing;\n  const id = `guest_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;\n  localStorage.setItem("userId", id);\n  return id;\n}\n\n  const userId = useMemo(() => getOrCreateUserId(), []);/s' "$COACHCHAT_UI"
    echo "✅ CoachChat: userId stabilisiert."
  fi
fi

echo "==[4] VERIFIKATION (zeigt dir, dass es wirklich drin ist) =="
echo "--- backend checks ---"
grep -n "DB_RECIPE_GATE_V2" "$COACH" || true
grep -n "RECIPE_FILTER_V2" "$COACH" || true
grep -n "WIZARD_V2" "$COACH" || true
grep -n 'router.post("/plans"' "$COACH" || true

if [ -n "${KIPAGE:-}" ]; then
  echo "--- frontend checks ---"
  grep -n "slice(0" "$KIPAGE" || true
fi

echo
echo "✅ Fertig. Jetzt beide Server neu starten + Browser Hard Reload:"
echo "Backend:  cd $(dirname "$(dirname "$COACH")") && npm run dev"
echo "Frontend: npm run dev (im Frontend-Ordner)"
echo "Browser:  Cmd+Shift+R"
