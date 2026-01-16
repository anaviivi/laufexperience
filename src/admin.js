import express from "express";

const router = express.Router();

/* ================= AUTH (einfach & robust) =================
   - SKIP_ADMIN_AUTH=true  -> alles erlaubt (DEV)
   - ADMIN_SECRET=xyz      -> Header "x-admin-secret: xyz" nötig
*/
const SKIP_AUTH = String(process.env.SKIP_ADMIN_AUTH || "").toLowerCase() === "true";
const ADMIN_SECRET = String(process.env.ADMIN_SECRET || "").trim();

router.use((req, res, next) => {
  if (SKIP_AUTH) return next();
  if (!ADMIN_SECRET) return next();
  const provided = String(req.headers["x-admin-secret"] || "").trim();
  if (provided && provided === ADMIN_SECRET) return next();
  return res.status(403).json({ error: "Forbidden" });
});

/* ================= PERMISSIONS (role -> permissions) ================= */

const store = {
  roles: [
    { id: "user", name: "User", description: "Normaler Nutzer (lesen)" },
    { id: "editor", name: "Editor", description: "Inhalte" },
    { id: "moderator", name: "Moderator", description: "Moderation" },
    { id: "admin", name: "Admin", description: "Vollzugriff" },
  ],

  permissionGroups: [
    {
      title: "Articles",
      perms: [
        { key: "articles.view", label: "Artikel ansehen" },
        { key: "articles.manage", label: "Artikel verwalten" },
      ],
    },
    {
      title: "Users",
      perms: [
        { key: "users.view", label: "User ansehen" },
        { key: "users.manage", label: "User verwalten" },
      ],
    },
    {
      title: "Admin",
      perms: [{ key: "permissions.manage", label: "Berechtigungen verwalten" }],
    },
  ],

  // roleId -> permissionKeys
  matrix: {
    user: ["articles.view"],
    editor: ["articles.view", "articles.manage"],
    moderator: ["articles.view", "users.view"],
    admin: ["articles.view", "articles.manage", "users.view", "users.manage", "permissions.manage"],
  },
};

const uniqSorted = (arr) =>
  Array.from(new Set((arr || []).map((x) => String(x)).filter(Boolean))).sort();

router.get("/permissions/_ping", (req, res) => {
  res.json({ ok: true, auth: { skip: SKIP_AUTH, adminSecretEnabled: !!ADMIN_SECRET } });
});

router.get("/permissions", (req, res) => {
  res.json({
    roles: store.roles,
    permissionGroups: store.permissionGroups,
    matrix: store.matrix,
  });
});

router.put("/permissions/:roleId", (req, res) => {
  const roleId = String(req.params.roleId || "").trim();
  if (!roleId) return res.status(400).json({ error: "Missing roleId" });
  const permissions = uniqSorted(req.body?.permissions);
  store.matrix[roleId] = permissions;
  res.json({ roleId, permissions });
});

/* ================= USERS (user -> roleId) =================
   Versucht zuerst SQLite-DB zu nutzen (wie in auth.js),
   sonst fallback in-memory (damit UI immer läuft).
*/

let db = null;
try {
  // passt zu deinem auth.js (../db). Wenn bei dir anders, Pfad anpassen.
  db = (await import("./db.js")).default ?? (await import("./db.js"));
} catch {
  try {
    db = (await import("../db.js")).default ?? (await import("../db.js"));
  } catch {
    db = null;
  }
}

// Fallback store (wenn keine DB)
const memUsers = [
  { id: 1, name: "Test User", email: "user@test.de", role: "user" },
  { id: 2, name: "Editor", email: "editor@test.de", role: "editor" },
  { id: 3, name: "Admin", email: "admin@test.de", role: "admin" },
];

function normalizeRole(role) {
  const r = String(role || "user").trim().toLowerCase();
  const ok = store.roles.some((x) => x.id === r);
  return ok ? r : "user";
}

router.get("/users", async (req, res) => {
  try {
    if (db && typeof db.all === "function") {
      db.all(
        "SELECT id, name, email, role, createdAt FROM users ORDER BY createdAt DESC",
        [],
        (err, rows) => {
          if (err) return res.status(500).json({ error: "db_error", details: err.message });
          const out = (rows || []).map((u) => ({ ...u, role: normalizeRole(u.role) }));
          return res.json({ users: out, roles: store.roles });
        }
      );
      return;
    }

    // fallback
    res.json({ users: memUsers.map((u) => ({ ...u, role: normalizeRole(u.role) })), roles: store.roles });
  } catch (e) {
    res.status(500).json({ error: "Failed to load users", details: String(e?.message || e) });
  }
});

router.put("/users/:id/role", async (req, res) => {
  const id = req.params.id;
  const roleId = normalizeRole(req.body?.roleId);

  try {
    if (db && typeof db.run === "function") {
      db.run("UPDATE users SET role = ? WHERE id = ?", [roleId, id], function (err) {
        if (err) return res.status(500).json({ error: "db_error", details: err.message });
        return res.json({ success: true, id, roleId, changed: this.changes || 0 });
      });
      return;
    }

    // fallback
    const u = memUsers.find((x) => String(x.id) === String(id));
    if (!u) return res.status(404).json({ error: "User not found" });
    u.role = roleId;
    res.json({ success: true, id, roleId, changed: 1 });
  } catch (e) {
    res.status(500).json({ error: "Failed to update role", details: String(e?.message || e) });
  }
});

export default router;
