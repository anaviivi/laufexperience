import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchJson } from "./api";

const cardBorder = "1px solid var(--color-border)";

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    padding: "32px 16px",
    boxSizing: "border-box",
  },
  container: { maxWidth: 1200, margin: "0 auto" },
  h1: { fontSize: 44, margin: 0, fontWeight: 800, letterSpacing: -0.5 },
  sub: { marginTop: 8, color: "var(--color-muted)" },

  toolbar: {
    marginTop: 18,
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },

  pill: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "var(--color-card)",
    border: cardBorder,
    color: "var(--color-text)",
    fontSize: 14,
  },

  search: {
    flex: 1,
    minWidth: 260,
    padding: "10px 12px",
    borderRadius: 12,
    border: cardBorder,
    outline: "none",
    fontSize: 14,
    background: "var(--color-card)",
    color: "var(--color-text)",
  },

  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: cardBorder,
    background: "var(--color-card)",
    color: "var(--color-text)",
    cursor: "pointer",
    fontWeight: 700,
  },
  btnDisabled: { opacity: 0.55, cursor: "not-allowed" },

  card: {
    marginTop: 14,
    background: "var(--color-card)",
    border: cardBorder,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "var(--color-shadow)",
  },

  table: { width: "100%", borderCollapse: "collapse" },

  th: {
    textAlign: "left",
    padding: "12px 14px",
    fontSize: 13,
    color: "var(--color-text)",
    background: "var(--color-soft)",
    borderBottom: cardBorder,
  },

  td: {
    padding: "12px 14px",
    borderBottom: "1px solid var(--color-borderSubtle)",
    verticalAlign: "top",
    color: "var(--color-text)",
  },

  error: {
    marginTop: 14,
    padding: "12px 12px",
    background: "#fdecec",
    border: "1px solid #f5b5b5",
    borderRadius: 12,
    color: "#7f1d1d",
    fontWeight: 800,
    display: "flex",
    gap: 10,
    alignItems: "center",
  },

  select: {
    padding: "8px 10px",
    borderRadius: 12,
    border: cardBorder,
    background: "var(--color-card)",
    color: "var(--color-text)",
    fontWeight: 800,
  },
};

export default function AdminUsersPage() {
  const abortRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [canManage, setCanManage] = useState(false);
  const [savingUserId, setSavingUserId] = useState("");

  const load = useCallback(async (signal, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");

    try {
      const [rolesRes, usersRes] = await Promise.all([
        fetchJson("/api/admin/roles", { signal }),
        fetchJson("/api/admin/users", { signal }),
      ]);

      setRoles(Array.isArray(rolesRes?.roles) ? rolesRes.roles : []);
      setUsers(Array.isArray(usersRes?.users) ? usersRes.users : []);
      setCanManage(!!usersRes?.canManage);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError(String(e?.message || "Load failed"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    abortRef.current = ac;
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  const reload = useCallback(async () => {
    setReloading(true);
    const ac = new AbortController();
    abortRef.current?.abort?.();
    abortRef.current = ac;
    await load(ac.signal, { silent: true });
    setReloading(false);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return (users || []).filter((u) => {
      const name = String(u?.name || "").toLowerCase();
      const email = String(u?.email || "").toLowerCase();
      const roleId = String(u?.roleId || "").toLowerCase();
      return name.includes(q) || email.includes(q) || roleId.includes(q);
    });
  }, [users, query]);

  const updateRole = useCallback(
    async (userId, roleId) => {
      if (!canManage) return;
      setSavingUserId(userId);
      setError("");
      try {
        await fetchJson(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
          method: "PUT",
          body: { roleId },
        });
        setUsers((prev) =>
          (prev || []).map((u) => (u.id === userId ? { ...u, roleId } : u))
        );
      } catch (e) {
        setError(String(e?.message || "Speichern fehlgeschlagen"));
      } finally {
        setSavingUserId("");
      }
    },
    [canManage]
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.h1}>Admin Bereich</h1>

        <h2 style={{ marginTop: 26, marginBottom: 0, fontSize: 34, fontWeight: 900 }}>
          Admin: Users
        </h2>
        <div style={styles.sub}>
          Hier siehst du, welcher User welche Rolle hat. Du kannst Rollen ändern
          (z.B. User zum Admin machen).
        </div>

        {error && (
          <div style={styles.error}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div style={styles.toolbar}>
          <button style={styles.btn} onClick={() => window.history.back()} title="Zurück">
            ← Zurück
          </button>

          <span style={styles.pill}>
            Users: <b>{users.length}</b> • Rollen: <b>{roles.length}</b> •{" "}
            {canManage ? <b>Bearbeiten</b> : <b>Nur lesen</b>}
          </span>

          <input
            style={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen (Name, Email, Rolle)…"
          />

          <button
            style={{ ...styles.btn, ...(reloading ? styles.btnDisabled : null) }}
            onClick={reload}
            disabled={reloading}
          >
            {reloading ? "Laden…" : "Neu laden"}
          </button>
        </div>

        <div style={styles.card}>
          {loading ? (
            <div style={{ padding: 14, color: "var(--color-muted)" }}>Lade User…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 14, color: "var(--color-muted)" }}>Keine Treffer.</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Rolle</th>
                  <th style={styles.th}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const busy = savingUserId === u.id;
                  return (
                    <tr key={u.id}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 900 }}>{u.name || "—"}</div>
                        <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                          {u.id}
                        </div>
                      </td>

                      <td style={styles.td}>{u.email || "—"}</td>

                      <td style={{ ...styles.td, fontWeight: 900 }}>
                        {u.roleId || "user"}
                      </td>

                      <td style={styles.td}>
                        {canManage ? (
                          <select
                            style={{ ...styles.select, opacity: busy ? 0.6 : 1 }}
                            disabled={busy}
                            value={u.roleId || "user"}
                            onChange={(e) => updateRole(u.id, e.target.value)}
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name || r.id}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: "var(--color-muted)" }}>
                            Keine Berechtigung
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 18, color: "var(--color-muted)", fontSize: 13 }}>
          © {new Date().getFullYear()} LaufXperience – Alle Rechte vorbehalten
        </div>
      </div>
    </div>
  );
}
