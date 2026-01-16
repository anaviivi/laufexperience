// src/LandingPage.jsx
import React, { useState } from "react";
import { api } from "./api"; // setToken entfernt

const styles = {
  page: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "40px 24px 80px",
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "#ffffff",
    borderRadius: 24,
    padding: "32px 34px 30px",
    boxShadow: "0 18px 45px rgba(15,23,42,0.18)",
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  field: {
    marginBottom: 16,
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    fontSize: 14,
    background: "white",
    outline: "none",
  },
  button: {
    marginTop: 10,
    width: "100%",
    padding: "11px 16px",
    borderRadius: 8,
    border: "none",
    background: "#0b1e32",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  helperRow: {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  link: {
    color: "#0b1e32",
    fontWeight: 500,
    textDecoration: "underline",
    cursor: "pointer",
  },
};

export default function LandingPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    birthYear: "",
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1) Request an Backend schicken
      const data = await api("/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          // birthYear kannst du bei Bedarf später auch in der DB speichern
        }),
      });

      // data = { token, profile } (je nach Backend)

      // 2) Token optional direkt im localStorage speichern (kein setToken)
      if (data.token) {
        localStorage.setItem("laufx_token", data.token);
      }

      // 3) Profil aus Antwort so mappen, dass dein Frontend es kennt
      const p = data.profile || {};
      const mappedProfile = {
        name: p.name || "Runner",
        email: p.email || form.email,
        bio: p.bio || "",
        goalType: p.goal_type || "10k",
        weeklyKm: String(p.weekly_km ?? 25),
        unit: p.unit || "km",
        language: p.language || "de",
        aiCoachTips: !!p.ai_coach_tips,
        newsletter: !!p.newsletter,
        avatar: p.avatar || "",
      };

      // 4) Profil in localStorage legen
      localStorage.setItem("laufx_profile", JSON.stringify(mappedProfile));

      // Header/Layout informieren, damit Avatar usw. neu geladen werden
      window.dispatchEvent(new Event("laufx_profile_updated"));

      // 5) Weiter auf's Dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      alert("Registrierung fehlgeschlagen: " + err.message);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Create New Account</h1>
        <p style={styles.subtitle}>
          Already registered?{" "}
          <span
            style={styles.link}
            onClick={() => (window.location.href = "/login")}
          >
            Login
          </span>
        </p>

        <div style={styles.field}>
          <div style={styles.label}>Name</div>
          <input
            style={styles.input}
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            placeholder="Dein Name"
            required
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Email</div>
          <input
            style={styles.input}
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="you@example.com"
            required
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Password</div>
          <input
            style={styles.input}
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            placeholder="••••••••"
            required
          />
        </div>

        <div style={styles.field}>
          <div style={styles.label}>Date of birth</div>
          <select
            style={styles.select}
            value={form.birthYear}
            onChange={handleChange("birthYear")}
            required
          >
            <option value="">Select year</option>
            {Array.from({ length: 70 }).map((_, i) => {
              const year = 2007 - i; // z.B. 2007–1938
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
        </div>

        <button type="submit" style={styles.button}>
          SIGN UP
        </button>

        <div style={styles.helperRow}>
          By signing up you agree to our{" "}
          <span style={styles.link}>Terms</span> &amp;{" "}
          <span style={styles.link}>Privacy Policy</span>.
        </div>
      </form>
    </div>
  );
}
import { syncProfileToLocalStorage } from "./authProfile";
