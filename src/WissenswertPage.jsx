import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useLanguage } from "./LanguageContext.jsx";
import { useTheme } from "./ThemeContext.jsx";
const VISIBLE = 3;

/* ---------------- helpers ---------------- */

const stripHtml = (value = "") =>
  String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const decodeHtmlEntities = (value = "") => {
  if (typeof document === "undefined") return value;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const decodeHtmlEntitiesDeep = (value = "") => {
  let out = String(value);
  for (let i = 0; i < 3; i++) {
    const next = decodeHtmlEntities(out);
    if (next === out) break;
    out = next;
  }
  return out;
};

const cleanText = (value) => stripHtml(decodeHtmlEntitiesDeep(value));

/* ---------------- component ---------------- */

export default function WissenswertPage() {
  const { language: ctxLanguage } = useLanguage();
  const { colors, isDark } = useTheme();

  const styles = useMemo(() => createStyles({ colors, isDark }), [colors, isDark]);

  // Robust fallback: if UI toggle and Context get out of sync, prefer persisted value.
  // This prevents "DE toggle but English text" when the context is not updated yet.
  const storedLanguage =
    typeof window !== "undefined" ? window.localStorage.getItem("language") : null;

  const language =
    ctxLanguage === "de" || ctxLanguage === "en"
      ? ctxLanguage
      : storedLanguage === "de" || storedLanguage === "en"
        ? storedLanguage
        : "de";


  const TEXTS = {
    de: {
      pageTitle: "Wissenswertes",
      loading: "Lade Inhalte …",
      empty: "Noch keine veröffentlichten Artikel.",
      noTitle: "Ohne Titel",
      noImage: "Kein Bild",
      prev: "Zurück",
      next: "Weiter",
    },
    en: {
      pageTitle: "Knowledge",
      loading: "Loading content …",
      empty: "No published articles yet.",
      noTitle: "Untitled",
      noImage: "No image",
      prev: "Previous",
      next: "Next",
    },
  };

  const t = TEXTS[language] || TEXTS.de;

  const pickLang = useCallback(
    (de, en) => (language === "en" ? en || de || "" : de || en || ""),
    [language]
  );

  const [articles, setArticles] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ---------------- data load ---------------- */

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);

      const { data } = await supabase
        .from("articles")
        .select(
          `
          id,
          slug,
          title,
          title_de,
          title_en,
          subtitle,
          subtitle_de,
          subtitle_en,
          short_description,
          short_description_de,
          short_description_en,
          teaser,
          teaser_de,
          teaser_en,
          hero_image_url,
          is_published,
          deleted,
          sort_order,
          created_at
        `
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (!alive) return;
      setArticles(data || []);
      setIndex(0);
      setLoading(false);
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  /* ---------------- slider logic ---------------- */

  const hasSlider = articles.length > VISIBLE;

  const visibleArticles = useMemo(() => {
    if (!hasSlider) return articles;
    return Array.from({ length: VISIBLE }, (_, i) =>
      articles[(index + i) % articles.length]
    );
  }, [articles, index, hasSlider]);

  const prev = () =>
    setIndex((i) => (i - 1 + articles.length) % articles.length);

  const next = () => setIndex((i) => (i + 1) % articles.length);

  /* ---------------- render ---------------- */

  return (
    <section style={styles.page}>
      <h1 style={styles.h1}>{t.pageTitle}</h1>

      {loading && <p>{t.loading}</p>}

      {!loading && articles.length === 0 && <p>{t.empty}</p>}

      {!loading && articles.length > 0 && (
        <div style={styles.sliderWrap}>
          {hasSlider && (
            <button
              style={{ ...styles.arrow, ...styles.arrowLeft }}
              onClick={prev}
              aria-label={t.prev}
            >
              ←
            </button>
          )}

          <div style={styles.row}>
            {visibleArticles.map((a) => {
              const rawTitle =
                pickLang(a.title_de, a.title_en) || a.title || "";
              const rawSubtitle =
                pickLang(a.short_description_de, a.short_description_en) ||
                a.short_description ||
                pickLang(a.teaser_de, a.teaser_en) ||
                a.teaser ||
                pickLang(a.subtitle_de, a.subtitle_en) ||
                a.subtitle ||
                "";

              const title = cleanText(rawTitle) || t.noTitle;
              const subtitle = cleanText(rawSubtitle);

              return (
                <article key={a.id} style={styles.card}>
                  <Link to={`/wissenswert/${a.slug}`} style={styles.cardLink}>
                    <div style={styles.imgWrap}>
                      {a.hero_image_url ? (
                        <img
                          src={a.hero_image_url}
                          alt={title}
                          style={styles.img}
                        />
                      ) : (
                        <div style={styles.noImg}>{t.noImage}</div>
                      )}
                    </div>

                    <div style={styles.cardText}>
                      <h2 style={styles.cardTitle}>{title}</h2>
                      {subtitle && (
                        <p style={styles.cardSubtitle}>{subtitle}</p>
                      )}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>

          {hasSlider && (
            <button
              style={{ ...styles.arrow, ...styles.arrowRight }}
              onClick={next}
              aria-label={t.next}
            >
              →
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------------- styles ---------------- */

function createStyles({ colors, isDark }) {
  return {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "3.5rem 1.25rem 5rem",
    textAlign: "center",
  },
  h1: {
    fontSize: "2.6rem",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    marginBottom: "3rem",
    color: colors.muted,
  },
  sliderWrap: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
  },
  row: {
    display: "flex",
    gap: "2.2rem",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  arrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: `1px solid ${colors.border}`,
    background: isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.06)",
    color: colors.text,
    fontSize: "1.4rem",
    cursor: "pointer",
    boxShadow: colors.shadow,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  arrowLeft: { left: -20 },
  arrowRight: { right: -20 },
  card: {
    width: 320,
    background: isDark ? "rgba(255,255,255,0.06)" : colors.card,
    borderRadius: 22,
    boxShadow: colors.shadow,
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
    textAlign: "left",
    transition: "transform 200ms ease, box-shadow 200ms ease",
  },
  cardLink: {
    display: "block",
    color: colors.text,
    textDecoration: "none",
  },
  imgWrap: {
    width: "100%",
    height: 190,
    background: isDark ? "rgba(255,255,255,0.08)" : colors.soft,
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  noImg: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.muted,
    fontSize: "0.95rem",
  },
  cardText: {
    padding: "1.4rem 1.5rem 1.6rem",
  },
  cardTitle: {
    fontSize: "1.45rem",
    fontWeight: 600,
    lineHeight: 1.25,
    letterSpacing: "-0.015em",
    margin: 0,
    color: colors.text,
  },
  cardSubtitle: {
    marginTop: 10,
    fontSize: "0.95rem",
    lineHeight: 1.5,
    color: colors.muted,
  },
  };
}