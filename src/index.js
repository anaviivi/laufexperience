import express from "express";
import cors from "cors";
import coachRouter from "./routes/coach.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Mount
app.use("/api/coach", coachRouter);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`✅ Backend läuft: http://localhost:${PORT}`);
});
