import { useNavigate } from "react-router-dom";

function StatPill({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-card)",
        borderRadius: 999,
        padding: "8px 12px",
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
        boxShadow: "var(--color-shadow)",
      }}
    >
      <span style={{ color: "var(--color-muted)", fontSize: 12 }}>{label}</span>
      <span style={{ color: "var(--color-text)", fontWeight: 800, fontSize: 12 }}>{value}</span>
    </div>
  );
}

function NavCard({ title, description, emoji, to, navigate }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(to)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate(to);
      }}
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-card)",
        borderRadius: 18,
        padding: 18,
        cursor: "pointer",
        boxShadow: "var(--color-shadow)",
        transition: "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 14px 28px rgba(17,24,39,0.10)";
        e.currentTarget.style.borderColor = "#d1d5db";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 10px 20px rgba(17,24,39,0.06)";
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "var(--color-text)" }}>{title}</div>
          <div style={{ marginTop: 6, color: "var(--color-muted)", lineHeight: 1.45 }}>{description}</div>
        </div>
        <div style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</div>
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ color: "var(--color-muted)", fontSize: 12 }}>{to}</div>
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            background: "var(--color-soft)",
            color: "var(--color-text)",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          Öffnen →
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "var(--color-bg)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-card)",
            backdropFilter: "blur(6px)",
            borderRadius: 20,
            padding: 18,
            boxShadow: "var(--color-shadow)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 28, color: "var(--color-text)", letterSpacing: 0.2 }}>
                Admin Dashboard
              </h2>
              <p style={{ marginTop: 8, marginBottom: 0, color: "var(--color-muted)" }}>
                Schnelle Navigation zu Artikeln, Usern und Permissions.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <StatPill label="Status" value="OK" />
              <StatPill label="Mode" value="Admin" />
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          <NavCard
            title="Artikel"
            description="Artikel anlegen, bearbeiten und verwalten."
            emoji="📰"
            to="/admin/articles"
            navigate={navigate}
          />

          <NavCard
            title="Users"
            description="Nutzerliste & Verwaltung (später Rollen zuweisen)."
            emoji="👥"
            to="/admin/users"
            navigate={navigate}
          />

          <NavCard
            title="Permissions"
            description="Rollen & Rechte konfigurieren."
            emoji="🛡️"
            to="/admin/permissions"
            navigate={navigate}
          />
        </div>

        <div style={{ marginTop: 16, color: "var(--color-muted)", fontSize: 13 }}>
          Tipp: Du kannst die Cards auch mit Enter/Space öffnen (Keyboard support).
        </div>
      </div>
    </div>
  );
}
