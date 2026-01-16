import "dotenv/config";
import express from "express";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT:
// - supabaseAdmin must be a SERVICE ROLE client (server-side only)
// - expected to exist at backend/supabaseAdmin.js in your project
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = express.Router();

/**
 * -------------------------------------------------------------
 * Supabase Auth Client (Token verification)
 * -------------------------------------------------------------
 */
const url = (process.env.SUPABASE_URL || "").trim();
const anon = (process.env.SUPABASE_ANON_KEY || "").trim();
const service = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const authKey = anon || service;

let supabaseAuth = null;
if (!url) {
  console.warn("[admin] Missing SUPABASE_URL");
} else if (!authKey) {
  console.warn("[admin] Missing SUPABASE_ANON_KEY (and SERVICE fallback)");
} else {
  supabaseAuth = createClient(url, authKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function getBearer(req) {
  const h = req.headers.authorization || "";
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim();
}

async function getUserOr401(req, res) {
  if (!supabaseAuth) {
    res.status(500).json({ error: "Supabase Auth not configured (check backend/.env)" });
    return null;
  }
  const token = getBearer(req);
  if (!token) {
    res.status(401).json({ error: "Missing Bearer token" });
    return null;
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: "Invalid token", details: error?.message });
    return null;
  }
  return data.user;
}

async function hasPermission(userId, permissionKey) {
  if (!supabaseAdmin) throw new Error("Supabase Admin not configured (SERVICE ROLE missing)");

  const { data: roles, error: rErr } = await supabaseAdmin
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);
  if (rErr) throw new Error(rErr.message);

  const roleIds = (roles || []).map((x) => x.role_id);
  if (roleIds.length === 0) return false;

  const { data: ok, error: pErr } = await supabaseAdmin
    .from("role_permissions")
    .select("permission_key")
    .in("role_id", roleIds)
    .eq("permission_key", permissionKey)
    .limit(1);
  if (pErr) throw new Error(pErr.message);
  return !!(ok && ok.length > 0);
}

/**
 * -------------------------------------------------------------
 * Seed defaults (roles + permissions) if tables are empty
 * -------------------------------------------------------------
 */
const DEFAULT_ROLES = [
  { id: "admin", name: "Admin", description: "Vollzugriff" },
  { id: "editor", name: "Editor", description: "Inhalte verwalten" },
  { id: "viewer", name: "Viewer", description: "Nur ansehen" },
  { id: "moderator", name: "Moderator", description: "Moderation" },
];

const DEFAULT_PERMISSIONS = [
  // Articles
  { key: "articles.view", label: "Artikel ansehen", group_title: "Articles" },
  { key: "articles.manage", label: "Artikel verwalten", group_title: "Articles" },

  // Users / Roles
  { key: "users.view", label: "User ansehen", group_title: "Users" },
  { key: "users.manage", label: "User verwalten", group_title: "Users" },

  // Permissions
  { key: "permissions.manage", label: "Berechtigungen verwalten", group_title: "Admin" },
];

const DEFAULT_ROLE_PERMS = {
  admin: DEFAULT_PERMISSIONS.map((p) => p.key),
  editor: ["articles.view", "articles.manage"],
  viewer: ["articles.view"],
  moderator: ["articles.view"],
};

async function seedIfEmpty() {
  if (!supabaseAdmin) return;

  // Roles
  const { data: existingRoles, error: rolesErr } = await supabaseAdmin
    .from("roles")
    .select("id")
    .limit(1);
  if (rolesErr) throw new Error(rolesErr.message);

  if (!existingRoles || existingRoles.length === 0) {
    const { error: insRolesErr } = await supabaseAdmin.from("roles").insert(DEFAULT_ROLES);
    if (insRolesErr) throw new Error(insRolesErr.message);
  }

  // Permissions
  const { data: existingPerms, error: permsErr } = await supabaseAdmin
    .from("permissions")
    .select("key")
    .limit(1);
  if (permsErr) throw new Error(permsErr.message);

  if (!existingPerms || existingPerms.length === 0) {
    const { error: insPermErr } = await supabaseAdmin.from("permissions").insert(DEFAULT_PERMISSIONS);
    if (insPermErr) throw new Error(insPermErr.message);
  }

  // Role permissions: only seed if empty
  const { data: existingRP, error: rpErr } = await supabaseAdmin
    .from("role_permissions")
    .select("role_id")
    .limit(1);
  if (rpErr) throw new Error(rpErr.message);

  if (!existingRP || existingRP.length === 0) {
    const rows = [];
    for (const [roleId, keys] of Object.entries(DEFAULT_ROLE_PERMS)) {
      for (const k of keys) rows.push({ role_id: roleId, permission_key: k });
    }
    const { error: insRPErr } = await supabaseAdmin.from("role_permissions").insert(rows);
    if (insRPErr) throw new Error(insRPErr.message);
  }
}

/**
 * -------------------------------------------------------------
 * Routes
 * -------------------------------------------------------------
 */
router.get("/ping", (req, res) => res.json({ ok: true }));

// GET /api/admin/permissions
router.get("/permissions", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const allowed = await hasPermission(user.id, "permissions.manage");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    await seedIfEmpty();

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("roles")
      .select("id,name,description")
      .order("id");
    if (rolesErr) return res.status(500).json({ error: rolesErr.message });

    const { data: perms, error: permsErr } = await supabaseAdmin
      .from("permissions")
      .select("key,label,group_title")
      .order("group_title")
      .order("key");
    if (permsErr) return res.status(500).json({ error: permsErr.message });

    const { data: rp, error: rpErr } = await supabaseAdmin
      .from("role_permissions")
      .select("role_id,permission_key");
    if (rpErr) return res.status(500).json({ error: rpErr.message });

    const groupMap = new Map();
    for (const p of perms || []) {
      const title = p.group_title || "Other";
      if (!groupMap.has(title)) groupMap.set(title, []);
      groupMap.get(title).push({ key: p.key, label: p.label });
    }

    const permissionGroups = Array.from(groupMap.entries()).map(([title, arr]) => ({
      title,
      perms: arr,
    }));

    const matrix = {};
    for (const r of roles || []) matrix[r.id] = [];
    for (const row of rp || []) {
      if (!matrix[row.role_id]) matrix[row.role_id] = [];
      matrix[row.role_id].push(row.permission_key);
    }
    for (const k of Object.keys(matrix)) matrix[k].sort();

    res.json({ roles: roles || [], permissionGroups, matrix });
  } catch (e) {
    console.error("[admin] GET /permissions failed:", e);
    res.status(500).json({ error: e?.message || "Failed to load permissions" });
  }
});

// PUT /api/admin/permissions/:roleId
router.put("/permissions/:roleId", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const allowed = await hasPermission(user.id, "permissions.manage");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const roleId = String(req.params.roleId || "").trim();
    const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];

    if (!roleId) return res.status(400).json({ error: "Missing roleId" });

    // Ensure role exists
    const { data: role, error: roleErr } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("id", roleId)
      .limit(1);
    if (roleErr) return res.status(500).json({ error: roleErr.message });
    if (!role || role.length === 0) return res.status(404).json({ error: "Role not found" });

    // Remove current
    const { error: delErr } = await supabaseAdmin.from("role_permissions").delete().eq("role_id", roleId);
    if (delErr) return res.status(500).json({ error: delErr.message });

    // Insert new
    const rows = (permissions || [])
      .map((k) => String(k || "").trim())
      .filter(Boolean)
      .map((k) => ({ role_id: roleId, permission_key: k }));

    if (rows.length > 0) {
      const { error: insErr } = await supabaseAdmin.from("role_permissions").insert(rows);
      if (insErr) return res.status(500).json({ error: insErr.message });
    }

    res.json({ roleId, permissions: rows.map((r) => r.permission_key).sort() });
  } catch (e) {
    console.error("[admin] PUT /permissions/:roleId failed:", e);
    res.status(500).json({ error: e?.message || "Failed to save permissions" });
  }
});

// GET /api/admin/users -> list users + role
router.get("/users", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const canView = await hasPermission(user.id, "users.view");
    const canManage = await hasPermission(user.id, "users.manage");
    if (!canView && !canManage) return res.status(403).json({ error: "Forbidden" });

    // Fetch auth users via admin API
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) return res.status(500).json({ error: listErr.message });

    // Fetch user_roles mapping
    const userIds = (list?.users || []).map((u) => u.id);
    let roleRows = [];
    if (userIds.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("user_roles")
        .select("user_id,role_id")
        .in("user_id", userIds);
      if (error) return res.status(500).json({ error: error.message });
      roleRows = data || [];
    }

    const roleByUser = new Map();
    for (const r of roleRows) roleByUser.set(r.user_id, r.role_id);

    const users = (list?.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name || u.user_metadata?.full_name || null,
      roleId: roleByUser.get(u.id) || "viewer",
      created_at: u.created_at,
    }));

    res.json({ canManage, users });
  } catch (e) {
    console.error("[admin] GET /users failed:", e);
    res.status(500).json({ error: e?.message || "Failed to load users" });
  }
});

// GET /api/admin/roles -> roles list (for user-management dropdown)
router.get("/roles", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const canView = await hasPermission(user.id, "users.view");
    const canManage = await hasPermission(user.id, "users.manage");
    if (!canView && !canManage) return res.status(403).json({ error: "Forbidden" });

    await seedIfEmpty();

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("roles")
      .select("id,name,description")
      .order("id");
    if (rolesErr) return res.status(500).json({ error: rolesErr.message });

    res.json({ roles: roles || [] });
  } catch (e) {
    console.error("[admin] GET /roles failed:", e);
    res.status(500).json({ error: e?.message || "Failed to load roles" });
  }
});

// PUT /api/admin/users/:userId/role  { roleId }
router.put("/users/:userId/role", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const allowed = await hasPermission(user.id, "users.manage");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const userId = String(req.params.userId || "").trim();
    const roleId = String(req.body?.roleId || "").trim();
    if (!userId || !roleId) return res.status(400).json({ error: "Missing userId or roleId" });

    // Validate role exists
    const { data: role, error: roleErr } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("id", roleId)
      .limit(1);
    if (roleErr) return res.status(500).json({ error: roleErr.message });
    if (!role || role.length === 0) return res.status(404).json({ error: "Role not found" });

    // Upsert user_roles
    const { error: upErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role_id: roleId }, { onConflict: "user_id" });
    if (upErr) return res.status(500).json({ error: upErr.message });

    res.json({ userId, roleId });
  } catch (e) {
    console.error("[admin] PUT /users/:userId/role failed:", e);
    res.status(500).json({ error: e?.message || "Failed to update user role" });
  }
});

export default router;
