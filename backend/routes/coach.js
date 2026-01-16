import express from "express";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// lädt sicher backend/.env (eine Ebene über routes/)
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing in backend/.env");
if (!SUPABASE_URL) throw new Error("SUPABASE_URL missing in backend/.env");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing in backend/.env");

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function pickProfile(p) {
  if (!p) return null;
  return {
    experience_level: p.experience_level ?? null,
    nutrition: p.nutrition ?? null,
    eating_goal: p.eating_goal ?? null,
    runs_per_week: p.runs_per_week ?? null,
    long_run_day: p.long_run_day ?? null,
    preferred_time: p.preferred_time ?? null,
    injuries: p.injuries ?? null,
    height_cm: p.height_cm ?? null,
    weight_kg: p.weight_kg ?? null,
    goal_weight_kg: p.goal_weight_kg ?? null,
    coach_notes: p.coach_notes ?? null,
  };
}

router.post("/chat", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.status(401).json({ error: "missing_token", message: "No Bearer token" });

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return res.status(401).json({ error: "invalid_user", message: userErr?.message || "Invalid user" });
    }

    const user = userData.user;
    const { message, intent, wantRecipe } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "missing_message", message: "Body.message missing" });
    }

    const { data: profileRow, error: profErr } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profErr) {
      console.warn("⚠️ profile load error:", profErr);
    }

    const profile = pickProfile(profileRow);

    const systemPrompt = `
Du bist ein professioneller Laufcoach für Training, Technik & Ernährung.

Nutze Profildaten als Wahrheit. Frage NICHT nach Dingen, die im Profil stehen.
Stelle maximal 1 Rückfrage nur wenn entscheidende Daten fehlen UND nicht im Profil sind.

intent="${intent || "training"}", wantRecipe=${!!wantRecipe}

Profil (DB):
${profile ? JSON.stringify(profile, null, 2) : "KEIN PROFIL GEFUNDEN"}

Ausgabe:
- Technik: 3 Fehler + 3 Drills + 10-Min Warm-up + 7-Tage Mini-Plan
- Ernährung: 7-Tage Plan + Einkaufsliste + Meal-Prep
- Training: Wochenplan Mo–So + Intensitäten
- wantRecipe=true: 1 Rezept + Zutaten + Zubereitung + grobe Makros
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.4,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(500).json({ error: "empty_ai_response", message: "No reply content" });

    return res.json({ reply });
  } catch (err) {
    console.error("❌ /api/coach/chat ERROR:", err);
    return res.status(500).json({ error: "internal_error", message: err?.message || String(err) });
  }
});

router.post("/pdf/history", async (req, res) => {
  try {
    const { title = "LaufX Coach", rawText = "" } = req.body || {};
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => {
      const pdf = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="laufx-coach-chat.pdf"');
      res.send(pdf);
    });

    // "Logo" als simple Header (ohne Bild-Datei)
    doc.fontSize(20).text(title, { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#666").text("LaufXperience • KI-Coach Export", { align: "left" });
    doc.moveDown(1);
    doc.fillColor("#111");

    doc.fontSize(11).text(rawText || "(leer)", { lineGap: 4 });

    doc.end();
  } catch (err) {
    console.error("❌ PDF ERROR:", err);
    res.status(500).json({ error: "pdf_generation_failed", message: err?.message || String(err) });
  }
});

export default router;
