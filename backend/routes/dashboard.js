import express from "express";
import { getSupabase } from "../supabaseClient.js";
const supabase = getSupabase();
import { getUserProfile } from "../services/gamification.js";

export const dashboardRouter = express.Router();

// ---- helpers ----
function getStartOfWeekIso() {
  const now = new Date();
  const day = now.getDay() || 7; // So=7
  const start = new Date(now);
  start.setDate(now.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function getEndOfWeekIso() {
  const start = new Date(getStartOfWeekIso());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}

async function getUserFromReq(req) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// ---- route ----
dashboardRouter.get("/summary", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "unauthorized" });

    const profile = await getUserProfile(user.id);

    // ✅ dein SQL: user_activities, start_time, distance_km, activity_type
    const { data: activities, error: actError } = await supabase
      .from("user_activities")
      .select("*")
      .eq("user_id", user.id)
      .gte("start_time", getStartOfWeekIso())
      .lte("start_time", getEndOfWeekIso());

    if (actError) throw actError;

    const runs = (activities || []).filter((a) => !a.activity_type || a.activity_type === "run");

    const weeklyRunsDone = runs.length;
    const weeklyDistanceKm =
      Math.round(runs.reduce((sum, a) => sum + Number(a.distance_km || 0), 0) * 10) / 10;

    res.json({
      firstName: profile?.name || "",
      level: profile?.level || 1,
      xp: profile?.xp || 0,
      weeklyRunsDone,
      weeklyRunsTarget: 3,
      weeklyDistanceKm,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "internal_error", details: String(err?.message || err) });
  }
});
