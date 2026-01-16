import React from "react";
import ReadOnlyRichTextBlock from "./ReadOnlyRichTextBlock";
import BlockRenderer from "./BlockRenderer";
import { useLanguage } from "./LanguageContext.jsx";

/* ---------------- Helpers ---------------- */

function heroObjectPosition(focus) {
  const f = String(focus || "").toLowerCase();
  if (f === "top") return "50% 20%";
  if (f === "bottom") return "50% 80%";
  return "50% 50%";
}

function decodeHtmlEntities(input) {
  const s = String(input ?? "");
  if (!s) return "";
  if (typeof document === "undefined") return s;
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

function stripHtml(html = "") {
  const s = String(html ?? "");
  const noTags = s.replace(/<[^>]+>/g, "");
  const decoded = decodeHtmlEntities(noTags);
  return decoded.replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function isEmpty(html) {
  return stripHtml(html).length === 0;
}

function pickFirstNonEmptyRichText(...candidates) {
  for (const c of candidates) {
    if (!isEmpty(c)) return c;
  }
  return "";
}

function pickLangStrict(language, de, en, legacy = "") {
  const hasDe = de != null && String(de).trim() !== "";
  const hasEn = en != null && String(en).trim() !== "";
  const hasLegacy = legacy != null && String(legacy).trim() !== "";

  if (language === "en") {
    if (hasEn) return en;
    if (hasDe) return "";
    return hasLegacy ? legacy : "";
  }

  if (hasDe) return de;
  if (hasEn) return "";
  return hasLegacy ? legacy : "";
}

/**
 * Deine alte Logik war:
 * - hero-overlay soll NICHT als Overlay im simple Layout erscheinen (du wolltest das weg)
 * - daher mappen wir hero-overlay -> belowHero
 */
function normalizeTitlePlacement({ title_variant }) {
  const v = String(title_variant ?? "").toLowerCase();
  if (v === "hero-overlay") return "belowHero"; // overlay im simple deaktiviert
  if (v === "below-hero") return "belowHero";
  if (v === "hidden") return "hidden";
  return "above";
}

/* ---------------- Component ---------------- */

export default function SimpleLayout({
  article,
  showHeroPlaceholder = false,
  showHero = true,
  showTeaser = true,
}) {
  const { language } = useLanguage();
  if (!article) return null;

  // Safety net: niemals Flyer in SimpleLayout
  if (String(article.layout || "").toLowerCase() === "flyer") return null;

  const hero_image_url = article.hero_image_url || "";

  // Prefer canonical normalized fields. Fallback to language-specific legacy fields.
  const title =
    article.title || pickLangStrict(language, article.title_de, article.title_en, "");
  const subtitle =
    article.subtitle || pickLangStrict(language, article.subtitle_de, article.subtitle_en, "");

  // RichText fields from Admin "Format"
  const short_description =
    article.short_description ||
    pickLangStrict(language, article.short_description_de, article.short_description_en, "");
  const teaser =
    article.teaser || pickLangStrict(language, article.teaser_de, article.teaser_en, "");
  const intro = article.intro || pickLangStrict(language, article.intro_de, article.intro_en, "");

  // Legacy HTML content (only if no blocks)
  const content =
    article.content || pickLangStrict(language, article.content_de, article.content_en, "");

  // --- Blocks normalisieren (kann aus DB als JSON-String kommen) ---
  const blocksRaw =
    article.blocks ??
    pickLangStrict(language, article.blocks_de, article.blocks_en, null) ??
    null;

  let blocks = blocksRaw;
  if (typeof blocksRaw === "string") {
    try {
      blocks = JSON.parse(blocksRaw);
    } catch {
      blocks = null;
    }
  }
  const hasBlocks = Array.isArray(blocks) && blocks.length > 0;

  const titlePlacement = normalizeTitlePlacement({ title_variant: article.title_variant });

  const hasTitle = !isEmpty(title);
  const hasSubtitle = !isEmpty(subtitle);

  // IMPORTANT: Subtitle darf NICHT in teaserHtml landen (sonst wirkt es doppelt).
  // Teaser-Box: short_description -> teaser -> intro
  const teaserHtml = pickFirstNonEmptyRichText(short_description, teaser, intro);
  const hasTeaser = !isEmpty(teaserHtml);

  const hasContent = !hasBlocks && !isEmpty(content);

  const renderHeaderDefault = () => {
    if (titlePlacement === "hidden") return null;
    if (!hasTitle && !hasSubtitle) return null;

    return (
      <header style={{ marginTop: 18, marginBottom: 10 }}>
        {hasTitle && (
          <h1
            style={{
              fontSize: 52,
              lineHeight: 1.05,
              letterSpacing: "-0.045em",
              margin: "0 0 4px",
              color: "var(--color-text)",
              fontWeight: 800,
            }}
            dangerouslySetInnerHTML={{ __html: title }}
          />
        )}

        {hasSubtitle && (
          <div
            style={{
              fontSize: 18,
              lineHeight: 1.45,
              color: "var(--color-muted)",
              marginTop: 2,
              marginBottom: 8,
              fontWeight: 500,
            }}
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        )}

        <div
          style={{
            height: 1,
            background: "linear-gradient(90deg, var(--color-border), transparent)",
            marginTop: 14,
          }}
        />
      </header>
    );
  };

  const renderTeaser = () => {
    // Wenn blocks existieren, lassen wir die Box weg (sonst wird’s oft doppelt mit ersten Blocks)
    if (!showTeaser || !hasTeaser || hasBlocks) return null;

    return (
      <div
        style={{
          marginTop: 18,
          marginBottom: 30,
          padding: "18px 20px",
          borderRadius: 20,
          background: "var(--color-soft)",
          border: "1px solid var(--color-border)",
        }}
      >
        <ReadOnlyRichTextBlock content={teaserHtml} />
      </div>
    );
  };

  const renderHero = () => {
    if (!showHero) {
      // Wenn Hero aus ist: Header trotzdem (außer hidden)
      return renderHeaderDefault();
    }

    const showHeaderBelow = titlePlacement === "belowHero";
    const showHeaderAbove = titlePlacement === "above";

    const heroBox =
      hero_image_url || showHeroPlaceholder ? (
        <div
          style={{
            width: "100%",
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid var(--color-border)",
            marginTop: 14,
            position: "relative",
          }}
        >
          {hero_image_url ? (
            <img
              src={hero_image_url}
              alt={stripHtml(title) || article.slug || "hero"}
              style={{
                width: "100%",
                height: "clamp(260px, 38vh, 520px)",
                objectFit: "cover",
                objectPosition: heroObjectPosition(article?.hero_focus),
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: 260,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--color-soft)",
                color: "var(--color-muted)",
                fontSize: 13,
              }}
            >
              {language === "en" ? "No image" : "Kein Bild"}
            </div>
          )}
        </div>
      ) : null;

    return (
      <>
        {showHeaderAbove && renderHeaderDefault()}
        {heroBox}
        {showHeaderBelow && renderHeaderDefault()}
      </>
    );
  };

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "28px 16px 64px",
        fontFamily:
          '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: "var(--color-text)",
      }}
    >
      {renderHero()}
      {renderTeaser()}

      <div style={{ marginTop: 20 }}>
        {hasBlocks ? (
          <BlockRenderer article={{ ...article, blocks }} />
        ) : hasContent ? (
          <ReadOnlyRichTextBlock content={content} />
        ) : null}
      </div>
    </div>
  );
}
