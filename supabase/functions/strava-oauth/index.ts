import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // user_id

  const SITE_URL = Deno.env.get("SITE_URL") || Deno.env.get("FRONTEND_URL") || "http://localhost:5173";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SERVICE_ROLE_KEY");

  const STRAVA_CLIENT_ID = Deno.env.get("STRAVA_CLIENT_ID");
  const STRAVA_CLIENT_SECRET = Deno.env.get("STRAVA_CLIENT_SECRET");

  if (!code || !state) {
    return Response.redirect(`${SITE_URL}/device-connections?strava=error`, 302);
  }
  if (!SUPABASE_URL || !SERVICE_ROLE || !STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET) {
    return Response.redirect(`${SITE_URL}/device-connections?strava=error`, 302);
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  const tokenJson: any = await tokenRes.json();
  if (!tokenRes.ok) {
    return Response.redirect(`${SITE_URL}/device-connections?strava=error`, 302);
  }

  const access_token = tokenJson?.access_token;
  const refresh_token = tokenJson?.refresh_token;
  const expires_at = tokenJson?.expires_at;

  if (!access_token || !refresh_token || !expires_at) {
    return Response.redirect(`${SITE_URL}/device-connections?strava=error`, 302);
  }

  const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/device_connections`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      user_id: state,
      provider: "strava",
      access_token,
      refresh_token,
      expires_at,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!upsertRes.ok) {
    return Response.redirect(`${SITE_URL}/device-connections?strava=error`, 302);
  }

  return Response.redirect(`${SITE_URL}/device-connections?strava=connected`, 302);
});
