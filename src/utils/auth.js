import { supabase } from "../supabaseClient";

const LS_KEY = "laufx_profile";

export function getProfile() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setProfile(profile) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
  } catch {}
  // eigenes Event: sofort UI updaten (auch im gleichen Tab)
  window.dispatchEvent(new Event("laufx_profile_updated"));
}

export function clearProfile() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
  window.dispatchEvent(new Event("laufx_profile_updated"));
}

export function detectAdmin(profile) {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  if (Array.isArray(profile.roles) && profile.roles.includes("admin")) return true;
  return false;
}

/**
 * Lädt Profil aus DB - aber NUR wenn eine echte Supabase Session existiert.
 * Das verhindert "Auto-ReLogin" nach dem Logout.
 */
export async function syncProfileFromDB() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.warn("[auth] getSession error", sessionError);
    return null;
  }

  const session = sessionData?.session;
  if (!session) return null;

  const user = session.user;

  // ✅ WICHTIG: deine Tabelle heißt user_profiles (nicht profiles)
  // ✅ gender optional dazu (laut Screenshot existiert es)
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, email, role, avatar, gender")
    .eq("id", user.id)
    .single();

  if (error) {
    console.warn("[auth] syncProfileFromDB error", error);
    return null;
  }

  const profile = {
    id: data?.id ?? user.id,
    email: data?.email ?? user.email ?? null,
    role: data?.role ?? "user",          // <-- hier kommt "admin" rein
    avatar: data?.avatar ?? null,
    gender: data?.gender ?? null,
  };

  setProfile(profile);
  return profile;
}
