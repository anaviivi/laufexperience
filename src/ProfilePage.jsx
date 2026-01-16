import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "./LanguageContext.jsx";
import { supabase } from "./supabaseClient";

const STORAGE_KEY = "laufx_profile";
const COACH_KEY = "laufx_coach_profile";
const PROFILE_UPDATED_EVENT = "laufx_profile_updated";

// ✅ Deine GLB-Dateien (in public/models ablegen)
const MODEL_SRC = {
  female: "/models/easy_run_woman.glb",
  male: "/models/easy_run_man.glb",
};

// -------- Texte --------
const texts = {
  de: {
    pageTitle: "Dein Profil",

    sectionBasics: "Basisdaten",
    sectionGoals: "Laufziele",
    sectionSettings: "Einstellungen",
    sectionCoach: "KI-Coach Profil",

    nameLabel: "Name",
    namePlaceholder: "Dein Name",
    emailLabel: "E-Mail",
    emailPlaceholder: "you@example.com",
    bioLabel: "Kurzprofil / Bio",
    bioPlaceholder: "z.B. 'Laufe seit 2 Jahren, Ziel: Halbmarathon im Herbst.'",

    genderLabel: "Geschlecht",
    genderFemale: "Weiblich",
    genderMale: "Männlich",

    goalTypeLabel: "Ziel-Distanz",
    weeklyKmLabel: "Wunsch-Umfang pro Woche",
    weeklyKmPlaceholder: "z.B. 30",

    unitLabel: "Einheiten",
    unitKm: "Kilometer",
    unitMi: "Meilen",

    languageLabel: "Sprache",
    languageDe: "Deutsch",
    languageEn: "English",

    saveButton: "Speichern",
    saving: "Speichert…",
    unsavedChanges: "Änderungen nicht gespeichert",
    lastSavedPrefix: "Zuletzt gespeichert:",
    noSaveYet: "Noch keine Speicherung",

    avatarUploadLabel: "Profilbild ändern",
    pickFromGallery: "Bild aus Galerie wählen",
    removeAvatar: "Bild entfernen",

    notLoggedIn: "Nicht eingeloggt (speichere lokal).",

    // Coach
    coachSubtitle: "Damit der Coach Training + Ernährung besser personalisieren kann.",
    levelLabel: "Level",
    levelBeginner: "Beginner",
    levelIntermediate: "Fortgeschritten",
    levelAdvanced: "Sehr erfahren",

    heightLabel: "Größe (cm)",
    weightLabel: "Gewicht (kg)",
    goalWeightLabel: "Zielgewicht (optional)",

    nutritionLabel: "Ernährungsstil",
    nutritionOmni: "Gemischt",
    nutritionVegetarian: "Vegetarisch",
    nutritionVegan: "Vegan",
    nutritionLowCarb: "Low-Carb",
    nutritionKeto: "Keto",
    nutritionOther: "Andere",

    runsPerWeekLabel: "Läufe pro Woche",
    longRunDayLabel: "Longrun-Tag",
    longRunDayAny: "Egal",
    longRunDaySat: "Samstag",
    longRunDaySun: "Sonntag",

    preferredTimeLabel: "Bevorzugte Tageszeit",
    timeMorning: "Morgens",
    timeNoon: "Mittags",
    timeEvening: "Abends",
    timeFlexible: "Flexibel",

    eatingGoalLabel: "Ernährungsziel",
    eatingGoalLose: "Abnehmen",
    eatingGoalMaintain: "Gewicht halten",
    eatingGoalGain: "Zunehmen / Aufbau",
    eatingGoalPerformance: "Performance",

    injuriesLabel: "Verletzungen / Einschränkungen",
    injuriesPlaceholder: "z.B. Knie, Achillessehne, Rücken …",
    notesLabel: "Notizen für den Coach",
    notesPlaceholder: "z.B. Schichtdienst, viel Stress, Schlaf, Allergien …",
  },
  en: {
    pageTitle: "Your profile",

    sectionBasics: "Basic info",
    sectionGoals: "Running goals",
    sectionSettings: "Settings",
    sectionCoach: "AI Coach profile",

    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    bioLabel: "Short bio",
    bioPlaceholder: "e.g. 'Running for 2 years, goal: half marathon in autumn.'",

    genderLabel: "Gender",
    genderFemale: "Female",
    genderMale: "Male",

    goalTypeLabel: "Target distance",
    weeklyKmLabel: "Desired weekly volume",
    weeklyKmPlaceholder: "e.g. 30",

    unitLabel: "Units",
    unitKm: "Kilometers",
    unitMi: "Miles",

    languageLabel: "Language",
    languageDe: "Deutsch",
    languageEn: "English",

    saveButton: "Save",
    saving: "Saving…",
    unsavedChanges: "Changes not saved yet",
    lastSavedPrefix: "Last saved:",
    noSaveYet: "Not saved yet",

    avatarUploadLabel: "Change profile picture",
    pickFromGallery: "Choose from gallery",
    removeAvatar: "Remove picture",

    notLoggedIn: "Not logged in (saving locally).",

    // Coach
    coachSubtitle: "So the coach can personalize training & nutrition.",
    levelLabel: "Level",
    levelBeginner: "Beginner",
    levelIntermediate: "Intermediate",
    levelAdvanced: "Advanced",

    heightLabel: "Height (cm)",
    weightLabel: "Weight (kg)",
    goalWeightLabel: "Target weight (optional)",

    nutritionLabel: "Nutrition style",
    nutritionOmni: "Omnivore",
    nutritionVegetarian: "Vegetarian",
    nutritionVegan: "Vegan",
    nutritionLowCarb: "Low-carb",
    nutritionKeto: "Keto",
    nutritionOther: "Other",

    runsPerWeekLabel: "Runs per week",
    longRunDayLabel: "Long run day",
    longRunDayAny: "Any",
    longRunDaySat: "Saturday",
    longRunDaySun: "Sunday",

    preferredTimeLabel: "Preferred time of day",
    timeMorning: "Morning",
    timeNoon: "Noon",
    timeEvening: "Evening",
    timeFlexible: "Flexible",

    eatingGoalLabel: "Nutrition goal",
    eatingGoalLose: "Lose weight",
    eatingGoalMaintain: "Maintain",
    eatingGoalGain: "Gain / build",
    eatingGoalPerformance: "Performance",

    injuriesLabel: "Injuries / limitations",
    injuriesPlaceholder: "e.g. knee, Achilles, back …",
    notesLabel: "Notes for the coach",
    notesPlaceholder: "e.g. shift work, stress, sleep, allergies …",
  },
};

const defaultProfile = {
  name: "Runner",
  email: "",
  bio: "",
  gender: "female", // female | male
  goalType: "10k",
  weeklyKm: "25",
  unit: "km",
  language: "de",
  avatar: "", // base64
};

const defaultCoach = {
  level: "beginner", // beginner | intermediate | advanced
  heightCm: "",
  weightKg: "",
  goalWeightKg: "",
  nutrition: "omni",
  eatingGoal: "performance",
  runsPerWeek: "3",
  longRunDay: "any",
  preferredTime: "flexible",
  injuries: "",
  notes: "",
};

function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function normalizeGender(g) {
  return g === "male" ? "male" : "female";
}

function clampNumber(n, min, max) {
  if (n == null || Number.isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function toNumberOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function broadcastProfileUpdated() {
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

// ---- load model-viewer script once ----
function ensureModelViewer() {
  if (typeof window === "undefined") return;
  if (window.customElements?.get?.("model-viewer")) return;

  const existing = document.querySelector('script[data-model-viewer="1"]');
  if (existing) return;

  const s = document.createElement("script");
  s.type = "module";
  s.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
  s.dataset.modelViewer = "1";
  document.head.appendChild(s);
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={styles.sectionHeader}>
      <div style={styles.sectionTitle}>{title}</div>
      {subtitle ? <div style={styles.sectionSubtitle}>{subtitle}</div> : null}
    </div>
  );
}

function ModelFigure({ gender, language }) {
  const src = MODEL_SRC[gender] || MODEL_SRC.female;

  return (
    <div style={styles.modelCard} aria-label={language === "de" ? "3D Figur" : "3D model"}>
      <div style={styles.modelCardTop}>
        <div style={styles.modelCardLabel}>3D FIGUR</div>
        <div style={styles.modelCardTag}>
          {gender === "male"
            ? language === "de"
              ? "männlich"
              : "male"
            : language === "de"
            ? "weiblich"
            : "female"}
        </div>
      </div>

      <div style={styles.modelWrap}>
        {/* @ts-ignore */}
        <model-viewer
          src={src}
          camera-controls
          auto-rotate
          rotation-per-second="16deg"
          interaction-prompt="none"
          bounds="tight"
          exposure="1"
          environment-image="neutral"
          style={styles.modelViewer}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { language, setLanguage } = useLanguage();
  const t = texts[language] || texts.de;

  const [profile, setProfile] = useState(() => {
    const fromLS = safeJsonParse(localStorage.getItem(STORAGE_KEY), null);
    return { ...defaultProfile, ...(fromLS || {}), gender: normalizeGender(fromLS?.gender) };
  });

  const [coach, setCoach] = useState(() => {
    const fromLS = safeJsonParse(localStorage.getItem(COACH_KEY), null);
    return { ...defaultCoach, ...(fromLS || {}) };
  });

  const [savedSnapshot, setSavedSnapshot] = useState(() => {
    const fromLS = safeJsonParse(localStorage.getItem(STORAGE_KEY), null);
    return { ...defaultProfile, ...(fromLS || {}), gender: normalizeGender(fromLS?.gender) };
  });

  const [savedCoachSnapshot, setSavedCoachSnapshot] = useState(() => {
    const fromLS = safeJsonParse(localStorage.getItem(COACH_KEY), null);
    return { ...defaultCoach, ...(fromLS || {}) };
  });

  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorBox, setErrorBox] = useState("");
  const [saveToast, setSaveToast] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [focused, setFocused] = useState(null);

  const fileRef = useRef(null);

  const dirty = useMemo(
    () =>
      JSON.stringify(profile) !== JSON.stringify(savedSnapshot) ||
      JSON.stringify(coach) !== JSON.stringify(savedCoachSnapshot),
    [profile, savedSnapshot, coach, savedCoachSnapshot]
  );

  const initials = useMemo(() => {
    return (
      profile.name
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || "LX"
    );
  }, [profile.name]);

  // Load model-viewer
  useEffect(() => {
    ensureModelViewer();
  }, []);

  // ---------- Auth sync ----------
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    let unsub = null;
    let alive = true;

    async function initAuth() {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSessionUser(data?.session?.user ?? null);

      const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
        setSessionUser(sess?.user ?? null);
      });
      unsub = sub?.subscription;
    }

    initAuth();
    return () => {
      alive = false;
      unsub?.unsubscribe?.();
    };
  }, []);

  // ---------- LOAD aus Supabase user_profiles ----------
  useEffect(() => {
    let alive = true;

    async function loadFromSupabase() {
      setErrorBox("");
      setSaveNote("");

      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (!user) return;

      const { data: row, error } = await supabase
        .from("user_profiles")
        .select("id, name, email, bio, gender, avatar, language")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Supabase load error:", error);
        if (!alive) return;
        setSaveNote(language === "de"
          ? "Online-Laden nicht möglich – nutze lokale Daten."
          : "Could not load online — using local data."
        );
        return;
      }

      const merged = {
        ...defaultProfile,
        ...profile,
        name: row?.name ?? profile.name,
        email: row?.email ?? profile.email ?? user.email ?? "",
        bio: row?.bio ?? profile.bio,
        gender: normalizeGender(row?.gender ?? profile.gender),
        avatar: row?.avatar ?? profile.avatar,
        language: row?.language ?? profile.language,
      };

      if (!alive) return;

      setProfile(merged);
      setSavedSnapshot(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));

      // coach stays local (safe)
      localStorage.setItem(COACH_KEY, JSON.stringify(coach));

      if (merged.language && merged.language !== language) {
        setLanguage(merged.language);
      }

      broadcastProfileUpdated();
    }

    loadFromSupabase();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Handlers ----------
  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setProfile((p) => ({ ...p, [field]: value }));
    if (field === "language") setLanguage(value);
  };

  const handleCoachChange = (field) => (e) => {
    const value = e.target.value;
    setCoach((c) => ({ ...c, [field]: value }));
  };

  const setGender = (gender) => {
    setProfile((p) => ({ ...p, gender: normalizeGender(gender) }));
  };

  const pickAvatar = () => fileRef.current?.click();

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const errText = (language === "de")
      ? { notImg: "Bitte eine Bilddatei auswählen.", tooLarge: "Bild ist zu groß (max. ~2.5MB).", readFail: "Bild konnte nicht gelesen werden." }
      : { notImg: "Please choose an image file.", tooLarge: "Image too large (max ~2.5MB).", readFail: "Could not read image." };

    if (!file.type.startsWith("image/")) {
      setErrorBox(errText.notImg);
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      setErrorBox(errText.tooLarge);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p) => ({ ...p, avatar: String(reader.result || "") }));
      setErrorBox("");
    };
    reader.onerror = () => setErrorBox(errText.readFail);
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const removeAvatar = () => setProfile((p) => ({ ...p, avatar: "" }));

  // ---------- SAVE ----------
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setErrorBox("");
    setSaveNote("");

    // Normalize numbers
    const wk = clampNumber(toNumberOrNull(profile.weeklyKm), 0, 300);
    const storedProfile = { ...profile, weeklyKm: String(wk ?? 0), gender: normalizeGender(profile.gender) };

    const height = clampNumber(toNumberOrNull(coach.heightCm), 80, 250);
    const weight = clampNumber(toNumberOrNull(coach.weightKg), 20, 300);
    const goalWeight = clampNumber(toNumberOrNull(coach.goalWeightKg), 20, 300);
    const runs = clampNumber(toNumberOrNull(coach.runsPerWeek), 0, 14);

    const storedCoach = {
      ...coach,
      heightCm: height == null ? "" : String(height),
      weightKg: weight == null ? "" : String(weight),
      goalWeightKg: goalWeight == null ? "" : String(goalWeight),
      runsPerWeek: runs == null ? "" : String(runs),
    };

    // always keep local
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedProfile));
    localStorage.setItem(COACH_KEY, JSON.stringify(storedCoach));

    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;

    // not logged in => local only
    if (!user) {
      setProfile(storedProfile);
      setCoach(storedCoach);
      setSavedSnapshot(storedProfile);
      setSavedCoachSnapshot(storedCoach);
      setLastSaved(new Date());
      broadcastProfileUpdated();
      setSaveNote(language === "de" ? "Lokal gespeichert." : "Saved locally.");
      setSaveToast(language === "de" ? "Gespeichert" : "Saved");
      setTimeout(() => setSaveToast(""), 1800);
      setSaving(false);
      return;
    }

    const dbPayload = {
      id: user.id,
      name: storedProfile.name,
      email: storedProfile.email || user.email || "",
      bio: storedProfile.bio,
      gender: storedProfile.gender,
      avatar: storedProfile.avatar,
      language: storedProfile.language,
    };

    const { error } = await supabase.from("user_profiles").upsert(dbPayload, { onConflict: "id" });

    if (error) {
      console.error("Supabase save error:", error);
      setSaveNote(
        language === "de"
          ? "Online-Speichern nicht möglich – lokal gespeichert."
          : "Could not save online — saved locally."
      );
    } else {
      setSaveNote(language === "de" ? "Online gespeichert." : "Saved online.");
    }

    setProfile(storedProfile);
    setCoach(storedCoach);
    setSavedSnapshot(storedProfile);
    setSavedCoachSnapshot(storedCoach);
    setLastSaved(new Date());
    broadcastProfileUpdated();
    setSaveToast(language === "de" ? "Gespeichert" : "Saved");
    setTimeout(() => setSaveToast(""), 1800);
    setSaving(false);
  };

  const fieldStyle = (key, base) => ({
    ...base,
    ...(focused === key ? styles.focusRing : null),
  });

  const responsiveCss = `
    .lx-twoCol { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 16px; }
    @media (max-width: 980px) {
      .lx-hero { grid-template-columns: 1fr; }
      .lx-twoCol { grid-template-columns: 1fr; }
      .lx-modelCard { width: 100% !important; }
    }
    @media (max-width: 560px) {
      .lx-heroLeft { grid-template-columns: 62px 1fr; }
      .lx-grid2 { grid-template-columns: 1fr !important; }
      .lx-grid3 { grid-template-columns: 1fr !important; }
    }
  `;

  return (
    <div style={styles.page}>
      <style>{responsiveCss}</style>

      <div style={styles.layout}>
        <section style={styles.card}>
          <div style={styles.topRow}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, minWidth: 0 }}>
              <h1 style={styles.pageTitle}>{t.pageTitle}</h1>
              {sessionUser ? (
                <span style={styles.okPill}>{language === "de" ? "Eingeloggt" : "Signed in"}</span>
              ) : (
                <span style={styles.warnPill}>{language === "de" ? "Nicht eingeloggt" : "Not signed in"}</span>
              )}
            </div>
          </div>

          {errorBox ? <div style={styles.errorBox}>{errorBox}</div> : null}

          {/* HERO */}
          <div className="lx-hero" style={styles.hero}>
            <div className="lx-heroLeft" style={styles.heroLeft}>
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" style={styles.avatarImage} />
              ) : (
                <div style={styles.avatarFallback}>{initials}</div>
              )}

              <div style={styles.heroContent}>
                <div style={styles.heroName}>{profile.name}</div>
                <div style={styles.heroMail}>{profile.email || "—"}</div>

                <div style={styles.heroActions}>
                  <button type="button" style={styles.btnPrimarySmall} onClick={pickAvatar}>
                    {t.pickFromGallery}
                  </button>
                  <button
                    type="button"
                    style={{ ...styles.btnGhostSmall, ...(profile.avatar ? null : { opacity: 0.55, cursor: "not-allowed" }) }}
                    onClick={removeAvatar}
                    disabled={!profile.avatar}
                  >
                    {t.removeAvatar}
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: "none" }}
                  />
                </div>

                <div style={styles.heroHint}>{t.avatarUploadLabel}</div>
              </div>
            </div>

            <div style={styles.heroRight}>
              <div className="lx-modelCard" style={styles.modelCard}>
                <ModelFigure gender={profile.gender} language={language} />
              </div>
            </div>
          </div>

          {/* 2-column content */}
          <div className="lx-twoCol" style={styles.twoCol}>
            {/* LEFT */}
            <div style={styles.panel}>
              <SectionHeader
                title={t.sectionBasics}
                subtitle={language === "de" ? "Die wichtigsten Infos zu dir" : "The basics"}
              />

              <div className="lx-grid2" style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>{t.nameLabel}</div>
                  <input
                    style={fieldStyle("name", styles.input)}
                    value={profile.name}
                    onChange={handleChange("name")}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                    placeholder={t.namePlaceholder}
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>{t.emailLabel}</div>
                  <input
                    style={fieldStyle("email", styles.input)}
                    value={profile.email}
                    onChange={handleChange("email")}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    type="email"
                    placeholder={t.emailPlaceholder}
                  />
                </div>
              </div>

              <div className="lx-grid2" style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>{t.genderLabel}</div>
                  <div style={styles.segmented} role="radiogroup" aria-label={t.genderLabel}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={profile.gender === "female"}
                      style={styles.segBtn(profile.gender === "female")}
                      onClick={() => setGender("female")}
                    >
                      {t.genderFemale}
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={profile.gender === "male"}
                      style={styles.segBtn(profile.gender === "male")}
                      onClick={() => setGender("male")}
                    >
                      {t.genderMale}
                    </button>
                  </div>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>{t.bioLabel}</div>
                  <textarea
                    style={fieldStyle("bio", styles.textarea)}
                    value={profile.bio}
                    onChange={handleChange("bio")}
                    onFocus={() => setFocused("bio")}
                    onBlur={() => setFocused(null)}
                    placeholder={t.bioPlaceholder}
                  />
                </div>
              </div>

              <SectionHeader
                title={t.sectionGoals}
                subtitle={language === "de" ? "Damit Trainingspläne besser passen" : "For better plans"}
              />

              <div className="lx-grid2" style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>{t.goalTypeLabel}</div>
                  <select
                    style={fieldStyle("goalType", styles.select)}
                    value={profile.goalType}
                    onChange={handleChange("goalType")}
                    onFocus={() => setFocused("goalType")}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="5k">5 km</option>
                    <option value="10k">10 km</option>
                    <option value="hm">{language === "de" ? "Halbmarathon" : "Half marathon"}</option>
                    <option value="mara">Marathon</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>{t.weeklyKmLabel}</div>
                  <input
                    style={fieldStyle("weeklyKm", styles.input)}
                    value={profile.weeklyKm}
                    onChange={handleChange("weeklyKm")}
                    onFocus={() => setFocused("weeklyKm")}
                    onBlur={() => setFocused(null)}
                    type="number"
                    min="0"
                    max="300"
                    placeholder={t.weeklyKmPlaceholder}
                  />
                </div>
              </div>

              <SectionHeader
                title={t.sectionSettings}
                subtitle={language === "de" ? "Deine App-Vorlieben" : "Preferences"}
              />

              <div className="lx-grid2" style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>{t.unitLabel}</div>
                  <select
                    style={fieldStyle("unit", styles.select)}
                    value={profile.unit}
                    onChange={handleChange("unit")}
                    onFocus={() => setFocused("unit")}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="km">{t.unitKm}</option>
                    <option value="mi">{t.unitMi}</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>{t.languageLabel}</div>
                  <select
                    style={fieldStyle("language", styles.select)}
                    value={profile.language}
                    onChange={handleChange("language")}
                    onFocus={() => setFocused("language")}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="de">{t.languageDe}</option>
                    <option value="en">{t.languageEn}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={styles.panel}>
              <SectionHeader title={t.sectionCoach} subtitle={t.coachSubtitle} />

              <div className="lx-grid2" style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>{t.levelLabel}</div>
                  <select
                    style={fieldStyle("coach_level", styles.select)}
                    value={coach.level}
                    onChange={handleCoachChange("level")}
                    onFocus={() => setFocused("coach_level")}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="beginner">{t.levelBeginner}</option>
                    <option value="intermediate">{t.levelIntermediate}</option>
                    <option value="advanced">{t.levelAdvanced}</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>{t.nutritionLabel}</div>
                  <select
                    style={fieldStyle("coach_nutrition", styles.select)}
                    value={coach.nutrition}
                    onChange={handleCoachChange("nutrition")}
                    onFocus={() => setFocused("coach_nutrition")}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="omni">{t.nutritionOmni}</option>
                    <option value="vegetarian">{t.nutritionVegetarian}</option>
                    <option value="vegan">{t.nutritionVegan}</option>
                    <option value="lowcarb">{t.nutritionLowCarb}</option>
                    <option value="keto">{t.nutritionKeto}</option>
                    <option value="other">{t.nutritionOther}</option>
                  </select>
                </div>
              </div>

              <div className="lx-grid3" style={styles.grid3}>
                <div style={styles.field}>
                  <div style={styles.label}>{t.heightLabel}</div>
                  <input
                    style={fieldStyle("coach_height", styles.input)}
                    value={coach.heightCm}
                    onChange={handleCoachChange("heightCm")}
                    onFocus={() => setFocused("coach_height")}
                    onBlur={() => setFocused(null)}
                    type="number"
                    min="80"
                    max="250"
                    placeholder={language === "de" ? "z.B. 176" : "e.g. 176"}
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>{t.weightLabel}</div>
                  <input
                    style={fieldStyle("coach_weight", styles.input)}
                    value={coach.weightKg}
                    onChange={handleCoachChange("weightKg")}
                    onFocus={() => setFocused("coach_weight")}
                    onBlur={() => setFocused(null)}
                    type="number"
                    min="20"
                    max="300"
                    placeholder={language === "de" ? "z.B. 72" : "e.g. 72"}
                  />
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>{t.goalWeightLabel}</div>
                  <input
                    style={fieldStyle("coach_goalweight", styles.input)}
                    value={coach.goalWeightKg}
                    onChange={handleCoachChange("goalWeightKg")}
                    onFocus={() => setFocused("coach_goalweight")}
                    onBlur={() => setFocused(null)}
                    type="number"
                    min="20"
                    max="300"
                    placeholder={language === "de" ? "z.B. 68" : "e.g. 68"}
                  />
                </div>
              </div>

              <div className="lx-grid2" style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>{t.eatingGoalLabel}</div>
                  <select
                    style={fieldStyle("coach_eatinggoal", styles.select)}
                    value={coach.eatingGoal}
                    onChange={handleCoachChange("eatingGoal")}
                    onFocus={() => setFocused("coach_eatinggoal")}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="lose">{t.eatingGoalLose}</option>
                    <option value="maintain">{t.eatingGoalMaintain}</option>
                    <option value="gain">{t.eatingGoalGain}</option>
                    <option value="performance">{t.eatingGoalPerformance}</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>{t.runsPerWeekLabel}</div>
                  <input
                    style={fieldStyle("coach_runs", styles.input)}
                    value={coach.runsPerWeek}
                    onChange={handleCoachChange("runsPerWeek")}
                    onFocus={() => setFocused("coach_runs")}
                    onBlur={() => setFocused(null)}
                    type="number"
                    min="0"
                    max="14"
                    placeholder={language === "de" ? "z.B. 4" : "e.g. 4"}
                  />
                </div>
              </div>

              <div className="lx-grid2" style={styles.grid2}>
                <div style={styles.field}>
                  <div style={styles.label}>{t.longRunDayLabel}</div>
                  <select
                    style={fieldStyle("coach_longrun", styles.select)}
                    value={coach.longRunDay}
                    onChange={handleCoachChange("longRunDay")}
                    onFocus={() => setFocused("coach_longrun")}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="any">{t.longRunDayAny}</option>
                    <option value="sat">{t.longRunDaySat}</option>
                    <option value="sun">{t.longRunDaySun}</option>
                  </select>
                </div>

                <div style={styles.field}>
                  <div style={styles.label}>{t.preferredTimeLabel}</div>
                  <select
                    style={fieldStyle("coach_time", styles.select)}
                    value={coach.preferredTime}
                    onChange={handleCoachChange("preferredTime")}
                    onFocus={() => setFocused("coach_time")}
                    onBlur={() => setFocused(null)}
                  >
                    <option value="morning">{t.timeMorning}</option>
                    <option value="noon">{t.timeNoon}</option>
                    <option value="evening">{t.timeEvening}</option>
                    <option value="flexible">{t.timeFlexible}</option>
                  </select>
                </div>
              </div>

              <div style={styles.field}>
                <div style={styles.label}>{t.injuriesLabel}</div>
                <input
                  style={fieldStyle("coach_injuries", styles.input)}
                  value={coach.injuries}
                  onChange={handleCoachChange("injuries")}
                  onFocus={() => setFocused("coach_injuries")}
                  onBlur={() => setFocused(null)}
                  placeholder={t.injuriesPlaceholder}
                />
              </div>

              <div style={styles.field}>
                <div style={styles.label}>{t.notesLabel}</div>
                <textarea
                  style={fieldStyle("coach_notes", styles.textarea)}
                  value={coach.notes}
                  onChange={handleCoachChange("notes")}
                  onFocus={() => setFocused("coach_notes")}
                  onBlur={() => setFocused(null)}
                  placeholder={t.notesPlaceholder}
                />
              </div>
            </div>
          </div>

          {/* SAVE */}
          <div style={styles.saveRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {dirty ? <span style={styles.unsavedPill}>{t.unsavedChanges}</span> : null}
              {saveToast ? <span style={styles.toast}>{saveToast}</span> : null}
              {saveNote ? <span style={styles.saveMetaMuted}>{saveNote}</span> : null}

              {!dirty ? (
                lastSaved ? (
                  <span style={styles.saveMeta}>
                    {t.lastSavedPrefix}{" "}
                    {lastSaved.toLocaleTimeString(language === "de" ? "de-DE" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <span style={styles.saveMetaMuted}>{t.noSaveYet}</span>
                )
              ) : (
                <span style={styles.saveMetaMuted}>{language === "de" ? "Änderungen bereit." : "Ready to save."}</span>
              )}
            </div>

            <button style={styles.saveBtn(dirty)} onClick={handleSave} disabled={saving || !dirty}>
              {saving ? t.saving : t.saveButton}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// -------- Styles --------
const styles = {
  page: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "34px 20px 80px",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "var(--color-text)",
  },
  layout: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 22 },

  card: {
    background: "linear-gradient(180deg, var(--color-card) 0%, var(--color-soft) 100%)",
    borderRadius: 28,
    padding: 26,
    boxShadow: "var(--color-panelShadow)",
    border: "1px solid var(--color-borderSubtle)",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  pageTitle: { fontSize: 22, fontWeight: 900, letterSpacing: -0.2, margin: 0 },

  okPill: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(16,185,129,0.22)",
    color: "var(--color-text)",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  warnPill: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(244,63,94,0.10)",
    border: "1px solid rgba(244,63,94,0.18)",
    color: "var(--color-text)",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  errorBox: {
    marginBottom: 14,
    padding: "12px 14px",
    borderRadius: 16,
    background: "linear-gradient(180deg, rgba(244,63,94,0.12), rgba(244,63,94,0.06))",
    border: "1px solid rgba(244,63,94,0.22)",
    color: "var(--color-text)",
    fontSize: 13,
    lineHeight: 1.35,
  },

  // Hero (bewusst wie eine "Hero"-Fläche – funktioniert in light & dark)
  hero: {
    borderRadius: 22,
    padding: 18,
    background:
      "radial-gradient(1200px 420px at 30% 20%, rgba(255,255,255,0.12), rgba(255,255,255,0) 55%), linear-gradient(135deg,#071a2c 0%, #1d4ed8 55%, #1e3a8a 100%)",
    color: "#fff",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 16,
    alignItems: "center",
    marginBottom: 18,
    overflow: "hidden",
  },
  heroLeft: {
    display: "grid",
    gridTemplateColumns: "68px 1fr",
    gap: 14,
    alignItems: "center",
    minWidth: 0,
  },
  heroRight: { display: "grid", placeItems: "center" },

  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 999,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.18)",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
    fontSize: 20,
    letterSpacing: 0.5,
    boxShadow: "0 18px 35px rgba(0,0,0,0.22)",
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 999,
    objectFit: "cover",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 18px 35px rgba(0,0,0,0.22)",
  },
  heroName: {
    fontSize: 18,
    fontWeight: 950,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  heroMail: {
    marginTop: 4,
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  heroContent: { minWidth: 0, textAlign: "left" },

  heroActions: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },
  btnPrimarySmall: {
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.12)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
  },
  btnGhostSmall: {
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontWeight: 900,
    fontSize: 12,
    cursor: "pointer",
  },
  heroHint: { marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.70)" },

  // 3D card
  modelCard: { width: 280 },
  modelCardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modelCardLabel: { fontSize: 12, letterSpacing: 1.4, fontWeight: 950, color: "rgba(255,255,255,0.90)" },
  modelCardTag: { fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.78)" },
  modelWrap: {
    width: "100%",
    height: 190,
    borderRadius: 16,
    background: "linear-gradient(180deg, rgba(15,23,42,0.40), rgba(15,23,42,0.62))",
    border: "1px solid rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  modelViewer: { width: "100%", height: "100%", cursor: "grab" },

  sectionHeader: { marginTop: 10, marginBottom: 14, display: "flex", flexDirection: "column", gap: 4 },
  sectionTitle: { fontSize: 14, fontWeight: 950, color: "var(--color-text)" },
  sectionSubtitle: { fontSize: 13, color: "var(--color-muted)", lineHeight: 1.25 },

  twoCol: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, marginTop: 10 },
  panel: {
    borderRadius: 22,
    border: "1px solid var(--color-panelBorder)",
    background: "var(--color-panelBg)",
    color: "var(--color-panelText)",
    padding: 18,
    boxShadow: "var(--color-panelShadow)",
    minWidth: 0,
  },

  grid2: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 },

  field: { marginBottom: 14, minWidth: 0 },
  label: { fontSize: 12, color: "var(--color-muted)", marginBottom: 6, fontWeight: 850 },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid var(--color-border)",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    background: "var(--color-card)",
    color: "var(--color-text)",
  },
  textarea: {
    width: "100%",
    minHeight: 96,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid var(--color-border)",
    fontSize: 15,
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    background: "var(--color-card)",
    color: "var(--color-text)",
    lineHeight: 1.35,
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid var(--color-border)",
    fontSize: 15,
    outline: "none",
    background: "var(--color-card)",
    color: "var(--color-text)",
    appearance: "none",
  },
  focusRing: { borderColor: "rgba(37,99,235,0.60)", boxShadow: "0 0 0 4px rgba(37,99,235,0.14)" },

  segmented: {
    display: "inline-flex",
    border: "1px solid var(--color-border)",
    borderRadius: 14,
    overflow: "hidden",
    background: "var(--color-soft)",
    padding: 2,
    gap: 2,
  },
  segBtn: (active) => ({
    border: "none",
    padding: "9px 12px",
    fontSize: 13,
    cursor: "pointer",
    background: active ? "linear-gradient(135deg,#2563eb,#1e40af)" : "transparent",
    color: active ? "#ffffff" : "var(--color-text)",
    fontWeight: 950,
    borderRadius: 12,
  }),

  saveRow: {
    marginTop: 18,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  unsavedPill: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "linear-gradient(180deg, rgba(245,158,11,0.18), rgba(245,158,11,0.08))",
    color: "var(--color-text)",
    fontWeight: 950,
    fontSize: 12,
    border: "1px solid rgba(245,158,11,0.24)",
  },
  toast: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(16,185,129,0.14)",
    border: "1px solid rgba(16,185,129,0.24)",
    color: "var(--color-text)",
    fontWeight: 950,
    fontSize: 12,
  },
  saveMeta: { fontSize: 12, color: "var(--color-muted)", fontWeight: 850 },
  saveMetaMuted: { fontSize: 12, color: "var(--color-muted)", opacity: 0.7, fontWeight: 800 },
  saveBtn: (isDirty) => ({
    padding: "10px 16px",
    borderRadius: 16,
    border: "1px solid var(--color-border)",
    background: isDirty ? "linear-gradient(135deg,#2563eb,#1e40af)" : "rgba(127,127,127,0.18)",
    color: isDirty ? "#ffffff" : "var(--color-muted)",
    fontWeight: 950,
    fontSize: 13,
    cursor: isDirty ? "pointer" : "not-allowed",
    boxShadow: isDirty ? "0 14px 28px rgba(37,99,235,0.22)" : "none",
  }),
};
