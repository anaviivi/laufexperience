// backend/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// DB-Datei liegt als "database.sqlite" im backend-Ordner
const dbPath = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("[DB] Fehler beim Öffnen der Datenbank:", err.message);
  } else {
    console.log("[DB] Datenbank geöffnet:", dbPath);
  }
});

// Tabellen & Migrationen
db.serialize(() => {
  // Basis-User-Tabelle anlegen (mit möglichst vielen Spalten, die du nutzt)
  db.run(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      password TEXT,
      name TEXT,
      bio TEXT,
      goal_type TEXT,
      weekly_km INTEGER,
      unit TEXT,
      language TEXT,
      ai_coach_tips INTEGER,
      newsletter INTEGER,
      avatar TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      -- Felder für den KI-Coach / Profil
      username TEXT,
      level TEXT,              -- z.B. 'Anfänger', 'Fortgeschritten'
      goal TEXT,               -- z.B. '10 km unter 55 Minuten'
      training_days INTEGER,   -- z.B. 3
      dietary_pref TEXT,       -- z.B. 'vegetarisch', 'omni', 'vegan'
      allergies TEXT,          -- z.B. 'Laktose', 'Gluten'
      height_cm INTEGER,
      weight_kg REAL,
      age INTEGER,
      sex TEXT,                -- 'm', 'w', 'divers'
      role TEXT DEFAULT 'user',
      reset_token TEXT,
      reset_expires INTEGER
    )
  `,
    (err) => {
      if (err) {
        console.error("[DB] Fehler beim Erstellen der 'users'-Tabelle:", err.message);
      }
    }
  );

  // 🔁 Migrationen für bestehende Datenbanken:
  // (werden ignoriert, wenn Spalte schon existiert)
  const safeAlter = (sql, label) => {
    db.run(sql, (err) => {
      if (err && !String(err.message).includes("duplicate column name")) {
        console.error(`[DB] Fehler bei Migration (${label}):`, err.message);
      }
    });
  };

  safeAlter("ALTER TABLE users ADD COLUMN password_hash TEXT", "password_hash");
  safeAlter("ALTER TABLE users ADD COLUMN reset_token TEXT", "reset_token");
  safeAlter("ALTER TABLE users ADD COLUMN reset_expires INTEGER", "reset_expires");
  safeAlter("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", "role");
  safeAlter("ALTER TABLE users ADD COLUMN username TEXT", "username");
  safeAlter("ALTER TABLE users ADD COLUMN level TEXT", "level");
  safeAlter("ALTER TABLE users ADD COLUMN goal TEXT", "goal");
  safeAlter("ALTER TABLE users ADD COLUMN training_days INTEGER", "training_days");
  safeAlter("ALTER TABLE users ADD COLUMN dietary_pref TEXT", "dietary_pref");
  safeAlter("ALTER TABLE users ADD COLUMN allergies TEXT", "allergies");
  safeAlter("ALTER TABLE users ADD COLUMN height_cm INTEGER", "height_cm");
  safeAlter("ALTER TABLE users ADD COLUMN weight_kg REAL", "weight_kg");
  safeAlter("ALTER TABLE users ADD COLUMN age INTEGER", "age");
  safeAlter("ALTER TABLE users ADD COLUMN sex TEXT", "sex");

  // Läufe-Tabelle für den Coach
  db.run(
    `
    CREATE TABLE IF NOT EXISTS runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,          -- ISO-String oder TEXT
      distance_km REAL NOT NULL,
      duration_min REAL NOT NULL,
      avg_hr INTEGER,
      perceived_effort INTEGER,    -- 1–10
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,
    (err) => {
      if (err) {
        console.error("[DB] Fehler beim Erstellen der 'runs'-Tabelle:", err.message);
      }
    }
  );
});

// ---------- Hilfsfunktionen für den KI-Coach ----------

// User aus der Tabelle "users"
function getUserById(userId) {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT
        id,
        username,
        level,
        goal,
        training_days,
        dietary_pref,
        allergies,
        height_cm,
        weight_kg,
        age,
        sex
      FROM users
      WHERE id = ?
    `,
      [userId],
      (err, row) => {
        if (err) {
          console.error("[DB] getUserById Fehler:", err.message);
          return reject(err);
        }
        resolve(row || null);
      }
    );
  });
}

// Letzte Läufe des Users
function getRecentRunsForUser(userId, limit = 5) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT
        id,
        user_id,
        date,
        distance_km,
        duration_min,
        avg_hr,
        perceived_effort
      FROM runs
      WHERE user_id = ?
      ORDER BY date DESC, id DESC
      LIMIT ?
    `,
      [userId, limit],
      (err, rows) => {
        if (err) {
          console.error("[DB] getRecentRunsForUser Fehler:", err.message);
          return reject(err);
        }
        resolve(rows || []);
      }
    );
  });
}

// ---------- Exporte ----------
module.exports = {
  db,
  getUserById,
  getRecentRunsForUser,
};
