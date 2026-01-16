// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

// Helper: prüft grob, ob ein String wie ein bcrypt-Hash aussieht
function looksLikeBcrypt(hash) {
  return typeof hash === "string" && hash.startsWith("$2");
}

// POST /api/login
router.post("/login", (req, res) => {
  // ✅ sicherer: NICHT komplettes Body loggen (enthält Passwort)
  console.log("🔐 Login-Request:", { email: req.body?.email });

  const emailRaw = req.body?.email;
  const passwordRaw = req.body?.password;

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  const password = typeof passwordRaw === "string" ? passwordRaw : "";

  if (!email || !password) {
    return res.status(400).json({ error: "Email und Passwort erforderlich" });
  }

  // Optional: simple email sanity check
  if (!email.includes("@") || email.length < 5) {
    return res.status(400).json({ error: "Ungültige Email" });
  }

  db.get(
    "SELECT id, email, password, role, name, goal_type FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      try {
        if (err) {
          console.error("DB-Fehler beim Login:", err);
          return res.status(500).json({ error: "DB-Fehler" });
        }

        if (!user) {
          // ✅ nicht verraten, ob email existiert
          return res.status(401).json({ error: "Ungültige Zugangsdaten" });
        }

        const stored = user.password || "";
        let ok = false;

        // Falls DB Passwort im bcrypt-Format gespeichert ist
        if (looksLikeBcrypt(stored)) {
          ok = await bcrypt.compare(password, stored);
        } else {
          // Falls DB altes Klartext-Passwort hat (dein bestehendes Verhalten)
          ok = password === stored;
        }

        if (!ok) {
          return res.status(401).json({ error: "Ungültige Zugangsdaten" });
        }

        // ✅ BEIBEHALTEN: gleiche Response wie bisher (success, id, email, role)
        // (Du kannst hier später JWT / Session hinzufügen, ohne Frontend zu brechen)
        return res.json({
          success: true,
          id: user.id,
          email: user.email,
          role: user.role || "user",
          // ⚠️ Extra Felder lassen wir drin, falls du sie später brauchst.
          // Wenn du sie nicht willst, kannst du sie entfernen – Funktion bleibt gleich.
          name: user.name || null,
          goal_type: user.goal_type || null,
        });
      } catch (e) {
        console.error("Fehler im Login-Handler:", e);
        return res.status(500).json({ error: "Interner Fehler" });
      }
    }
  );
});

// OPTIONAL: POST /api/logout
// Bei deinem aktuellen System gibt’s serverseitig keine Session.
// Aber ein Endpoint kann trotzdem praktisch sein (FrontEnd kann ihn callen).
router.post("/logout", (req, res) => {
  return res.json({ success: true });
});

module.exports = router;
