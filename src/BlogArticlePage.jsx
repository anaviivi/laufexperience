import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "./supabaseClient";

function heroObjectPosition(focus) {
  const f = String(focus || "").toLowerCase();
  if (f === "top") return "50% 20%";
  if (f === "bottom") return "50% 80%";
  return "50% 50%";
}

import ArticleLayout from "./ArticleLayout";
import SimpleLayout from "./SimpleLayout";
import FlyerLayout from "./FlyerLayout";
import BlockRenderer from "./BlockRenderer";

/* ---------- Helpers ---------- */

const CenteredFlyer = ({ children }) => (
  <div
    style={{
      width: "100%",
      display: "flex",
      justifyContent: "center",
      overflowX: "auto",
      padding: "32px 16px",
    }}
  >
    {children}
  </div>
);

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
  if (language === "en") return en || legacy || "";
  return de || legacy || "";
}

/* ---------- Component ---------- */

export default function BlogArticlePage({ defaultLanguage = "de" }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [language, setLanguage] = useState(defaultLanguage);

  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("deleted", false)
      .eq("is_published", true)
      .single();

    setRaw(data || null);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const article = useMemo(() => {
    if (!raw) return null;

    const blocks =
      language === "en"
        ? raw.blocks_en ?? raw.blocks ?? []
        : raw.blocks_de ?? raw.blocks ?? [];

    return {
      ...raw,
      layout: String(raw.layout || "").toLowerCase(),
      title: cleanText(pickLang(language, raw.title_de, raw.title_en, raw.title)),
      subtitle: cleanText(pickLang(language, raw.subtitle_de, raw.subtitle_en, raw.subtitle)),
      blocks,
    };
  }, [raw, language]);

  if (loading) return <div style={{ padding: 24 }}>Lädt…</div>;
  if (!article) return <div style={{ padding: 24 }}>Artikel nicht gefunden.</div>;

  const layout = article.layout;

  /* ---------- RENDER ---------- */

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      {/* Topbar */}
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        ← Zurück
      </button>

      {/* Header */}
      {layout !== "flyer" && (
        <>
          <h1 style={{ fontSize: 34, fontWeight: 800 }}>{article.title}</h1>
          {article.subtitle && (
            <p style={{ fontSize: 18, color: "#4b5563" }}>{article.subtitle}</p>
          )}
        </>
      )}

      {/* Content */}
      {layout === "flyer" ? (
        <CenteredFlyer>
          <FlyerLayout article={article} />
        </CenteredFlyer>
      ) : layout === "simple" ? (
        <SimpleLayout article={article} />
      ) : (
        <ArticleLayout>
          <BlockRenderer article={article} />
        </ArticleLayout>
      )}
    </div>
  );
}
