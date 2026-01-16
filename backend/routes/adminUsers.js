import express from "express";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../supabaseAdmin.js";

const router = express.Router();

const url = (process.env.SUPABASE_URL || "").trim();
const anon = (process.env.SUPABASE_ANON_KEY || "").trim();
const service = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const authKey = anon || service;

const supabaseAuth = url && authKey
  ? createClient(url, authKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;

function bearer(req) {
  const h = String(req.headers.authorization || "");
  if (!h.toLowerCase().startsWith("bearer ")) return "";
  return h.slice(7).trim();
}

async function getUserOr401(req, res) {
  if (!supabaseAuth) {
    res.status(500).json({ error: "Supabase auth not configured (SUPABASE_URL/ANON_KEY fehlen)" });
    return null;
  }
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: "missing_token" });
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: "invalid_token" });
  return data.user;
}

async function hasPermission(userId, permissionKey) {
  if (!supabaseAdmin) throw new Error("Supabase admin not configured (SERVICE ROLE KEY fehlt)");

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

router.get("/users", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    if (!(await hasPermission(user.id, "users.view"))) {
      return res.status(403).json({ error: "forbidden" });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Supabase admin not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen)" });
    }

    // Supabase Auth: Userliste (inkl Email)
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200, page: 1 });
    if (listErr) return res.status(500).json({ error: listErr.message });

    const authUsers = list?.users || [];
    const ids = authUsers.map(u => u.id);

    // Rollen aus Tabelle user_roles ziehen
    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role_id")
      .in("user_id", ids);

    if (rolesErr) return res.status(500).json({ error: rolesErr.message });

    const roleMap = new Map((roles || []).map(r => [r.user_id, r.role_id]));

    const out = authUsers.map(u => ({
      id: u.id,
      email: u.email || "",
      name: (u.user_metadata && (u.user_metadata.name || u.user_metadata.full_name)) || "",
      roleId: roleMap.get(u.id) || "user",
    }));

    res.json(out);
  } catch (e) {
    console.error("[adminUsers] GET /users failed:", e);
    res.status(500).json({ error: e?.message || "failed" });
  }
});

// Rollen-Liste (ohne Moderator)
router.get("/roles", async (req, res) => {
  try {
    const user = await getUserOr401(req, res);
    if (!user) return;

    if (!(await hasPermission(user.id, "users.manage"))) {
      // wer nur view hat, darf roles sehen? -> optional:
      // wenn du willst: users.view reicht zum Anzeigen
      // hier strikt: manage
      return res.status(403).json({ error: "forbidden" });
    }

    const { data, error } = await supabaseAdmin
      .from("roles")
      .select("id,name,description")
      .order("id");

    if (error) return res.status(500).json({ error: error.message });

    const roles = (data || []).filter(r => String(r.id).toLowerCase() !== "moderator" && String(r.name||"").toLowerCase() !== "moderator");
    res.json(roles);
  } catch (e) {
    console.error("[adminUsers] GET /roles failed:", e);
    res.status(500).json({ error: e?.message || "failed" });
  }
});

// Rolle setzen (nur roleId, sonst nix)
router.put("/users/:id/role", async (req, res) => {
  try {
    const admin = await getUserOr401(req, res);
    if (!admin) return;

    if (!(await hasPermission(admin.id, "users.manage"))) {
      return res.status(403).json({ error: "forbidden" });
    }

    const userId = req.params.id;
    const roleId = String(req.body?.roleId || "user").trim();

    if (roleId.toLowerCase() === "moderator") {
      return res.status(400).json({ error: "moderator_not_allowed" });
    }

    // roleId muss existieren
    const { data: roleRow, error: roleErr } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("id", roleId)
      .maybeSingle();

    if (roleErr) return res.status(500).json({ error: roleErr.message });
    if (!roleRow) return res.status(400).json({ error: "unknown_role" });

    // upsert user_roles
    const { error: upErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role_id: roleId }, { onConflict: "user_id" });

    if (upErr) return res.status(500).json({ error: upErr.message });

    res.json({ ok: true, userId, roleId });
  } catch (e) {
    console.error("[adminUsers] PUT /users/:id/role failed:", e);
    res.status(500).json({ error: e?.message || "failed" });
  }
});

export default router;
