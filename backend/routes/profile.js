import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

const DATA_DIR = path.join(process.cwd(), "backend", "data");
const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf-8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch {
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

function getUserId(req) {
  // wenn du später Auth Middleware hast: req.user.id
  const id = req.user?.id || "guest";
  return String(id).replace(/[^\w.-]/g, "_").slice(0, 64);
}

function defaultProfile(userId) {
  return {
    userId,
    name: "Runner",
    basics: { sex: "unknown", age: null, heightCm: null, weightKg: null },
    running: { level: "beginner", runsPerWeek: 3, weeklyKm: 20 },
    nutrition: { goal: "balanced" },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

function loadDb() {
  const db = readJson(PROFILES_FILE, { users: {}, updatedAt: nowIso() });
  if (!db.users || typeof db.users !== "object") db.users = {};
  return db;
}

function saveDb(db) {
  db.updatedAt = nowIso();
  writeJson(PROFILES_FILE, db);
}

// -------- PROFILE --------
router.get("/", (req, res) => {
  const userId = getUserId(req);
  const db = loadDb();

  if (!db.users[userId]) {
    db.users[userId] = defaultProfile(userId);
    saveDb(db);
  }

  res.json({ profile: db.users[userId] });
});

router.put("/", express.json(), (req, res) => {
  const userId = getUserId(req);
  const db = loadDb();

  const next = {
    ...(db.users[userId] || defaultProfile(userId)),
    ...(req.body || {}),
    userId,
    updatedAt: nowIso(),
  };

  db.users[userId] = next;
  saveDb(db);
  res.json({ profile: next });
});

// -------- RUNLOG --------
router.get("/runlog", (req, res) => {
  const userId = getUserId(req);
  const db = loadDb();
  const p = db.users[userId] || defaultProfile(userId);

  p.runlog ||= [];
  db.users[userId] = p;
  saveDb(db);

  res.json({ logs: p.runlog });
});

router.post("/runlog", express.json(), (req, res) => {
  const userId = getUserId(req);
  const db = loadDb();
  const p = db.users[userId] || defaultProfile(userId);

  p.runlog ||= [];

  const distanceKm = Number(req.body?.distanceKm);
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return res.status(400).json({ error: "distanceKm required" });
  }

  const entry = {
    ts: Date.now(),
    distanceKm,
    durationMin: req.body?.durationMin ?? null,
    paceMinPerKm: req.body?.paceMinPerKm ?? null,
    notes: req.body?.notes ?? "",
  };

  p.runlog.push(entry);
  p.runlog = p.runlog.slice(-500);
  p.updatedAt = nowIso();

  db.users[userId] = p;
  saveDb(db);

  res.json({ ok: true, entry, logs: p.runlog });
});

export default router;
