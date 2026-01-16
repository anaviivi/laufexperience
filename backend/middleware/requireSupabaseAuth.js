import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function requireSupabaseAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ error: "Missing Bearer token" });

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = data.user;
  next();
}
