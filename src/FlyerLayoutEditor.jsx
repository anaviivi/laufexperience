import React from "react";
// src/FlyerLayoutEditor.jsx
import FlyerLayout from "./FlyerLayout";
import { useLanguage } from "./LanguageContext.jsx";

/**
 * Wrapper um FlyerLayout, damit du einen "FlyerLayoutEditor" als eigenen Block hast.
 * - fullWidth: macht den Container über die ganze Breite
 * - scrollX: verhindert Quetschen, stattdessen horizontal scrollen
 *
 * ✅ i18n:
 * - liest/schreibt layout_elements_de / layout_elements_en (ohne die andere Sprache zu überschreiben)
 */
export default function FlyerLayoutEditor({
  article,
  onArticleChange,
  onUploadImage,
  onChangeHeroImageUrl,
  fullWidth = true,
  scrollX = true,
  compact = true,
  minWidth = 250 + 794 + 160 + 64, // links + flyer + inspector + gaps
}) {
  const { language } = useLanguage();

  const TEXTS = {
    de: {
      title: "Flyer-Layout Editor",
      hint: "Horizontal scrollen, wenn’s eng ist",
    },
    en: {
      title: "Flyer Layout Editor",
      hint: "Scroll horizontally if space is tight",
    },
  };

  const t = TEXTS[language] || TEXTS.de;

  const safeArticle = React.useMemo(() => {
    const a = article || {};

    const de = a.layout_elements_de ?? null;
    const en = a.layout_elements_en ?? null;

    // For editor preview: use only the current language field, otherwise fall back to neutral legacy
    const layoutElements =
      language === "en"
        ? (Array.isArray(en) ? en : null) ?? (Array.isArray(a.layout_elements) ? a.layout_elements : a.layoutElements || [])
        : (Array.isArray(de) ? de : null) ?? (Array.isArray(a.layout_elements) ? a.layout_elements : a.layoutElements || []);

    return { ...a, layoutElements };
  }, [article, language]);

  const handleElementsChange = (elements) => {
    const prev = article || {};

    // ✅ write only the active language column
    const patch =
      language === "en"
        ? { layout_elements_en: elements }
        : { layout_elements_de: elements };

    onArticleChange?.({
      ...prev,
      ...patch,

      // Keep a local convenience field for immediate preview (doesn't go to DB unless you save it)
      layoutElements: elements,
    });
  };

  return (
    <section
      style={{
        marginTop: 16,
        padding: 12,
        borderRadius: 18,
        border: "1px solid var(--color-border, #e5e7eb)",
        background: "var(--color-soft, #f6f7fb)",
        width: fullWidth ? "100%" : undefined,
        maxWidth: fullWidth ? "none" : undefined,
        overflowX: scrollX ? "auto" : "visible",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{t.title}</h3>
        {scrollX && (
          <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{t.hint}</div>
        )}
      </div>

      <div style={{ marginTop: 10, minWidth: scrollX ? minWidth : undefined }}>
        <FlyerLayout
          article={safeArticle}
          mode="editor"
          showToolbar
          compact={compact}
          onUploadImage={onUploadImage}
          onChangeHeroImageUrl={onChangeHeroImageUrl}
          onElementsChange={handleElementsChange}
        />
      </div>
    </section>
  );
}
