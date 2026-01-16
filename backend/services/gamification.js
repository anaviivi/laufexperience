import { getSupabase } from "../supabaseClient.js";
const supabase = getSupabase();

// Minimal: Profil aus user_profiles laden (oder default zurückgeben)
export async function getUserProfile(userId) {
  if (!userId) return { id: null, name: "", level: 1, xp: 0 };

  // Erwartet Tabelle: public.user_profiles (aus deinem SQL)
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, name, level, xp")
    .eq("id", userId)
    .maybeSingle();

  // Wenn Tabelle/Spalten noch nicht existieren oder RLS blockt: fallback statt crash
  if (error || !data) {
    return { id: userId, name: "", level: 1, xp: 0 };
  }

  return {
    id: data.id,
    name: data.name || "",
    level: data.level || 1,
    xp: data.xp || 0,
  };
}
