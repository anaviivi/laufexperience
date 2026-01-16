// =======================
// IMPORTS (NUR EINMAL!)
// =======================
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ROUTER
import coachRouter from "./routes/coach.js";
import pdfRouter from "./routes/pdf.js";
import adminApi from "./adminApi.js";
import adminRouter from "./adminRouter.js";
// ⛔ NICHT zusätzlich adminPermissionsRouter importieren!
// adminPermissions gehört IN adminApi.js

// =======================
// SETUP
// =======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.set("trust proxy", 1);

// =======================
// MIDDLEWARE
// =======================
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// =======================
// HEALTH CHECK
// =======================
app.get("/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// =======================
// ROUTES
// =======================
app.use("/api/coach", coachRouter);
app.use("/api/pdf", pdfRouter);
app.use("/api/admin", adminApi);
app.use("/api/admin", adminRouter);
// =======================
// 404
// =======================
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// =======================
// ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// =======================
// SERVER
// =======================
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
