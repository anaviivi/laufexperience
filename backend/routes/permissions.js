// backend/routes/adminPermissions.js
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = express.Router();

// Token prüfen mit ANON KEY (nur Verifizierung)
const supabaseAuth = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

function getBearer(req) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

async function getUserOr401(req, res) {
  const token = getBearer(req);
  if (!token) {
    res.status(401).json({ error: "Missing Bearer token" });
    return null;
  }
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data?.user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  return data.user;
}

async function hasPermission(userId, permissionKey) {
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

// ✅ Ping: /api/admin/permissions/_ping
router.get("/permissions/_ping", (req, res) => {
  res.json({ ok: true, route: "/api/admin/permissions/_ping" });
});

// ✅ GET: /api/admin/permissions
router.get("/permissions", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const allowed = await hasPermission(user.id, "permissions.manage");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

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

    const permissionGroups = Array.from(groupMap.entries()).map(([title, permsInGroup]) => ({
      title,
      perms: permsInGroup,
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
    console.error(e);
    res.status(500).json({ error: e?.message || "Failed to load permissions" });
  }
});

// ✅ PUT: /api/admin/permissions/:roleId
router.put("/permissions/:roleId", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    const allowed = await hasPermission(user.id, "permissions.manage");
    if (!allowed) return res.status(403).json({ error: "Forbidden" });

    const { roleId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: "permissions must be an array" });
    }

    const { data: valid, error: vErr } = await supabaseAdmin.from("permissions").select("key");
    if (vErr) return res.status(500).json({ error: vErr.message });

    const validSet = new Set((valid || []).map((x) => x.key));
    const cleaned = Array.from(new Set(permissions)).filter((p) => validSet.has(p));

    const { error: delErr } = await supabaseAdmin
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId);
    if (delErr) return res.status(500).json({ error: delErr.message });

    if (cleaned.length) {
      const rows = cleaned.map((permission_key) => ({ role_id: roleId, permission_key }));
      const { error: insErr } = await supabaseAdmin.from("role_permissions").insert(rows);
      if (insErr) return res.status(500).json({ error: insErr.message });
    }

    res.json({ ok: true, roleId, permissions: cleaned.sort() });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Failed to save permissions" });
  }
});

export default router;
