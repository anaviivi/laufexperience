import "dotenv/config";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = express.Router();

/**
 * -------------------------------------------------------------
 * Supabase Auth Client (Token-Verifizierung)
 * -------------------------------------------------------------
 * Wichtig: createClient darf NICHT mit leerem Key aufgerufen werden,
 * sonst crasht das Backend schon beim Import.
 */
const url = (process.env.SUPABASE_URL || "").trim();
const anon = (process.env.SUPABASE_ANON_KEY || "").trim();
const service = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const authKey = anon || service;

let supabaseAuth = null;

if (!url) {
  console.warn("[adminPermissions] Missing SUPABASE_URL");
} else if (!authKey) {
  console.warn("[adminPermissions] Missing SUPABASE_ANON_KEY (and SERVICE fallback)");
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
 * Routes
 */
router.get("/permissions/_ping", (req, res) => res.json({ ok: true }));

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
    console.error("[adminPermissions] GET /permissions failed:", e);
    res.status(500).json({ error: e?.message || "Failed to load permissions" });
  }
});

export default router;
