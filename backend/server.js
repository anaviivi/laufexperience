import express from "express";

import coachRouter from "./routes/coach.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// lädt sicher backend/.env
dotenv.config({ path: path.join(__dirname, ".env") });
const app = express();
app.use("/api/coach", coachRouter);


/**
 * NUR PDF Export:
 * GET /api/coach/pdf/history?title=Coach&rawText=...
 *
 * (du kannst den Namen /history beibehalten, damit dein Frontend nichts ändern muss)
 */
app.get("/api/coach/pdf/history", async (req, res) => {
  try {
    const title = String(req.query.title || "Coach");
    const rawText = String(req.query.rawText || "");

    const pdfBuffer = await buildCoachPdf({
      title,
      rawText,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="coach-export.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error("PDF error:", e);
    res.status(500).json({ error: "pdf_generation_failed" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ PDF Export läuft auf http://localhost:${PORT}`));
