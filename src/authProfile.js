import { supabase } from "./supabaseClient";

export async function syncProfileToLocalStorage() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    localStorage.removeItem("laufx_profile");
    window.dispatchEvent(new Event("laufx_profile_updated"));
    return null;
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("id, email, role, avatar, unit_system, level, xp")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("user_profiles select failed:", error);
    return null;
  }

  localStorage.setItem("laufx_profile", JSON.stringify(profile));
  window.dispatchEvent(new Event("laufx_profile_updated"));
  return profile;
}
