// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Kein JSX hier! Nur ein Console-Log.
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your .env file."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
