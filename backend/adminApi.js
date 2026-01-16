import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, "adminStore.json");

function readStore() {
  if (!fs.existsSync(STORE_PATH)) {
    const seed = {
      roles: [
        { id: "admin", name: "Administrator", description: "Vollzugriff" },
        { id: "editor", name: "Editor", description: "Inhalte" },
        { id: "user", name: "User", description: "Normaler User" },
        { id: "viewer", name: "Viewer", description: "Nur ansehen" },
        { id: "moderator", name: "Moderator", description: "Moderation" }
      ],
      permissionGroups: [
        { title: "Articles", perms: [
          { key: "articles.view", label: "Artikel ansehen" },
          { key: "articles.manage", label: "Artikel verwalten" }
        ]},
        { title: "Users", perms: [
          { key: "users.view", label: "User ansehen" },
          { key: "users.manage", label: "User verwalten" }
        ]},
        { title: "Admin", perms: [
          { key: "permissions.manage", label: "Berechtigungen verwalten" }
        ]}
      ],
      matrix: {
        viewer: ["articles.view"],
        user: ["articles.view"],
        editor: ["articles.view", "articles.manage"],
        moderator: ["articles.view", "users.view"],
        admin: ["articles.view", "articles.manage", "users.view", "users.manage", "permissions.manage"]
      }
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
}
function writeStore(next) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(next, null, 2), "utf-8");
}
function uniq(arr) {
  return Array.from(new Set(arr));
}

const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

const supabaseAdmin =
  SUPABASE_URL && SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;

router.get("/_ping", (req, res) => res.json({ ok: true }));

/* =========================
   PERMISSIONS (Role -> Rights)
   GET /api/admin/permissions
   PUT /api/admin/permissions/:roleId
========================= */
router.get("/permissions", (req, res) => {
  const store = readStore();

  // ensure matrix exists for all roles
  const matrix = { ...(store.matrix || {}) };
  for (const r of store.roles || []) {
    if (!Array.isArray(matrix[r.id])) matrix[r.id] = [];
    matrix[r.id] = uniq(matrix[r.id].map(String));
  }

  res.json({
    roles: store.roles || [],
    permissionGroups: store.permissionGroups || [],
    matrix,
  });
});

router.put("/permissions/:roleId", (req, res) => {
  const store = readStore();
  const roleId = String(req.params.roleId || "").trim();

  const roleOk = (store.roles || []).some((r) => r.id === roleId);
  if (!roleOk) return res.status(404).json({ error: "role_not_found" });

  const allowed = new Set(
    (store.permissionGroups || []).flatMap((g) => (g.perms || []).map((p) => p.key))
  );

  const incoming = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
  const cleaned = uniq(
    incoming.map((x) => String(x || "").trim()).filter((k) => k && allowed.has(k))
  );

  const next = { ...store, matrix: { ...(store.matrix || {}), [roleId]: cleaned } };
  writeStore(next);

  res.json({ roleId, permissions: cleaned });
});

/* =========================
   USERS (User -> Role only)
   GET /api/admin/users  (emails from Supabase Auth)
   PUT /api/admin/users/:id/role
========================= */
router.get("/users", async (req, res) => {
  const store = readStore();
  const roles = store.roles || [];
  const validRoleIds = new Set(roles.map((r) => r.id));

  if (!supabaseAdmin) {
    return res.status(500).json({ error: "Supabase admin not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen)" });
  }

  const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return res.status(500).json({ error: error.message });

  const authUsers = list?.users || [];
  const ids = authUsers.map((u) => u.id);

  // read role assignments
  const roleByUser = new Map();
  if (ids.length) {
    const { data: ur, error: urErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id,role_id")
      .in("user_id", ids);

    if (!urErr && Array.isArray(ur)) {
      for (const r of ur) roleByUser.set(r.user_id, r.role_id);
    }
  }

  const users = authUsers.map((u) => {
    const fromTable = roleByUser.get(u.id);
    const fromMeta = u.user_metadata?.roleId;
    const roleId = validRoleIds.has(fromTable) ? fromTable : (validRoleIds.has(fromMeta) ? fromMeta : "user");

    return {
      id: u.id,
      email: u.email || "",
      name: u.user_metadata?.name || u.user_metadata?.full_name || "",
      roleId,
    };
  });

  res.json({ users, roles, canManage: true });
});

router.put("/users/:id/role", async (req, res) => {
  const store = readStore();
  const validRoleIds = new Set((store.roles || []).map((r) => r.id));

  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase admin not configured" });

  const id = String(req.params.id || "").trim();
  const roleId = String(req.body?.roleId || "").trim();
  if (!id || !roleId) return res.status(400).json({ error: "missing_id_or_roleId" });
  if (!validRoleIds.has(roleId)) return res.status(400).json({ error: "invalid_role" });

  // prefer user_roles table
  const { error: upErr } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: id, role_id: roleId }, { onConflict: "user_id" });

  if (!upErr) return res.json({ id, roleId });

  // fallback to auth metadata
  const { error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(id, {
    user_metadata: { roleId },
  });
  if (metaErr) return res.status(500).json({ error: metaErr.message });

  res.json({ id, roleId, warning: "user_roles upsert failed; saved to user_metadata.roleId" });
});

export default router;
