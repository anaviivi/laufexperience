import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_ACTIVITIES_URL = "https://www.strava.com/api/v3/athlete/activities";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function mustEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function refreshTokenIfNeeded({
  supabaseAdmin,
  userId,
  conn,
  clientId,
  clientSecret,
}: {
  supabaseAdmin: ReturnType<typeof createClient>;
  userId: string;
  conn: any;
  clientId: string;
  clientSecret: string;
}) {
  const expiresAt = new Date(conn.expires_at).getTime();
  if (Number.isFinite(expiresAt) && expiresAt > Date.now() + 60_000) return conn;

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: conn.refresh_token,
    }),
  });

  if (!res.ok) throw new Error("Failed to refresh token");
  const j = await res.json();

  const updated = {
    ...conn,
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: new Date(Number(j.expires_at) * 1000).toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("device_connections")
    .update({
      access_token: updated.access_token,
      refresh_token: updated.refresh_token,
      expires_at: updated.expires_at,
    })
    .eq("user_id", userId)
    .eq("provider", "other");

  if (error) throw new Error("Failed to store refreshed token");
  return updated;
}

serve(async (req) => {
  const SUPABASE_URL = mustEnv("SUPABASE_URL");
  const SERVICE_ROLE = mustEnv("SERVICE_ROLE_KEY");
  const STRAVA_CLIENT_ID = mustEnv("STRAVA_CLIENT_ID");
  const STRAVA_CLIENT_SECRET = mustEnv("STRAVA_CLIENT_SECRET");

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const authHeader = req.headers.get("authorization") || "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!jwt) return json({ error: "Missing Authorization Bearer token" }, 401);

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401);
  const userId = userData.user.id;

  const { data: conn, error: connErr } = await supabaseAdmin
    .from("device_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "other")
    .single();

  if (connErr || !conn) return json({ error: "Strava not connected" }, 400);

  const liveConn = await refreshTokenIfNeeded({
    supabaseAdmin,
    userId,
    conn,
    clientId: STRAVA_CLIENT_ID,
    clientSecret: STRAVA_CLIENT_SECRET,
  });

  const url = new URL(req.url);
  const afterDays = Math.min(365, Math.max(1, Number(url.searchParams.get("after_days") || 30)));
  const perPage = Math.min(200, Math.max(1, Number(url.searchParams.get("per_page") || 50)));
  const pages = Math.min(10, Math.max(1, Number(url.searchParams.get("pages") || 3)));

  const after = Math.floor((Date.now() - afterDays * 86400000) / 1000);

  let imported = 0;
  let scanned = 0;

  for (let page = 1; page <= pages; page++) {
    const apiUrl = `${STRAVA_ACTIVITIES_URL}?per_page=${perPage}&page=${page}&after=${after}`;

    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${liveConn.access_token}` },
    });

    if (!res.ok) break;
    const activities = await res.json();
    if (!Array.isArray(activities) || activities.length === 0) break;

    scanned += activities.length;

    const runActs = activities.filter((a) => String(a?.type || "").toLowerCase() === "run");

    const rows = runActs
      .map((a) => ({
        user_id: userId,
        started_at: a.start_date, // ISO
        distance_km: Math.round(((Number(a.distance || 0) / 1000)) * 10) / 10,
        duration_sec: Math.round(Number(a.moving_time || 0)),
        source: "strava",
        external_id: String(a.id),
      }))
      .filter((r) => r.distance_km > 0);

    if (rows.length) {
      const { error: upErr } = await supabaseAdmin
        .from("runs")
        .upsert(rows, { onConflict: "user_id,source,external_id" });

      if (!upErr) imported += rows.length;
    }

    if (activities.length < perPage) break;
  }

  return json({ ok: true, scanned, imported });
});
