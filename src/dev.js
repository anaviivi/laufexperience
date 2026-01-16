// backend/routes/dev.js
import express from "express";
import { supabase } from "../supabaseClient.js";

import { getUserFromReq } from "../utils/auth.js";

export const devRouter = express.Router();

/**
 * Nur für Entwicklung:
 * fügt ein paar Beispiel-Läufe in die activities Tabelle ein.
 */
devRouter.post("/mock-activities", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ error: "unauthorized" });

    const now = new Date();
    const runs = [
      {
        user_id: user.id,
        source: "manual",
        external_id: `mock-${Date.now()}-1`,
        sport_type: "run",
        started_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // vor 3 Tagen
        duration_sec: 1800,
        distance_m: 5000,
        avg_hr: 145,
        calories: 400,
      },
      {
        user_id: user.id,
        source: "manual",
        external_id: `mock-${Date.now()}-2`,
        sport_type: "run",
        started_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // vor 1 Tag
        duration_sec: 2400,
        distance_m: 8000,
        avg_hr: 150,
        calories: 600,
      },
    ];

    const { error } = await supabase.from("activities").insert(runs);
    if (error) throw error;

    res.json({ inserted: runs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error" });
  }
});
