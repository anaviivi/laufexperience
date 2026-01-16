import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend/.env laden
dotenv.config({ path: path.join(__dirname, ".env") });

// akzeptiere mehrere Key-Namen (falls du mal anders benannt hast)
const SUPABASE_URL =
  (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();

const SERVICE_KEY =
  (process.env.SUPABASE_SERVICE_ROLE_KEY ||
   process.env.SUPABASE_SERVICE_KEY ||
   process.env.SUPABASE_SERVICE_ROLE ||
   "").trim();

export const supabaseAdmin =
  SUPABASE_URL && SERVICE_KEY
    ? createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.warn(
    "[supabaseAdmin] NOT configured. Missing:",
    !SUPABASE_URL ? "SUPABASE_URL" : "",
    !SERVICE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : ""
  );
}
