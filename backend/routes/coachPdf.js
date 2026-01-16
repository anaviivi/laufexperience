import express from "express";
import { buildPdfBuffer } from "../utils/coachPdf.js";

const router = express.Router();

// Kompatibilität: falls dein Frontend /history nutzt
router.get("/history", async (req, res) => {
  try {
    const title = String(req.query.title || "Coach Export");
    const rawText = String(req.query.rawText || "");
    const style = String(req.query.style || req.query.layout || "auto").toLowerCase();

    const pdf = await buildPdfBuffer({ title, rawText, style });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="export.pdf"`);
    res.send(pdf);
  } catch (e) {
    console.error("coachPdf/history error:", e);
    res.status(500).json({ error: "pdf generation failed" });
  }
});

export default router;
