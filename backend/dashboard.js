// backend/routes/dashboard.js
import express from "express";
import { getSupabase } from "../supabaseClient.js";
const supabase = getSupabase();

import { getUserProfile } from "../services/gamification.js";

export const dashboardRouter = express.Router();

// User aus Supabase-JWT holen
async function getUserFromReq(req) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// GET /api/dashboard/summary
dashboardRouter.get("/summary", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "unauthorized" });

    const profile = await getUserProfile(user.id);

    const { data: activities, error: actError } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", user.id)
      .gte("started_at", getStartOfWeekIso())
      .lte("started_at", getEndOfWeekIso());

    if (actError) throw actError;

    const runs = (activities || []).filter((a) => !a.sport_type || a.sport_type === "run");

    const weeklyRunsDone = runs.length;

    const weeklyDistanceM = runs.reduce((sum, a) => sum + (a.distance_m || 0), 0);
    const weeklyDistanceKm = Math.round((weeklyDistanceM / 1000) * 10) / 10;

    const weeklyRunsTarget = 3; // später: dynamisch aus Profil
    const xp = profile.xp || 0;
    const levelProgress = getLevelProgress(xp);

    res.json({
      firstName: profile.name,
      level: profile.level,
      xp,
      weeklyRunsDone,
      weeklyRunsTarget,
      weeklyDistanceKm,
      levelProgress,
    });
  } catch (err) {
    console.error("Dashboard Summary Error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

function getStartOfWeekIso() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

function getEndOfWeekIso() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  const sunday = new Date(d.setDate(diff));
  sunday.setHours(23, 59, 59, 999);
  return sunday.toISOString();
}

function getLevelProgress(xp) {
  const currentLevel = calculateLevel(xp);
  const nextLevel = currentLevel + 1;

  const xpForCurrent = levelThreshold(currentLevel);
  const xpForNext = levelThreshold(nextLevel);

  const xpIntoLevel = xp - xpForCurrent;
  const xpNeeded = xpForNext - xpForCurrent;

  return {
    currentLevel,
    nextLevel,
    xpForCurrent,
    xpForNext,
    xpIntoLevel,
    xpNeeded,
  };
}

function calculateLevel(xp) {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 900) return 4;
  if (xp < 1400) return 5;
  return Math.floor(Math.sqrt(xp / 100)) + 2;
}

function levelThreshold(level) {
  switch (level) {
    case 1:
      return 0;
    case 2:
      return 100;
    case 3:
      return 250;
    case 4:
      return 500;
    case 5:
      return 900;
    default:
      return 900 + (level - 5) * 300;
  }
  // zusätzlich im try-Block berechnen
  const totalRuns = runs.length; // oder separat alle Activities ohne Wochenfilter holen
  const lastRun = runs.sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];

  // beim response ergänzen
  res.json({
    firstName: profile.name,
    level,
    xp,
    weeklyRunsDone,
    weeklyRunsTarget,
    weeklyDistanceKm,
    levelProgress,
    totalRuns,
    lastRun: lastRun
      ? {
          date: lastRun.started_at,
          distanceKm: (lastRun.distance_m || 0) / 1000,
          durationMin: (lastRun.duration_s || 0) / 60,
        }
      : null,
  });
}
