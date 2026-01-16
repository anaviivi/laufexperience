import fs from "fs";
import path from "path";
import express from "express";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// -----------------------------------------------------------------------------
// Simple JSON store (no DB required)
// -----------------------------------------------------------------------------
const STORE_PATH = process.env.ADMIN_STORE_PATH
  ? path.resolve(process.env.ADMIN_STORE_PATH)
  : path.join(__dirname, "adminStore.json");

const DEFAULT_STORE = {
  roles: [
    { id: "admin", name: "Admin", description: "Vollzugriff" },
    { id: "editor", name: "Editor", description: "Inhalte" },
    { id: "user", name: "User", description: "Normale Nutzung" },
    { id: "viewer", name: "Viewer", description: "Nur ansehen" },
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
      title: "Permissions",
      perms: [{ key: "permissions.manage", label: "Berechtigungen verwalten" }],
    },
  ],
  // roleId -> permission keys
  matrix: {
    admin: ["articles.view", "articles.manage", "users.view", "users.manage", "permissions.manage"],
    editor: ["articles.view", "articles.manage"],
    user: ["articles.view"],
    viewer: ["articles.view"],
  },
  // Demo users (später easy durch echte DB ersetzen)
  users: [
    { id: "1", name: "Admin", email: "admin@example.com", roleId: "admin" },
    { id: "2", name: "Editor", email: "editor@example.com", roleId: "editor" },
    { id: "3", name: "User", email: "user@example.com", roleId: "user" },
  ],
};

function ensureStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), "utf-8");
      return;
    }
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    JSON.parse(raw);
  } catch (e) {
    console.warn("[admin] Store invalid, recreating:", e?.message);
    fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), "utf-8");
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeStore(next) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(next, null, 2), "utf-8");
}

function normalizeRoleId(roleId, store) {
  const id = String(roleId || "").trim();
  if (!id) return "";
  return store.roles.some((r) => r.id === id) ? id : "";
}

function normalizePermissions(list, store) {
  const all = new Set(
    (store.permissionGroups || []).flatMap((g) => (g.perms || []).map((p) => p.key)).filter(Boolean)
  );
  const out = [];
  for (const k of Array.isArray(list) ? list : []) {
    const key = String(k || "").trim();
    if (key && all.has(key)) out.push(key);
  }
  return Array.from(new Set(out)).sort();
}

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

router.get("/_ping", (req, res) => res.json({ ok: true }));

router.get("/roles", (req, res) => {
  const store = readStore();
  res.json({ roles: store.roles || [] });
});

router.get("/permissions", (req, res) => {
  const store = readStore();
  const matrix = { ...(store.matrix || {}) };
  for (const r of store.roles || []) {
    if (!Array.isArray(matrix[r.id])) matrix[r.id] = [];
    matrix[r.id] = Array.from(new Set(matrix[r.id].map(String))).sort();
  }
  res.json({ roles: store.roles || [], permissionGroups: store.permissionGroups || [], matrix });
});

router.put("/permissions/:roleId", (req, res) => {
  const store = readStore();
  const roleId = normalizeRoleId(req.params.roleId, store);
  if (!roleId) return res.status(404).json({ error: "role_not_found" });

  const permissions = normalizePermissions(req.body?.permissions, store);
  const next = { ...store, matrix: { ...(store.matrix || {}), [roleId]: permissions } };
  writeStore(next);
  res.json({ roleId, permissions });
});

router.get("/users", (req, res) => {
  const store = readStore();
  const rolesById = Object.fromEntries((store.roles || []).map((r) => [r.id, r]));

  const users = (store.users || []).map((u) => {
    const roleId = rolesById[u.roleId] ? u.roleId : "user";
    return {
      id: String(u.id),
      name: u.name || "",
      email: u.email || "",
      roleId,
      roleName: rolesById[roleId]?.name || roleId,
    };
  });

  res.json({ users });
});

router.put("/users/:userId/role", (req, res) => {
  const store = readStore();
  const userId = String(req.params.userId || "").trim();
  if (!userId) return res.status(400).json({ error: "missing_user_id" });

  const roleId = normalizeRoleId(req.body?.roleId, store);
  if (!roleId) return res.status(400).json({ error: "invalid_role" });

  const idx = (store.users || []).findIndex((u) => String(u.id) === userId);
  if (idx === -1) return res.status(404).json({ error: "user_not_found" });

  const nextUsers = [...(store.users || [])];
  nextUsers[idx] = { ...nextUsers[idx], roleId };

  const next = { ...store, users: nextUsers };
  writeStore(next);

  res.json({ id: userId, roleId });
});

export default router;
