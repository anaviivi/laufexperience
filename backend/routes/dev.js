import express from "express";

export const devRouter = express.Router();

// Health für Dev-Router
devRouter.get("/health", (req, res) => {
  res.json({ status: "ok", module: "dev" });
});

// Optional: zeigt Basic-Infos
devRouter.get("/info", (req, res) => {
  res.json({
    node: process.version,
    env: process.env.NODE_ENV || "unknown",
  });
});
