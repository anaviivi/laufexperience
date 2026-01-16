// src/BlockRenderer.jsx
import React from "react";
import ReadOnlyRichTextBlock from "./ReadOnlyRichTextBlock";
import { useLanguage } from "./LanguageContext.jsx";
import { useTheme } from "./ThemeContext.jsx";
const styles = {
  h2: { fontSize: 22, fontWeight: 900, margin: "10px 0 6px" },
  h3: { fontSize: 18, fontWeight: 800, margin: "10px 0 6px" },
  p: { fontSize: 16, lineHeight: 1.7, color: "#111827", margin: "8px 0" },
  img: { width: "100%", borderRadius: 14, border: "1px solid #eee" },
  caption: { fontSize: 12, color: "#666", marginTop: 6 },
};

// optional: für andere Module (FlyerLayout liest das defensiv)
export const BLOCK_TYPES = {
  RICH: "RICH",
  IMAGE: "IMAGE",
  QUOTE: "QUOTE",
  CHECKLIST: "CHECKLIST",
  TWO_COLUMNS: "TWO_COLUMNS",
};

function normType(t) {
  return String(t || "").trim().toLowerCase();
}


function normalizeBlocksInput(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function renderOne(block, key) {
  if (!block) return null;

  const t = normType(block.type);

  if (t === "heading" || t === "h2" || t === "h3" || t === "title") {
    const level = block.level || 2;
    const html = block.html ?? block.text ?? "";
    return (
      <div key={key} style={level === 2 ? styles.h2 : styles.h3}>
        {/* heading kann HTML enthalten */}
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }

  if (t === "paragraph" || t === "rich" || t === "rich_text" || t === "rich-text" || t === "text") {
    // bei dir steckt oft "<p>...</p>" in text -> als RichText rendern
    const html = block.html ?? block.content ?? block.text ?? "";
    return (
      <div key={key} style={styles.p}>
        <ReadOnlyRichTextBlock content={html} />
      </div>
    );
  }

  if (t === "image" || t === "image-block") {
    return (
      <div key={key}>
        {block.url ? <img src={block.url} alt={block.caption || ""} style={styles.img} /> : null}
        {block.caption ? <div style={styles.caption}>{block.caption}</div> : null}
      </div>
    );
  }

  if (t === "quote") {
    return (
      <blockquote
        key={key}
        style={{
          ...styles.p,
          fontStyle: "italic",
          borderLeft: "4px solid #e5e7eb",
          paddingLeft: 12,
        }}
      >
        {block.text ? <ReadOnlyRichTextBlock content={block.text} /> : null}
        {block.author ? (
          <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280", fontStyle: "normal" }}>
            — {block.author}
          </div>
        ) : null}
      </blockquote>
    );
  }

  if (t === "checklist") {
    const items = Array.isArray(block.items)
      ? block.items
      : String(block.items || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
    if (!items.length) return null;
    return (
      <ul key={key} style={{ ...styles.p, paddingLeft: "1.25rem" }}>
        {items.map((it, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {it}
          </li>
        ))}
      </ul>
    );
  }

  if (t === "two_columns" || t === "two-columns") {
    return (
      <div
        key={key}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          margin: "10px 0",
        }}
      >
        <div style={styles.p}>
          <ReadOnlyRichTextBlock content={block.left ?? ""} />
        </div>
        <div style={styles.p}>
          <ReadOnlyRichTextBlock content={block.right ?? ""} />
        </div>
      </div>
    );
  }

  return null;
}

export default function BlockRenderer(props) {
  const { language } = useLanguage();
  // Unterstützt mehrere Aufruf-Arten:
  // 1) <BlockRenderer article={article} />
  // 2) <BlockRenderer blocks={[...]} />
  // 3) <BlockRenderer block={block} />
  const articleBlocks = (() => {
    const a = props?.article;
    if (!a) return null;

    // prefer normalized article.blocks (supports JSON string too)
    const nb = normalizeBlocksInput(a.blocks);
    if (nb) return nb;

    // fallback if caller passes raw language fields
    if (language === "en") {
      const en = normalizeBlocksInput(a.blocks_en);
      if (en) return en;
      const de = normalizeBlocksInput(a.blocks_de);
      if (de) return de;
    } else {
      const de = normalizeBlocksInput(a.blocks_de);
      if (de) return de;
      const en = normalizeBlocksInput(a.blocks_en);
      if (en) return en;
    }
    return null;
  })();

  const blocks = articleBlocks || normalizeBlocksInput(props?.blocks);


  // DEBUG: welche Blocks kommen an?
  try {
    const types = (blocks || []).map(b => b?.type || b?.kind || b?.block_type || "<?>");
    console.groupCollapsed("[BlockRenderer] blocks:", (blocks || []).length);
    console.log("types:", types);
    console.log("unique:", Array.from(new Set(types)));
    console.groupEnd();
  } catch (e) {
    console.warn("[BlockRenderer] debug failed", e);
  }
  if (blocks) {
    return <div>{blocks.map((b, i) => renderOne(b, b?.id ?? i))}</div>;
  }

  if (props?.block) return renderOne(props.block, props.block?.id ?? 0);

  return null;
}
