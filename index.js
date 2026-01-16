// backend/index.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import coachRouter from "./routes/coach.js";
import pdfRouter from "./routes/pdf.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env laden (liegt bei dir offenbar im backend-Ordner)
dotenv.config({ path: path.join(__dirname, ".env") });

/**
 * Kleine Helpers für sauberes Logging
 */
const log = (...args) => console.log(new Date().toISOString(), "-", ...args);
const err = (...args) => console.error(new Date().toISOString(), "-", ...args);

const app = express();

// Hinter Reverse-Proxy (z.B. Render/NGINX) nützlich; schadet lokal nicht
app.set("trust proxy", 1);

/**
 * Middleware
 */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true, // true = erlaubt alle Origins (DEV). Setze CORS_ORIGIN in PROD.
    credentials: true,
  })
);
app.use("/api/admin", adminApi);

app.use(express.json({ limit: process.env.JSON_LIMIT || "10mb" }));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_LIMIT || "10mb" }));

/**
 * Health / Debug Routes
 */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    pid: process.pid,
    node: process.version,
    env: process.env.NODE_ENV || "development",
  });
});

/**
 * API Routes
 */
app.use("/api/coach", coachRouter);
app.use("/api/pdf", pdfRouter);
app.use("/api/admin", adminPermissionsRouter);

/**
 * 404 Handler (nur für /api sinnvoll, aber wir machen global)
 */
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

/**
 * Central Error Handler
 * Wichtig: next muss als Parameter existieren, sonst erkennt Express das nicht als Error-Middleware.
 */
app.use((error, req, res, next) => {
  err("❌ Error middleware:", {
    message: error?.message,
    stack: error?.stack,
    path: req?.originalUrl,
    method: req?.method,
  });

  const status = error?.status || error?.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : error.message,
  });
});

/**
 * Process-Level Debugging
 * (Diese Handler sorgen nicht dafür, dass der Prozess weiterläuft – aber du bekommst echte Hinweise.)
 */
process.on("uncaughtException", (e) => {
  err("❌ uncaughtException", e);
});

process.on("unhandledRejection", (e) => {
  err("❌ unhandledRejection", e);
});

process.on("exit", (code) => {
  log("❌ Node exit code:", code);
});

/**
 * Server Start + Graceful Shutdown
 */
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "127.0.0.1";

const server = app.listen(PORT, HOST, () => {
  log(`✅ API läuft auf http://${HOST}:${PORT}`);
  log(`✅ Health: http://${HOST}:${PORT}/health`);
});

function shutdown(signal) {
  log(`🛑 Received ${signal}. Closing server...`);
  server.close((closeErr) => {
    if (closeErr) {
      err("❌ Error closing server:", closeErr);
      process.exit(1);
    }
    log("✅ Server closed gracefully.");
    process.exit(0);
  });

  // Hard-exit falls irgendwas hängt
  setTimeout(() => {
    err("❌ Force exit (shutdown timeout).");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
import adminPermissionsRouter from "./adminPermissions.js";
import adminApi from "./adminApi.js";
