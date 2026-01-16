import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * --------------------------------------------------
 * Theme tokens (semantic)
 *
 * WICHTIG:
 * - bg/soft/card = generelle Flächen
 * - header*      = Header soll im Dark Mode dunkel bleiben
 * - panel*       = Dropdown/Popover/Kästen sollen grau/elevated wirken
 * - Alles wird zusätzlich als CSS-Variablen gesetzt: --color-*
 * --------------------------------------------------
 */
const THEMES = {
  light: {
    // Page surfaces
    bg: "#ffffff",
    soft: "#f6f7fb",

    // Common surfaces
    card: "#ffffff",
    card7ed: "#fffbeb",

    // Text
    text: "#0f172a",
    muted: "#64748b",

    // Lines
    border: "#e5e7eb",
    borderSubtle: "#f1f5f9",

    // Header (light)
    headerBg: "#ffffff",
    headerText: "#0f172a",
    headerBorder: "rgba(15, 23, 42, 0.08)",

    // Panels / Dropdowns (light) -> grau
    panelBg: "#f1f3f7",
    panelText: "#0f172a",
    panelBorder: "rgba(15, 23, 42, 0.10)",
    panelShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",

    // Misc
    onLight: "#0f172a",
    shadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
  },

  dark: {
    // Page surfaces
    bg: "#070a10",
    soft: "#0b0f15",

    // Common surfaces
    card: "#0f131a",
    card7ed: "#141925",

    // Text
    text: "#e6e9ef",
    muted: "#9aa4b2",

    // Lines
    border: "rgba(255,255,255,.10)",
    borderSubtle: "rgba(255,255,255,.06)",

    // ✅ Header bleibt wirklich dunkel
    headerBg: "#070a10",
    headerText: "#e6e9ef",
    headerBorder: "rgba(255,255,255,.10)",

    // ✅ Dropdown/Kästen: grau + elevated (sichtbar vom Header getrennt)
    panelBg: "#141a23",
    panelText: "#e6e9ef",
    panelBorder: "rgba(255,255,255,.12)",
    panelShadow: "0 22px 60px rgba(0,0,0,.65)",

    // Misc
    onLight: "#e6e9ef",
    shadow: "0 16px 40px rgba(0,0,0,.55)",
  },
};

const STORAGE_KEY = "theme";
const DEFAULT_THEME = "light";

/** @typedef {"light" | "dark"} ThemeName */

const ThemeContext = createContext(null);

/**
 * -----------------------------
 * Helpers
 * -----------------------------
 */
function isValidThemeName(value) {
  return value === "light" || value === "dark";
}

function getSystemTheme() {
  if (typeof window === "undefined") return null;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialTheme({ followSystem }) {
  if (typeof window === "undefined") return DEFAULT_THEME;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isValidThemeName(saved)) return saved;
  } catch {
    // ignore
  }

  if (followSystem) return getSystemTheme() ?? DEFAULT_THEME;
  return DEFAULT_THEME;
}

function applyCssVariables(themeName) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const colors = THEMES[themeName];

  // set CSS vars
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(`--color-${key}`, value);
  }

  // simple hook
  root.dataset.theme = themeName;

  // optional: help native widgets (scrollbar, form controls)
  root.style.colorScheme = themeName;
}

/**
 * -----------------------------
 * Provider
 * -----------------------------
 */
export function ThemeProvider({
  children,
  // Wenn true: folgt System-Theme nur dann, wenn der User noch nichts gespeichert hat
  followSystem = true,
} = {}) {
  const [theme, _setTheme] = useState(() => getInitialTheme({ followSystem }));
  const isDark = theme === "dark";

  const themeRef = useRef(theme);
  themeRef.current = theme;

  const colors = useMemo(() => THEMES[theme], [theme]);

  const setTheme = useCallback((next) => {
    _setTheme((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      return isValidThemeName(resolved) ? resolved : prev;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, [setTheme]);

  // Apply CSS vars + persist
  useEffect(() => {
    applyCssVariables(theme);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== theme) localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Sync theme across tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      if (!isValidThemeName(e.newValue)) return;
      if (e.newValue === themeRef.current) return;
      _setTheme(e.newValue);
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Follow system changes (only if no saved theme)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!followSystem) return;

    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    if (isValidThemeName(saved)) return; // respect user's saved choice

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;

    const onChange = () => {
      const systemTheme = mq.matches ? "dark" : "light";
      if (systemTheme !== themeRef.current) _setTheme(systemTheme);
    };

    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener?.(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener?.(onChange);
    };
  }, [followSystem]);

  const value = useMemo(
    () => ({
      theme,
      isDark,
      colors,
      setTheme,
      toggleTheme,
    }),
    [theme, isDark, colors, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * -----------------------------
 * Hook
 * -----------------------------
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>.");
  return ctx;
}
