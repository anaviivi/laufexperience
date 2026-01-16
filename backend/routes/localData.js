import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router = express.Router();

const DATA_DIR = path.join(process.cwd(), "backend", "data");
const RECIPES_FILE = path.join(DATA_DIR, "recipes.json");
const TIPS_FILE = path.join(DATA_DIR, "tips.json");

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf-8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function clampInt(n, min, max, fallback) {
  const x = Number.parseInt(n, 10);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, x));
}

function normalizeString(s) {
  return String(s ?? "").trim();
}

function containsInsensitive(haystack, needle) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/** ---------------- Recipes ---------------- **/

function defaultRecipes() {
  return [
    {
      id: makeId("rec"),
      title: "Haferflocken-Bowl",
      description: "Haferflocken, Joghurt/Skyr, Beeren, Nüsse.",
      tags: ["breakfast", "high-protein"],
      macros: { kcal: 550, protein_g: 30, carbs_g: 70, fat_g: 15 },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: makeId("rec"),
      title: "Reis-Bowl (Hähnchen/Tofu)",
      description: "Reis, Protein, buntes Gemüse, leichte Sauce.",
      tags: ["lunch", "balanced"],
      macros: { kcal: 700, protein_g: 45, carbs_g: 85, fat_g: 18 },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];
}

function loadRecipes() {
  const db = readJson(RECIPES_FILE, { items: null });
  if (!Array.isArray(db.items) || db.items.length === 0) {
    const seeded = { items: defaultRecipes(), updatedAt: nowIso() };
    writeJson(RECIPES_FILE, seeded);
    return seeded.items;
  }
  return db.items;
}

function saveRecipes(items) {
  writeJson(RECIPES_FILE, { items, updatedAt: nowIso() });
}

router.get("/recipes", (req, res) => {
  const q = normalizeString(req.query.q);
  const tag = normalizeString(req.query.tag);
  const limit = clampInt(req.query.limit, 1, 200, 50);

  const items = loadRecipes();

  let filtered = items;

  if (q) {
    filtered = filtered.filter((r) =>
      containsInsensitive(`${r.title} ${r.description} ${(r.tags || []).join(" ")}`, q)
    );
  }
  if (tag) {
    filtered = filtered.filter((r) => Array.isArray(r.tags) && r.tags.includes(tag));
  }

  filtered = filtered.slice(0, limit);

  res.json({
    items: filtered,
    meta: {
      total: filtered.length,
      q: q || null,
      tag: tag || null,
      limit,
    },
  });
});

router.post("/recipes", (req, res) => {
  const title = normalizeString(req.body?.title);
  const description = normalizeString(req.body?.description);
  const tags = Array.isArray(req.body?.tags) ? req.body.tags.map(normalizeString).filter(Boolean) : [];
  const macros = req.body?.macros && typeof req.body.macros === "object" ? req.body.macros : null;

  if (!title) return res.status(400).json({ error: "title is required" });
  if (title.length > 80) return res.status(400).json({ error: "title too long (max 80)" });
  if (description.length > 500) return res.status(400).json({ error: "description too long (max 500)" });

  const items = loadRecipes();

  const recipe = {
    id: makeId("rec"),
    title,
    description: description || "",
    tags,
    macros: macros
      ? {
          kcal: Number(macros.kcal ?? 0) || 0,
          protein_g: Number(macros.protein_g ?? 0) || 0,
          carbs_g: Number(macros.carbs_g ?? 0) || 0,
          fat_g: Number(macros.fat_g ?? 0) || 0,
        }
      : null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  items.unshift(recipe);
  saveRecipes(items);

  res.status(201).json({ item: recipe });
});

/** ---------------- Tips ---------------- **/

function defaultTips() {
  return [
    {
      id: makeId("tip"),
      category: "running",
      title: "Easy Pace wirklich easy",
      text: "80% deiner Läufe sollten locker sein: du kannst in ganzen Sätzen sprechen.",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: makeId("tip"),
      category: "nutrition",
      title: "Protein pro Mahlzeit",
      text: "Ziel: 25–40g Protein pro Mahlzeit (je nach Körpergewicht & Ziel).",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];
}

function loadTips() {
  const db = readJson(TIPS_FILE, { items: null });
  if (!Array.isArray(db.items) || db.items.length === 0) {
    const seeded = { items: defaultTips(), updatedAt: nowIso() };
    writeJson(TIPS_FILE, seeded);
    return seeded.items;
  }
  return db.items;
}

function saveTips(items) {
  writeJson(TIPS_FILE, { items, updatedAt: nowIso() });
}

router.get("/tips", (req, res) => {
  const q = normalizeString(req.query.q);
  const category = normalizeString(req.query.category);
  const limit = clampInt(req.query.limit, 1, 500, 100);

  const items = loadTips();

  let filtered = items;
  if (q) {
    filtered = filtered.filter((t) => containsInsensitive(`${t.title} ${t.text}`, q));
  }
  if (category) {
    filtered = filtered.filter((t) => t.category === category);
  }

  filtered = filtered.slice(0, limit);

  res.json({
    items: filtered,
    meta: {
      total: filtered.length,
      q: q || null,
      category: category || null,
      limit,
    },
  });
});

router.post("/tips", (req, res) => {
  const category = normalizeString(req.body?.category) || "general";
  const title = normalizeString(req.body?.title);
  const text = normalizeString(req.body?.text);

  if (!title) return res.status(400).json({ error: "title is required" });
  if (!text) return res.status(400).json({ error: "text is required" });
  if (title.length > 120) return res.status(400).json({ error: "title too long (max 120)" });
  if (text.length > 1200) return res.status(400).json({ error: "text too long (max 1200)" });

  const items = loadTips();

  const tip = {
    id: makeId("tip"),
    category,
    title,
    text,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  items.unshift(tip);
  saveTips(items);

  res.status(201).json({ item: tip });
});

/** -------- Quick Actions (für UI Buttons) -------- */

router.get("/quick-actions", (_req, res) => {
  res.json({
    items: [
      { id: "qa_training_10k", label: "8-Wochen 10-km Trainingsplan" },
      { id: "qa_week_plan", label: "Wochen-Ernährungsplan Woche 1" },
      { id: "qa_technique", label: "Technik-Tipps fürs Laufen" },
    ],
  });
});

export default router;
