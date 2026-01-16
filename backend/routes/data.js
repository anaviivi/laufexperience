import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");

function readJsonSafe(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
  } catch {
    return fallback;
  }
}
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .trim();

const recipes = readJsonSafe("recipes.json", []);
const tips = readJsonSafe("tips.json", []);
const mealplans = readJsonSafe("mealplans.json", []);

router.get("/recipes", (req, res) => {
  const q = norm(req.query.q);
  const items = (recipes || [])
    .map((r) => ({ id: r.id, title: r.title, tags: r.tags || [] }))
    .filter(
      (r) => !q || norm(r.title).includes(q) || (r.tags || []).some((t) => norm(t).includes(q))
    );
  res.json({ items, tips: items });
});

router.get("/recipes/:id", (req, res) => {
  const item = (recipes || []).find((r) => r.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Recipe not found" });
  res.json({ item });
});

router.get("/tips", (req, res) => {
  const q = norm(req.query.q);
  const category = norm(req.query.category);
  const items = (tips || [])
    .filter((t) => !category || norm(t.category) === category)
    .filter((t) => !q || norm(t.title).includes(q) || norm(t.text).includes(q));
  res.json({ items, tips: items });
});

router.get("/tips/:id", (req, res) => {
  const item = (tips || []).find((t) => t.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Tip not found" });
  res.json({ item });
});

router.get("/mealplans", (req, res) => {
  res.json({ items: mealplans || [] });
});

export default router;
