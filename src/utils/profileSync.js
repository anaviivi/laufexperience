import { supabase } from "../supabaseClient";
import { setProfile } from "./auth";

export async function syncProfileFromSupabase() {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userRes?.user) {
    setProfile(null);
    return null;
  }

  const user = userRes.user;

  // ✅ DEINE TABELLE: user_profiles
  const { data: profile, error: profErr } = await supabase
    .from("user_profiles")
    .select("id, email, role, avatar, language, bio, gender")
    .eq("id", user.id)
    .single();

  if (profErr || !profile) {
    // Falls noch kein Profil-Row existiert → minimal speichern
    const minimal = { id: user.id, email: user.email, role: "user", avatar: null };
    setProfile(minimal);
    return minimal;
  }

  setProfile(profile);
  return profile;
}
