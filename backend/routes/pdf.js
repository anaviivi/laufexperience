import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const router = express.Router();

const COLORS = {
  navy: "#020617",
  text: "#000000",
};

const PAGE = {
  size: "A4",
  marginX: 46,
  marginBottom: 40,
};

const NAV_HEIGHT = 64;
const BODY_FONT_SIZE = 10.5;
const LINE_GAP = 0.52;
const START_Y = NAV_HEIGHT + 42;

router.post("/chat", async (req, res) => {
  const { title, messages } = req.body ?? {};
  if (!Array.isArray(messages)) return res.status(400).end();

  const doc = new PDFDocument({
    size: PAGE.size,
    margins: {
      top: 0,
      left: PAGE.marginX,
      right: PAGE.marginX,
      bottom: PAGE.marginBottom,
    },
    autoFirstPage: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="chat.pdf"');
  doc.pipe(res);

  const fontPath = path.resolve(process.cwd(), "assets/fonts/NotoSans-Regular.ttf");
  if (fs.existsSync(fontPath)) doc.font(fontPath);
  else doc.font("Helvetica");

  function drawHeader() {
    doc.save();
    doc.rect(0, 0, doc.page.width, NAV_HEIGHT).fill(COLORS.navy);
    doc.restore();

    doc.fillColor("#ffffff").fontSize(16).text("LaufXperience", PAGE.marginX, 18);
    doc.fontSize(10).text("Chat Export", PAGE.marginX, 36);

    doc.fillColor(COLORS.text).fontSize(BODY_FONT_SIZE);
    doc.y = START_Y;
  }

  doc.on("pageAdded", drawHeader);
  drawHeader();

  const content = messages
    .map(m => m?.content ?? m?.text ?? "")
    .join("\n\n")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    
    .replace(/(^|\n)[ \t]*#{1,6}[ \t]*/g, "$1")
.trim();

  doc.text(content, {
    width: doc.page.width - PAGE.marginX * 2,
    lineGap: LINE_GAP,
  });

  doc.end();
});

export default router;
