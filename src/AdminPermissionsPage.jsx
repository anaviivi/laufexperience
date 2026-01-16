import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "./ThemeContext.jsx";
import { fetchJson } from "./api";

/**
 * AdminPermissionsPage.jsx
 * Erwartet Backend:
 *  GET  /api/admin/permissions
 *    -> {
 *      roles: [{id,name,description?, inherits?: string[]}],
 *      permissionGroups: [{title, perms:[{key,label?}]}],
 *      matrix: { [roleId]: [permKey] }
 *    }
 *  PUT  /api/admin/permissions/:roleId
 *    body: { permissions: string[] }
 *    -> { roleId, permissions: string[] }
 */

const cardBorder = "1px solid var(--color-border)";

// 🔒 Kritische Permissions (optional): nur für bestimmte Rollen editierbar.
// Wenn du KEINE Sperren willst: setze CRITICAL_PERMISSION_KEYS = []
const CRITICAL_PERMISSION_KEYS = ["admin.permissions.write", "users.delete", "users.manage"];

// ✅ Fix für dein Screenshot-Problem: Admin DARF kritische Rechte ändern.
// (Wenn du nur superadmin willst, entferne "admin" wieder.)
const CRITICAL_EDIT_ROLES = new Set(["superadmin", "admin"]);

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    padding: "32px 16px",
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
  },
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
  },

  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: cardBorder,
    background: "var(--color-card)",
    cursor: "pointer",
    fontWeight: 600,
    // ✅ "var(...)" entfernt
    color: "var(--color-onLight)",
  },
  btnSmall: {
    padding: "7px 10px",
    borderRadius: 10,
    border: cardBorder,
    background: "var(--color-card)",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    // ✅ "var(...)" entfernt
    color: "var(--color-onLight)",
  },
  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid var(--color-text)",
    background: "var(--color-text)",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  btnDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
  },

  grid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: 16,
  },

  card: {
    background: "var(--color-card)",
    border: cardBorder,
    borderRadius: 16,
    padding: 14,
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  cardTitleText: { fontSize: 18, fontWeight: 800, margin: 0 },

  list: { display: "flex", flexDirection: "column", gap: 8 },
  roleBtn: (active, theme) => ({
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 12,
    border: active ? "1px solid rgba(255,255,255,.18)" : cardBorder,
    background: active ? (theme === "dark" ? "rgba(255,255,255,.10)" : "var(--color-text)") : "var(--color-card)",
    color: active ? (theme === "dark" ? "rgba(255,255,255,.92)" : "white") : "var(--color-text)",
    cursor: "pointer",
    transition: "transform 0.05s ease",
  }),
  roleName: { fontWeight: 800, marginBottom: 2 },
  roleDesc: { fontSize: 13, opacity: 0.8 },
  roleMeta: { fontSize: 12, opacity: 0.85, marginTop: 6 },

  error: {
    marginTop: 14,
    padding: "12px 12px",
    background: "#fdecec",
    border: "1px solid #f5b5b5",
    borderRadius: 12,
    color: "#7f1d1d",
    fontWeight: 700,
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  hint: {
    marginTop: 10,
    padding: "12px 12px",
    background: "var(--color-card)7ed",
    border: "1px solid #fed7aa",
    borderRadius: 12,
    color: "#7c2d12",
    fontWeight: 600,
    lineHeight: 1.35,
  },

  group: { border: cardBorder, borderRadius: 14, overflow: "hidden", marginTop: 10 },
  groupHeader: {
    padding: "10px 12px",
    background: "var(--color-soft)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottom: cardBorder,
  },
  groupTitle: { fontWeight: 900, margin: 0 },
  groupActions: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },

  permRow: {
    padding: "10px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottom: "1px solid var(--color-border)Subtle",
  },
  permText: { display: "flex", flexDirection: "column", gap: 2 },
  permKey: { fontSize: 12, color: "var(--color-muted)" },
  badge: {
    fontSize: 12,
    fontWeight: 800,
    padding: "4px 8px",
    borderRadius: 999,
    border: cardBorder,
    background: "var(--color-card)",
    color: "var(--color-text)",
  },
  badgeMuted: {
    fontSize: 12,
    fontWeight: 800,
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid var(--color-border)",
    background: "var(--color-soft)",
    color: "var(--color-text)",
  },

  toggle: (disabled) => ({
    width: 44,
    height: 26,
    borderRadius: 999,
    border: cardBorder,
    display: "flex",
    alignItems: "center",
    padding: 3,
    cursor: disabled ? "not-allowed" : "pointer",
    boxSizing: "border-box",
    background: disabled ? "var(--color-soft)" : "var(--color-card)",
    opacity: disabled ? 0.65 : 1,
  }),
  knob: (on) => ({
    width: 20,
    height: 20,
    borderRadius: 999,
    background: on ? "var(--color-text)" : "var(--color-border)",
    transform: on ? "translateX(18px)" : "translateX(0px)",
    transition: "transform 0.15s ease",
  }),
};

const toSetMatrix = (matrixObj) => {
  const out = {};
  for (const [roleId, perms] of Object.entries(matrixObj || {})) {
    out[roleId] = new Set(Array.isArray(perms) ? perms : []);
  }
  return out;
};

const cloneMatrix = (m) => {
  const out = {};
  for (const [k, v] of Object.entries(m || {})) out[k] = new Set(Array.from(v || []));
  return out;
};

const setsEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return (!a || a.size === 0) && (!b || b.size === 0);
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
};

const canEditCritical = (roleId) => CRITICAL_EDIT_ROLES.has(String(roleId || ""));
const isCritical = (permKey) => CRITICAL_PERMISSION_KEYS.includes(String(permKey || ""));

// Optional Auth
const getAuthHeader = async () => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const PermissionRow = memo(function PermissionRow({ p, on, inherited, locked, onToggle, borderBottom }) {
  const disabled = inherited || locked;
  const title = locked
    ? "🔒 Kritische Permission – nicht editierbar"
    : inherited
      ? "🔗 Geerbt – wird durch eine Basisrolle gesetzt"
      : on
        ? "Deaktivieren"
        : "Aktivieren";

  return (
    <div style={{ ...styles.permRow, borderBottom }}>
      <div style={styles.permText}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800 }}>{p.label || p.key}</div>
          {inherited && <span style={styles.badgeMuted}>geerbt</span>}
          {locked && <span style={styles.badgeMuted}>gesperrt</span>}
        </div>
        <div style={styles.permKey}>{p.key}</div>
      </div>

      <div
        role="switch"
        aria-checked={on}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        style={styles.toggle(disabled)}
        onClick={() => {
          if (!disabled) onToggle(p.key);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle(p.key);
          }
        }}
        title={title}
      >
        <div style={styles.knob(on)} />
      </div>
    </div>
  );
});

export default function AdminPermissionsPage() {
  const { colors, isDark, theme } = useTheme();

  const abortRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [error, setError] = useState("");

  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [activeRole, setActiveRole] = useState("");

  // matrix: { [roleId]: Set(permissionKey) }  => DIREKTE Permissions
  const [matrix, setMatrix] = useState({});
  const [initialMatrix, setInitialMatrix] = useState({});

  const [query, setQuery] = useState("");
  const [savingRoleId, setSavingRoleId] = useState("");
  const [savingAll, setSavingAll] = useState(false);

  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());

  const activeRoleObj = useMemo(() => roles.find((r) => r.id === activeRole), [roles, activeRole]);

  const rolePermissions = useMemo(() => matrix[activeRole] || new Set(), [matrix, activeRole]);
  const initialRolePermissions = useMemo(() => initialMatrix[activeRole] || new Set(), [initialMatrix, activeRole]);

  // Vererbungsgraph: roleId -> inherits[]
  const inheritsMap = useMemo(() => {
    const m = new Map();
    for (const r of roles || []) {
      const inh = Array.isArray(r?.inherits) ? r.inherits.filter(Boolean) : [];
      m.set(r.id, inh);
    }
    return m;
  }, [roles]);

  const inheritedPermissions = useMemo(() => {
    if (!activeRole) return new Set();

    const visited = new Set();
    const out = new Set();

    const dfs = (rid) => {
      if (!rid || visited.has(rid)) return;
      visited.add(rid);

      const parents = inheritsMap.get(rid) || [];
      for (const p of parents) {
        const ps = matrix[p] || new Set();
        for (const k of ps) out.add(k);
        dfs(p);
      }
    };

    dfs(activeRole);
    return out;
  }, [activeRole, inheritsMap, matrix]);

  const effectivePermissions = useMemo(() => {
    const out = new Set(Array.from(inheritedPermissions));
    for (const k of rolePermissions) out.add(k);
    return out;
  }, [inheritedPermissions, rolePermissions]);

  const isDirtyRole = useMemo(() => {
    if (!activeRole) return false;
    return !setsEqual(rolePermissions, initialRolePermissions);
  }, [activeRole, rolePermissions, initialRolePermissions]);

  const dirtyCount = useMemo(() => {
    let count = 0;
    for (const r of roles) {
      const a = matrix[r.id] || new Set();
      const b = initialMatrix[r.id] || new Set();
      if (!setsEqual(a, b)) count += 1;
    }
    return count;
  }, [roles, matrix, initialMatrix]);

  const totalPermCount = useMemo(
    () => (permissionGroups || []).reduce((n, g) => n + (g?.perms?.length || 0), 0),
    [permissionGroups]
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return permissionGroups;

    const matches = (p) => {
      const key = String(p?.key || "").toLowerCase();
      const label = String(p?.label || "").toLowerCase();
      return key.includes(q) || label.includes(q);
    };

    return (permissionGroups || [])
      .map((g) => ({ ...g, perms: (g.perms || []).filter(matches) }))
      .filter((g) => (g.perms || []).length > 0);
  }, [permissionGroups, query]);

  const ensureRole = useCallback((list, role) => {
    const arr = Array.isArray(list) ? list : [];
    return arr.some((r) => r?.id === role.id) ? arr : [...arr, role];
  }, []);

  const load = useCallback(
    async (signal, { silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");

      try {
        const auth = await getAuthHeader();
        const data = await fetchJson("/api/admin/permissions", { signal, headers: auth });

        // Rollen aus Backend
        let newRoles = Array.isArray(data?.roles) ? data.roles : [];

        // ✅ Fix: "user" Rolle links anzeigen, auch wenn Backend sie (noch) nicht liefert.
        // Sauberer ist: Backend ergänzen. Aber so siehst du sie sofort in der UI.
        newRoles = ensureRole(newRoles, {
          id: "user",
          name: "User",
          description: "Standardnutzer",
          inherits: [],
        });

        const newGroups = Array.isArray(data?.permissionGroups) ? data.permissionGroups : [];
        const newMatrix = toSetMatrix(data?.matrix || {});

        // Falls Backend für "user" keine Matrix liefert: initial leer.
        if (!newMatrix.user) newMatrix.user = new Set();

        setRoles(newRoles);
        setPermissionGroups(newGroups);
        setMatrix(newMatrix);
        setInitialMatrix(cloneMatrix(newMatrix));

        setActiveRole((prev) => {
          if (prev && newRoles.some((r) => r.id === prev)) return prev;
          return newRoles[0]?.id || "";
        });

        setCollapsedGroups(new Set());
      } catch (e) {
        const m = String(e?.message || "");
        if (e?.name === "AbortError" || m.toLowerCase().includes("aborted")) return;
        setError(m || "Unbekannter Fehler");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [ensureRole]
  );

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

  const resetRole = useCallback(() => {
    if (!activeRole) return;
    setMatrix((prev) => ({
      ...prev,
      [activeRole]: new Set(Array.from(initialMatrix[activeRole] || [])),
    }));
  }, [activeRole, initialMatrix]);

  const togglePerm = useCallback(
    (permKey) => {
      if (!activeRole) return;
      if (inheritedPermissions.has(permKey)) return;
      if (isCritical(permKey) && !canEditCritical(activeRole)) return;

      setMatrix((prev) => {
        const next = { ...prev };
        const s = new Set(Array.from(next[activeRole] || []));
        if (s.has(permKey)) s.delete(permKey);
        else s.add(permKey);
        next[activeRole] = s;
        return next;
      });
    },
    [activeRole, inheritedPermissions]
  );

  const setGroupAll = useCallback(
    (group, mode /* "add" | "remove" */) => {
      if (!activeRole) return;

      const keys = (group?.perms || []).map((p) => p.key).filter(Boolean);
      if (keys.length === 0) return;

      setMatrix((prev) => {
        const next = { ...prev };
        const s = new Set(Array.from(next[activeRole] || []));

        for (const k of keys) {
          const locked = isCritical(k) && !canEditCritical(activeRole);
          const inherited = inheritedPermissions.has(k);
          if (locked || inherited) continue;
          if (mode === "add") s.add(k);
          else s.delete(k);
        }

        next[activeRole] = s;
        return next;
      });
    },
    [activeRole, inheritedPermissions]
  );

  const saveRole = useCallback(async () => {
    if (!activeRole) return;

    setSavingRoleId(activeRole);
    setError("");

    try {
      const auth = await getAuthHeader();
      const permissions = Array.from(matrix[activeRole] || []).sort();

      const res = await fetchJson(`/api/admin/permissions/${encodeURIComponent(activeRole)}`, {
        method: "PUT",
        headers: auth,
        body: { permissions },
      });

      const saved = new Set(Array.isArray(res?.permissions) ? res.permissions : permissions);

      setMatrix((prev) => ({ ...prev, [activeRole]: saved }));
      setInitialMatrix((prev) => ({ ...prev, [activeRole]: new Set(Array.from(saved)) }));
    } catch (e) {
      setError(String(e?.message || "Speichern fehlgeschlagen"));
    } finally {
      setSavingRoleId("");
    }
  }, [activeRole, matrix]);

  const saveAll = useCallback(async () => {
    setSavingAll(true);
    setError("");

    try {
      const auth = await getAuthHeader();
      const dirtyRoles = roles
        .map((r) => r.id)
        .filter((rid) => !setsEqual(matrix[rid] || new Set(), initialMatrix[rid] || new Set()));

      for (const rid of dirtyRoles) {
        const permissions = Array.from(matrix[rid] || []).sort();
        const res = await fetchJson(`/api/admin/permissions/${encodeURIComponent(rid)}`, {
          method: "PUT",
          headers: auth,
          body: { permissions },
        });
        const saved = new Set(Array.isArray(res?.permissions) ? res.permissions : permissions);

        setMatrix((prev) => ({ ...prev, [rid]: saved }));
        setInitialMatrix((prev) => ({ ...prev, [rid]: new Set(Array.from(saved)) }));
      }
    } catch (e) {
      setError(String(e?.message || "Speichern fehlgeschlagen"));
    } finally {
      setSavingAll(false);
    }
  }, [roles, matrix, initialMatrix]);

  const show404Hint = useMemo(() => {
    const msg = (error || "").toLowerCase();
    return msg.includes("404") || msg.includes("not found") || msg.includes("cannot get");
  }, [error]);

  const inheritsText = useMemo(() => {
    const inh = Array.isArray(activeRoleObj?.inherits) ? activeRoleObj.inherits.filter(Boolean) : [];
    return inh.length ? inh.join(", ") : "—";
  }, [activeRoleObj]);

  const toggleGroupCollapsed = useCallback((title) => {
    setCollapsedGroups((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  return (
    <div style={styles.page} className="admin-permissions">
      <div style={styles.container}>
        <div style={styles.sub}>Rollen auswählen und Berechtigungen togglen.</div>

        {error && (
          <>
            <div style={styles.error}>
              <span style={{ fontSize: 18 }}>✖</span>
              <span>{error}</span>
            </div>

            {show404Hint && (
              <div style={styles.hint}>
                Dein Frontend ruft <b>/api/admin/permissions</b> auf, aber das Backend liefert <b>404</b>.
                <br />
                👉 Implementiere die Route im Backend (GET /api/admin/permissions und PUT /api/admin/permissions/:roleId)
                oder korrigiere den Pfad.
              </div>
            )}
          </>
        )}

        <div style={styles.toolbar}>
          <button style={styles.btn} onClick={() => window.history.back()} title="Zurück">
            ← Zurück
          </button>

          <span style={styles.pill}>
            Rollen: <b>{roles.length}</b> • Permissions: <b>{totalPermCount}</b> • Dirty: <b>{dirtyCount}</b>
          </span>

          <input
            style={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche Permission… (z.B. articles, manage, view)"
            aria-label="Permission Suche"
          />

          <button
            style={{
              ...styles.btn,
              ...(reloading ? styles.btnDisabled : null),
            }}
            onClick={reload}
            disabled={reloading}
            title="Neu laden"
          >
            {reloading ? "Laden…" : "Neu laden"}
          </button>

          <button
            style={{
              ...styles.btn,
              ...(!isDirtyRole || savingRoleId ? styles.btnDisabled : null),
            }}
            onClick={saveRole}
            disabled={!isDirtyRole || !!savingRoleId}
            title="Aktive Rolle speichern"
          >
            {savingRoleId ? "Speichere…" : "Speichern"}
          </button>

          <button
            style={{
              ...styles.btnPrimary,
              ...(dirtyCount === 0 || savingAll ? styles.btnDisabled : null),
            }}
            onClick={saveAll}
            disabled={dirtyCount === 0 || savingAll}
            title="Alle Änderungen speichern"
          >
            {savingAll ? "Speichere alle…" : "Alle speichern"}
          </button>
        </div>

        <div style={styles.grid}>
          {/* LEFT: Roles */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <h2 style={styles.cardTitleText}>Rollen</h2>
              <button
                style={{
                  ...styles.btn,
                  ...(!activeRole || !isDirtyRole ? styles.btnDisabled : null),
                }}
                onClick={resetRole}
                disabled={!activeRole || !isDirtyRole}
                title="Änderungen für diese Rolle verwerfen"
              >
                Reset
              </button>
            </div>

            {loading ? (
              <div style={{ color: "var(--color-muted)", padding: 10 }}>Lade Rollen…</div>
            ) : roles.length === 0 ? (
              <div style={{ color: "var(--color-muted)", padding: 10 }}>Keine Rollen gefunden.</div>
            ) : (
              <div style={styles.list}>
                {roles.map((r) => {
                  const inh = Array.isArray(r?.inherits) ? r.inherits.filter(Boolean) : [];
                  return (
                    <button
                      key={r.id}
                      // ✅ theme wird jetzt korrekt übergeben
                      style={styles.roleBtn(r.id === activeRole, theme)}
                      onClick={() => setActiveRole(r.id)}
                    >
                      <div style={styles.roleName}>{r.name || r.id}</div>
                      <div style={styles.roleDesc}>{r.description || `RoleId: ${r.id}`}</div>
                      <div style={styles.roleMeta}>
                        <span style={styles.badge}>direkt: {(matrix[r.id] || new Set()).size}</span>
                        {inh.length > 0 && (
                          <span style={{ ...styles.badgeMuted, marginLeft: 8 }}>erbt: {inh.join(", ")}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Permissions */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <h2 style={styles.cardTitleText}>
                  Rechte für: {activeRoleObj ? activeRoleObj.name || activeRoleObj.id : "—"}
                </h2>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={styles.badge}>effektiv: {effectivePermissions.size}</span>
                  <span style={styles.badgeMuted}>direkt: {rolePermissions.size}</span>
                  <span style={styles.badgeMuted}>geerbt: {inheritedPermissions.size}</span>
                  <span style={styles.badgeMuted}>
                    RoleId: <b>{activeRole || "—"}</b>
                  </span>
                  <span style={styles.badgeMuted}>
                    erbt: <b>{inheritsText}</b>
                  </span>
                </div>
              </div>

              <button
                style={styles.btnSmall}
                onClick={() => {
                  setCollapsedGroups((prev) => {
                    const allTitles = new Set((permissionGroups || []).map((g) => g.title));
                    if (prev.size === 0) return allTitles;
                    return new Set();
                  });
                }}
                title="Alle Gruppen ein-/ausklappen"
              >
                {collapsedGroups.size === 0 ? "Alle zuklappen" : "Alle aufklappen"}
              </button>
            </div>

            {loading ? (
              <div style={{ color: "var(--color-muted)", padding: 10 }}>Lade Permissions…</div>
            ) : !activeRole ? (
              <div style={{ color: "var(--color-muted)", padding: 10 }}>Bitte Rolle wählen.</div>
            ) : filteredGroups.length === 0 ? (
              <div style={{ color: "var(--color-muted)", padding: 10 }}>Keine Treffer.</div>
            ) : (
              <div>
                {filteredGroups.map((g) => {
                  const collapsed = collapsedGroups.has(g.title);
                  return (
                    <div key={g.title} style={styles.group}>
                      <div style={styles.groupHeader}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button
                            style={styles.btnSmall}
                            onClick={() => toggleGroupCollapsed(g.title)}
                            title={collapsed ? "Gruppe aufklappen" : "Gruppe zuklappen"}
                          >
                            {collapsed ? "+" : "–"}
                          </button>
                          <p style={styles.groupTitle}>{g.title}</p>
                          <span style={styles.badgeMuted}>{(g.perms || []).length}</span>
                        </div>

                        <div style={styles.groupActions}>
                          <button
                            style={styles.btn}
                            onClick={() => setGroupAll(g, "add")}
                            title="Alle in dieser Gruppe aktivieren (nur direkte)"
                          >
                            Alle an
                          </button>
                          <button
                            style={styles.btn}
                            onClick={() => setGroupAll(g, "remove")}
                            title="Alle in dieser Gruppe deaktivieren (nur direkte)"
                          >
                            Alle aus
                          </button>
                        </div>
                      </div>

                      {!collapsed &&
                        (g.perms || []).map((p, idx) => {
                          const inherited = inheritedPermissions.has(p.key);
                          const locked = isCritical(p.key) && !canEditCritical(activeRole);
                          const on = effectivePermissions.has(p.key);
                          const borderBottom =
                            idx === (g.perms || []).length - 1 ? "none" : styles.permRow.borderBottom;

                          return (
                            <PermissionRow
                              key={p.key}
                              p={p}
                              on={on}
                              inherited={inherited}
                              locked={locked}
                              onToggle={togglePerm}
                              borderBottom={borderBottom}
                            />
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            )}

            {activeRole && inheritedPermissions.size > 0 && (
              <div style={{ marginTop: 12, color: "var(--color-muted)", fontSize: 13, lineHeight: 1.35 }}>
                🔗 <b>Geerbte</b> Rechte können hier nicht deaktiviert werden. Ändere dazu die Basisrolle(n).
              </div>
            )}

            {activeRole && CRITICAL_PERMISSION_KEYS.length > 0 && (
              <div style={{ marginTop: 10, color: "var(--color-muted)", fontSize: 13, lineHeight: 1.35 }}>
                🔒 <b>Kritische</b> Rechte sind geschützt. Editierbar für:{" "}
                <b>{Array.from(CRITICAL_EDIT_ROLES).join(", ")}</b>.
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 18, color: "var(--color-muted)", fontSize: 13 }}>
          © {new Date().getFullYear()} LaufXperience – Alle Rechte vorbehalten
        </div>
      </div>
    </div>
  );
}
