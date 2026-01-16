// src/api.js

function getSupabaseToken() {
  // Supabase legt ein Key wie "sb-<projectref>-auth-token" in localStorage an
  try {
    const keys = Object.keys(localStorage || {}).filter(
      (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
    );
    if (!keys.length) return "";
    const raw = localStorage.getItem(keys[0]);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.access_token || "";
  } catch {
    return "";
  }
}

export async function fetchJson(url, options = {}) {
  const token = getSupabaseToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error("Nicht eingeloggt");
    if (res.status === 403) throw new Error("Kein Zugriff (nur Admin)");
    const txt = await res.text().catch(() => "");
    throw new Error(txt || `Request failed (${res.status})`);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return res.text();

  return res.json();
}

export const api = {
  get: (url, opts = {}) => fetchJson(url, { ...opts, method: "GET" }),
  post: (url, body, opts = {}) =>
    fetchJson(url, { ...opts, method: "POST", body: JSON.stringify(body) }),
  put: (url, body, opts = {}) =>
    fetchJson(url, { ...opts, method: "PUT", body: JSON.stringify(body) }),
  del: (url, opts = {}) => fetchJson(url, { ...opts, method: "DELETE" }),
};
