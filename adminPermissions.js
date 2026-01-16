import "dotenv/config";
import express from "express";
import { createClient } from "@supabase/supabase-js";

// Passe den Pfad ggf. an, falls deine Datei woanders liegt:
import { supabaseAdmin } from "./supabaseAdmin.js";

const router = express.Router();

/**
 * Supabase Auth Client (Token-Verifizierung)
 * (nicht mit leerem Key initialisieren!)
 */
const url = (process.env.SUPABASE_URL || "").trim();
const anon = (process.env.SUPABASE_ANON_KEY || "").trim();
const service = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const authKey = anon || service;

let supabaseAuth = null;

if (!url) console.warn("[admin] Missing SUPABASE_URL");
else if (!authKey) console.warn("[admin] Missing SUPABASE_ANON_KEY (and SERVICE fallback)");
else {
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

  // user_roles optional – wenn Tabelle fehlt, geben wir false zurück
  const { data: roles, error: rErr } = await supabaseAdmin
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);

  if (rErr) return false;

  const roleIds = (roles || []).map((x) => x.role_id).filter(Boolean);
  if (roleIds.length === 0) return false;

  const { data: ok, error: pErr } = await supabaseAdmin
    .from("role_permissions")
    .select("permission_key")
    .in("role_id", roleIds)
    .eq("permission_key", permissionKey)
    .limit(1);

  if (pErr) return false;
  return !!(ok && ok.length > 0);
}

// ------------------------------
// HEALTH
// ------------------------------
router.get("/_ping", (req, res) => res.json({ ok: true }));

// ------------------------------
// PERMISSIONS (wie vorher)
// ------------------------------
router.get("/permissions", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    // Wenn du keine Permissions-Tabelle hast, setze SKIP_ADMIN_PERM=true
    const skip = String(process.env.SKIP_ADMIN_PERM || "").toLowerCase() === "true";
    if (!skip) {
      const allowed = await hasPermission(user.id, "permissions.manage");
      if (!allowed) return res.status(403).json({ error: "Forbidden" });
    }

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

router.put("/permissions/:roleId", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const skip = String(process.env.SKIP_ADMIN_PERM || "").toLowerCase() === "true";
    if (!skip) {
      const allowed = await hasPermission(user.id, "permissions.manage");
      if (!allowed) return res.status(403).json({ error: "Forbidden" });
    }

    const roleId = String(req.params.roleId || "").trim();
    const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];

    await supabaseAdmin.from("role_permissions").delete().eq("role_id", roleId);

    const rows = permissions
      .map((k) => String(k || "").trim())
      .filter(Boolean)
      .map((k) => ({ role_id: roleId, permission_key: k }));

    if (rows.length) await supabaseAdmin.from("role_permissions").insert(rows);

    res.json({ roleId, permissions: rows.map((r) => r.permission_key).sort() });
  } catch (e) {
    console.error("[admin] PUT /permissions/:roleId failed:", e);
    res.status(500).json({ error: e?.message || "Failed to save permissions" });
  }
});

// ------------------------------
// ROLES (für Users-Page Dropdown)
// ------------------------------
router.get("/roles", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    // Lesen reicht: users.view ODER users.manage
    const skip = String(process.env.SKIP_ADMIN_PERM || "").toLowerCase() === "true";
    if (!skip) {
      const canView = await hasPermission(user.id, "users.view");
      const canManage = await hasPermission(user.id, "users.manage");
      if (!canView && !canManage) return res.status(403).json({ error: "Forbidden" });
    }

    const { data: roles, error } = await supabaseAdmin
      .from("roles")
      .select("id,name,description")
      .order("id");
    if (error) return res.status(500).json({ error: error.message });

    res.json({ roles: roles || [] });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Failed to load roles" });
  }
});

// ------------------------------
// USERS (Users-Seite)
// ------------------------------
router.get("/users", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const skip = String(process.env.SKIP_ADMIN_PERM || "").toLowerCase() === "true";
    let canManage = true;

    if (!skip) {
      const canView = await hasPermission(user.id, "users.view");
      canManage = await hasPermission(user.id, "users.manage");
      if (!canView && !canManage) return res.status(403).json({ error: "Forbidden" });
    }

    // Supabase Auth Users
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) return res.status(500).json({ error: listErr.message });

    const authUsers = list?.users || [];
    const userIds = authUsers.map((u) => u.id);

    // user_roles optional
    let roleByUser = new Map();
    if (userIds.length) {
      const { data, error } = await supabaseAdmin.from("user_roles").select("user_id,role_id").in("user_id", userIds);
      if (!error && data) {
        for (const r of data) roleByUser.set(r.user_id, r.role_id);
      }
    }

    const users = authUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name || u.user_metadata?.full_name || "",
      roleId: roleByUser.get(u.id) || u.user_metadata?.roleId || "user",
      created_at: u.created_at,
    }));

    res.json({ canManage, users });
  } catch (e) {
    console.error("[admin] GET /users failed:", e);
    res.status(500).json({ error: e?.message || "Failed to load users" });
  }
});

// ------------------------------
// UPDATE USER ROLE
// ------------------------------
router.put("/users/:userId/role", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const skip = String(process.env.SKIP_ADMIN_PERM || "").toLowerCase() === "true";
    if (!skip) {
      const allowed = await hasPermission(user.id, "users.manage");
      if (!allowed) return res.status(403).json({ error: "Forbidden" });
    }

    const userId = String(req.params.userId || "").trim();
    const roleId = String(req.body?.roleId || "").trim();
    if (!userId || !roleId) return res.status(400).json({ error: "Missing userId or roleId" });

    // 1) Versuche user_roles upsert (wenn Tabelle existiert)
    const { error: upErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role_id: roleId }, { onConflict: "user_id" });

    if (!upErr) return res.json({ userId, roleId });

    // 2) Fallback: user_metadata.roleId setzen
    const { error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { roleId },
    });
    if (metaErr) return res.status(500).json({ error: metaErr.message });

    res.json({ userId, roleId });
  } catch (e) {
    console.error("[admin] PUT /users/:userId/role failed:", e);
    res.status(500).json({ error: e?.message || "Failed to update user role" });
  }
});

export default router;
