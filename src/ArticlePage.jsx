import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useLanguage } from "./LanguageContext.jsx";
import SimpleLayout from "./SimpleLayout";
import ArticleLayout from "./ArticleLayout";
import FlyerLayout from "./FlyerLayout";
import BlockRenderer from "./BlockRenderer";
function heroObjectPosition(focus) {
  const f = String(focus || "").toLowerCase();
  if (f === "top") return "50% 20%";
  if (f === "bottom") return "50% 80%";
  return "50% 50%";
}

/* ---------- Helpers ---------- */

function CenteredFlyer({ children }) {
  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "var(--color-bg)",
        color: "var(--color-text)",

        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",

                display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "32px 0",
        overflowX: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function decodeHtml(input = "") {
  if (typeof document === "undefined") return input;
  const el = document.createElement("textarea");
  el.innerHTML = input;
  return el.value;
}

function cleanText(input = "") {
  return decodeHtml(String(input))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickLang(language, de, en, legacy = "") {
  if (language === "en") return en || de || legacy || "";
  return de || en || legacy || "";
}

function pickBlocks(language, data) {
  const has = (x) => Array.isArray(x) && x.length > 0;

  const en = data.blocks_en;
  const de = data.blocks_de;
  const legacy = data.blocks;

  if (language === "en") return has(en) ? en : [];
  return has(de) ? de : has(en) ? en : legacy ?? [];
}

/* ---------- Component ---------- */

export default function ArticlePage() {
  const { slug } = useParams();
  const { language } = useLanguage();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const reqRef = useRef(0);

  useEffect(() => {
    let alive = true;
    const rid = ++reqRef.current;

    (async () => {
      setLoading(true);

      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("deleted", false)
        .single();

      if (!alive || rid !== reqRef.current || !data) return;

      const blocks = pickBlocks(language, data);

      const layout = String(data.layout || "").toLowerCase();
      const preferBlocks = Array.isArray(blocks) && blocks.length > 0;

      setArticle({
        ...data,
        layout,
        title: cleanText(pickLang(language, data.title_de, data.title_en, data.title)),
        subtitle: cleanText(pickLang(language, data.subtitle_de, data.subtitle_en, data.subtitle)),
        short_description: cleanText(
          pickLang(
            language,
            data.short_description_de,
            data.short_description_en,
            data.short_description
          )
        ),
        teaser: cleanText(pickLang(language, data.teaser_de, data.teaser_en, data.teaser)),
        intro: preferBlocks ? "" : pickLang(language, data.intro_de, data.intro_en, data.intro),
        content: preferBlocks ? "" : pickLang(language, data.content_de, data.content_en, data.content),
        blocks,
      });

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [slug, language]);

  const uiText = {
    loading: language === "en" ? "Loading…" : "Lädt…",
    notFound: language === "en" ? "Article not found." : "Artikel nicht gefunden.",
    back: language === "en" ? "← Back" : "← Zurück",
  };

  if (loading) return <div style={{ padding: 24, background: "var(--color-bg)", color: "var(--color-text)", minHeight: "100vh" }}>{uiText.loading}</div>;
  if (!article)
    return (
      <div style={{ padding: 24, background: "var(--color-bg)", color: "var(--color-text)", minHeight: "100vh" }}>
        {uiText.notFound}
        <br />
        <Link to="/wissenswert">{uiText.back}</Link>
      </div>
    );

  /* ---------- RENDER ---------- */

  if (article.layout === "flyer") {
    return (
      <CenteredFlyer>
        <FlyerLayout article={article} mode="preview" />
      </CenteredFlyer>
    );
  }

  if (article.layout === "blocks") {
    const hasBlocks = Array.isArray(article.blocks) && article.blocks.length > 0;
    return (
      <ArticleLayout>
        {hasBlocks ? (
          <BlockRenderer article={article} />
        ) : (
          <div>
            {article.intro ? <p>{article.intro}</p> : null}
            {article.content ? <div>{article.content}</div> : null}
          </div>
        )}
      </ArticleLayout>
    );
  }

  if (article.layout === "article") {
    const v = String(article.title_variant || "above-content");
    const hide = v === "hidden";
    const overlay = v === "hero-overlay";
    const below = v === "below-hero";
    const above = v === "above-content";

    const Hero = () => {
      if (!article.hero_image_url) return null;
      return (
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid var(--color-borderSubtle)",
            position: "relative",
            marginBottom: below ? 12 : 24,
          }}
        >
          <img
            src={article.hero_image_url}
            alt={article.title || article.slug}
            style={{
              width: "100%",
              height: "clamp(260px, 38vh, 520px)",
              objectFit: "cover",
              objectPosition: heroObjectPosition(article.hero_focus),
              display: "block",
            }}
            loading="eager"
          />

          {overlay && !hide ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                padding: 16,
                background: "rgba(0,0,0,0.45)",
                color: "white",
              }}
            >
              {article.title ? (
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.15 }}>
                  {article.title}
                </div>
              ) : null}
              {article.subtitle ? (
                <div style={{ marginTop: 8, fontSize: 16, opacity: 0.95 }}>
                  {article.subtitle}
                </div>
              ) : null}
              {article.short_description ? (
                <div style={{ marginTop: 8, fontSize: 15, opacity: 0.9 }}>
                  {article.short_description}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    };

    const Header = () => {
      if (hide || overlay) return null;
      if (!(above || below)) return null;

      return (
        <div style={{ marginBottom: 28 }}>
          {article.title ? (
            <h1 style={{ fontSize: 34, fontWeight: 900, margin: 0, marginBottom: 10 }}>
              {article.title}
            </h1>
          ) : null}
          {article.subtitle ? (
            <p style={{ fontSize: 18, color: "var(--color-muted)", margin: 0, marginBottom: 10 }}>
              {article.subtitle}
            </p>
          ) : null}
          {article.short_description ? (
            <p style={{ fontSize: 16, color: "var(--color-muted)", margin: 0 }}>
              {article.short_description}
            </p>
          ) : null}
        </div>
      );
    };

    return (
      <ArticleLayout>
        <Hero />
        {above ? <Header /> : null}
        {below ? <Header /> : null}
        {Array.isArray(article.blocks) && article.blocks.length > 0 ? (
          <BlockRenderer article={article} />
        ) : (
          <div>
            {article.intro ? <p>{article.intro}</p> : null}
            {article.content ? <div>{article.content}</div> : null}
          </div>
        )}
      </ArticleLayout>
    );
  }

  return <SimpleLayout article={article} />;
}
