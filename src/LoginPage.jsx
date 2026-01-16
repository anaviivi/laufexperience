// src/LoginPage.jsx
import React, { useState } from "react";
import { api } from "./api"; // bleibt drin (falls du es später nutzt)
import { supabase } from "./supabaseClient";
import { syncProfileToLocalStorage } from "./authProfile";

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
  buttonDisabled: {
    opacity: 0.7,
    cursor: "default",
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
  errorBox: {
    marginTop: 12,
    padding: "8px 10px",
    borderRadius: 8,
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 13,
  },
};

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      
      await syncProfileToLocalStorage();
if (error) throw error;

      // ✅ robust: token aus response ODER nochmal Session holen
      let token = data?.session?.access_token || "";
      if (!token) {
        const { data: sData, error: sErr } = await supabase.auth.getSession();
        if (sErr) throw sErr;
        token = sData?.session?.access_token || "";
      }

      if (!token) {
        throw new Error("Login erfolgreich, aber kein access_token erhalten.");
      }

      // ✅ wichtig: Admin/API erwartet Bearer -> wir speichern unter access_token
      localStorage.setItem("access_token", token);
      localStorage.setItem("token", token); // optional/backward compatible

      // (Optional) Debug:
      // console.log("access_token saved:", localStorage.getItem("access_token")?.slice(0, 20), "...");

      // Profil minimal setzen (wie vorher)
      const apiData = { profile: { email: form.email } };
      const p = apiData.profile || {};
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

      await syncProfileToLocalStorage();
window.location.href = "/dashboard";
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>Login</h1>

        <p style={styles.subtitle}>
          Don't have an account?{" "}
          <span
            style={styles.link}
            onClick={() => (window.location.href = "/signup")}
          >
            Sign up
          </span>
        </p>

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

        <button
          type="submit"
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {}),
          }}
          disabled={loading}
        >
          {loading ? "Logging in..." : "LOGIN"}
        </button>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.helperRow}>
          Forgot your password? <span style={styles.link}>Reset</span>
        </div>
      </form>
    </div>
  );
}
