import React from "react";
// src/FlyerLayout.jsx
import ReadOnlyRichTextBlock from "./ReadOnlyRichTextBlock";
import BlockRendererModule from "./BlockRenderer";
import { Rnd } from "react-rnd";
import { useLanguage } from "./LanguageContext.jsx";
import { useTheme } from "./ThemeContext.jsx";
/* ===========================
   Block-Typen
   =========================== */

const BLOCK_TYPES = BlockRendererModule?.BLOCK_TYPES || {};
const TYPE = {
  RICH: BLOCK_TYPES.RICH || "RICH",
  IMAGE: BLOCK_TYPES.IMAGE || "IMAGE",
  QUOTE: BLOCK_TYPES.QUOTE || "QUOTE",
  CHECKLIST: BLOCK_TYPES.CHECKLIST || "CHECKLIST",
  TWO_COLUMNS: BLOCK_TYPES.TWO_COLUMNS || "TWO_COLUMNS",
};

/* ===========================
   Element-Typen / Fähigkeiten
   =========================== */

const SUPPORTS_BG_COLOR = [
  "shape-rect",
  "shape-circle",
  "button",
  "text-box",
  "image-element",
  "accent",
  "infoBox",
  "badge",
  "line",
  "chip",
  "title",
  "verticalLabel",
  "block",
];

// ❗️"line" NICHT als Textfarbe behandeln (Linie nutzt backgroundColor als Linienfarbe)
const SUPPORTS_TEXT_COLOR = [
  "button",
  "text-box",
  "icon",
  "verticalLabel",
  "infoBox",
  "badge",
  "title",
  "chip",
  "shape-rect",
  "shape-circle",
  "block",
];

const SUPPORTS_SUBTITLE_COLOR = ["title"];

const SUPPORTS_BORDER_COLOR = [
  "icon",
  "shape-rect",
  "shape-circle",
  "image-element",
  "button",
  "chip",
  "badge",
];

const SUPPORTS_TYPOGRAPHY = [
  "title",
  "text-box",
  "button",
  "verticalLabel",
  "infoBox",
  "badge",
  "chip",
  "block",
];

const SUPPORTS_SHADOW = [
  "hero",
  "badge",
  "shape-rect",
  "shape-circle",
  "button",
  "icon",
  "image-element",
  "infoBox",
  "block",
  "chip",
];

const SUPPORTS_LINE_THICKNESS = ["line"];
const SUPPORTS_LINE_HEIGHT = ["text-box", "infoBox", "block"];

const TYPOGRAPHY_ELEMENT_TYPES = SUPPORTS_TYPOGRAPHY;

const ELEMENT_TYPE_LABELS = {
  hero: "Hero Bild",
  accent: "Akzentfläche",
  badge: "Badge",
  verticalLabel: "Seitenlabel",
  title: "Titel",
  infoBox: "Infobox",
  block: "Artikel-Block",
  "shape-rect": "Rechteck",
  "shape-circle": "Kreis",
  button: "Button",
  icon: "Icon",
  "text-box": "Textfeld",
  "image-element": "Bild",
  line: "Linie",
  chip: "Label",
};

/* ===========================
   Presets
   =========================== */

const COLOR_PRESETS = [
  { name: "Soft Grün", bg: "#e3ebe5", text: "#111827" },
  { name: "Pastell Lila", bg: "#ede9fe", text: "#111827" },
  { name: "Sunny", bg: "#fef3c7", text: "#92400e" },
  { name: "Bold", bg: "#111827", text: "#f9fafb" },
  { name: "Ocean", bg: "#e0f2fe", text: "#111827" },
  { name: "Blush", bg: "#ffe4e6", text: "#9f1239" },
  { name: "Mocha", bg: "#f5e9dd", text: "#4b2e2b" },
  { name: "Mint", bg: "#dcfce7", text: "#064e3b" },
  { name: "Sunset", bg: "#fee2e2", text: "#7c2d12" },
];

const TYPO_PRESETS = [
  { name: "Modern Sans", title: "display", body: "sans", accent: "mono" },
  { name: "Editorial", title: "serif", body: "sans", accent: "display" },
  { name: "Playful", title: "display", body: "sans", accent: "display" },
];

/* ===========================
   Styles
   =========================== */

const sidebarButtonStyle = {
  fontSize: 13,
  padding: "8px 10px",
  borderRadius: 14,
  border: "1px solid var(--color-border)",
  background: "linear-gradient(135deg, var(--color-card) 0%, var(--color-soft) 100%)",
  cursor: "pointer",
  textAlign: "left",
  display: "flex",
  alignItems: "center",
  gap: 8,
  boxShadow: "var(--color-shadow)",
};

const sidebarButtonIconStyle = {
  width: 18,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

/* ===========================
   Utils
   =========================== */

const decodeHtmlEntities = (input) => {
  const s = String(input ?? "");
  if (!s) return "";
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
};

const stripHtml = (value = "") => {
  const s = String(value ?? "");
  const noTags = s.replace(/<[^>]+>/g, "");
  const decoded = decodeHtmlEntities(noTags);
  return decoded.replace(/\s+/g, " ").trim();
};


const isType = (blockType, ...candidates) =>
  candidates.filter(Boolean).some((c) => c === blockType);

const mapFontFamily = (token) => {
  switch (token) {
    case "serif":
      return '"Playfair Display","Times New Roman",serif';
    case "mono":
      return '"Space Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    case "display":
      return '"DM Sans","system-ui",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    case "sans":
    default:
      return '"Inter", system-ui, -apple-system, BlinkMacSystemFont,"Segoe UI",sans-serif';
  }
};

const isHexColor = (v) => /^#([0-9a-f]{3}){1,2}$/i.test(String(v || "").trim());
const toHexOr = (v, fallback) => (isHexColor(v) ? v : fallback);

const canExec = () =>
  typeof document !== "undefined" &&
  typeof document.execCommand === "function";

const exec = (command) => {
  if (!canExec()) return;
  document.execCommand(command, false);
};

const execList = (type) => {
  if (!canExec()) return;
  exec(type === "ol" ? "insertOrderedList" : "insertUnorderedList");
};

const execWithValue = (command, value) => {
  if (!canExec()) return;
  document.execCommand(command, false, value);
};

const normalizeUrl = (raw) => {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (/^mailto:/i.test(v)) return v;
  return `https://${v}`;
};

const noop = () => {};

/* ===========================
   Basis-Komponenten
   =========================== */

const FlyerFrame = ({ children }) => (
  <div
    style={{
      width: 794,
      margin: "0 auto",
      height: 1123,
      backgroundColor: "#ffffff",
      borderRadius: 24,
      boxShadow:
        "0 30px 60px rgba(15,23,42,0.25), 0 0 0 1px rgba(148,163,184,0.3)",
      padding: 32,
      boxSizing: "border-box",
      position: "relative",
      overflow: "hidden",
      fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont',
    }}
  >
    {children}
  </div>
);

const AccentPanel = ({ backgroundColor }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      borderRadius: 24,
      backgroundColor: backgroundColor || "#e3ebe5",
    }}
  />
);

const HeroBlock = ({ children }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      borderRadius: 24,
      overflow: "hidden",
      position: "relative",
    }}
  >
    {children}
  </div>
);

const StickerBadge = ({
  textTop,
  textBottom,
  center,
  backgroundColor,
  textColor,
  fontFamily,
  fontSize,
  borderColor,
}) => (
  <div
    style={{
      backgroundColor: backgroundColor || "#ffffff",
      borderRadius: "999px",
      padding: "6px 10px",
      border: `2px solid ${borderColor || "rgba(15,23,42,0.25)"}`,
      boxShadow: "0 10px 20px rgba(15,23,42,0.15)",
      fontSize: fontSize || 10,
      letterSpacing: 1.2,
      textTransform: "uppercase",
      color: textColor || "#111827",
      fontFamily:
        fontFamily ||
        '"Inter", system-ui, -apple-system, BlinkMacSystemFont,"Segoe UI",sans-serif',
      userSelect: "none",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span>{textTop}</span>
      <span style={{ fontSize: (fontSize || 10) + 4 }}>♥</span>
      <span>{textBottom}</span>
      {center && <span style={{ fontWeight: 600, marginLeft: 4 }}>{center}</span>}
    </div>
  </div>
);

const VerticalLabel = ({
  text,
  color,
  fontFamily,
  fontSize,
  letterSpacing,
  backgroundColor,
}) => (
  <div
    style={{
      fontSize: fontSize || 12,
      letterSpacing: letterSpacing ?? 3,
      textTransform: "lowercase",
      color: color || "#4b5563",
      fontFamily:
        fontFamily ||
        '"Inter", system-ui, -apple-system, BlinkMacSystemFont,"Segoe UI",sans-serif',
      backgroundColor: backgroundColor || "transparent",
      borderRadius: backgroundColor && backgroundColor !== "transparent" ? 999 : 0,
      padding:
        backgroundColor && backgroundColor !== "transparent" ? "2px 6px" : 0,
      userSelect: "none",
    }}
  >
    {text || "@deinprofil"}
  </div>
);

const TitleBlock = ({
  title,
  subtitle,
  fontFamily,
  fontSize,
  fontWeight,
  textAlign,
  colorTitle,
  colorSubtitle,
  letterSpacing,
  backgroundColor,
}) => {
  const baseSize = fontSize || 30;
  const subSize = Math.round(baseSize * 0.55);
  const ls = letterSpacing ?? 6;
  return (
    <header
      style={{
        textAlign: textAlign || "center",
        position: "relative",
        backgroundColor: backgroundColor || "transparent",
        borderRadius:
          backgroundColor && backgroundColor !== "transparent" ? 12 : 0,
        padding:
          backgroundColor && backgroundColor !== "transparent" ? 4 : 0,
      }}
    >
      {title && (
        <h1
          style={{
            margin: 0,
            fontSize: baseSize,
            letterSpacing: ls,
            textTransform: "uppercase",
            color: colorTitle || "#1f2933",
            fontFamily:
              fontFamily || '"Playfair Display","Times New Roman",serif',
            fontWeight: fontWeight || 600,
          }}
        >
          {title}
        </h1>
      )}
      {subtitle && (
        <p
          style={{
            marginTop: 6,
            marginBottom: 0,
            fontSize: subSize,
            letterSpacing: Math.max(ls - 2, 0),
            textTransform: "uppercase",
            color: colorSubtitle || "#374151",
            fontFamily:
              fontFamily || '"Playfair Display","Times New Roman",serif',
          }}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
};

const heroPlaceholder = (
  <div
    style={{
      width: "100%",
      height: "100%",
      backgroundColor: "#f3f4f6",
      borderRadius: 24,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
      color: "var(--color-muted)",
      userSelect: "none",
    }}
  >
    Kein Bild vorhanden
  </div>
);

/* ===========================
   Block-Renderer
   =========================== */

const renderBlockContent = (block, styleOverrides = {}) => {
  if (!block) return null;
  const t = block.type;

  const innerStyle = {
    color: styleOverrides.color,
    fontFamily: styleOverrides.fontFamily,
    fontSize: styleOverrides.fontSize,
    textAlign: styleOverrides.textAlign,
    lineHeight: styleOverrides.lineHeight,
  };

  if (isType(t, TYPE.RICH, "rich", "RICH_TEXT", "text", "paragraph")) {
    return (
      <section
        style={{
          padding: 12,
          borderRadius: 16,
          backgroundColor: styleOverrides.backgroundColor || "#ffffff",
          border: "1px solid var(--color-border)",
          lineHeight: 1.6,
          fontSize: 14,
        }}
      >
        <div style={innerStyle}>
          <ReadOnlyRichTextBlock content={block.content || ""} />
        </div>
      </section>
    );
  }

  if (isType(t, TYPE.IMAGE, "image", "IMAGE")) {
    if (!block.url) return null;
    return (
      <figure
        style={{
          margin: 0,
          padding: 12,
          borderRadius: 16,
          backgroundColor: styleOverrides.backgroundColor || "#ffffff",
          border: "1px solid var(--color-border)",
          textAlign: "center",
        }}
      >
        <img
          src={block.url}
          alt={block.alt || ""}
          style={{
            maxWidth: "100%",
            maxHeight: 260,
            objectFit: "cover",
            borderRadius: 12,
            display: "block",
            margin: "0 auto",
          }}
        />
        {block.caption && (
          <figcaption style={{ marginTop: 8, fontSize: 12, color: "var(--color-muted)" }}>
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (isType(t, TYPE.QUOTE, "quote", "QUOTE")) {
    return (
      <blockquote
        style={{
          margin: 0,
          padding: 16,
          borderRadius: 16,
          backgroundColor: styleOverrides.backgroundColor || "#f9fafb",
          border: "1px solid var(--color-border)",
          fontStyle: "italic",
          fontSize: 14,
        }}
      >
        <div style={{ marginBottom: 8, ...innerStyle }}>{block.text || ""}</div>
        {block.author && (
          <footer style={{ fontSize: 12, color: "var(--color-muted)", textAlign: "right" }}>
            — {block.author}
          </footer>
        )}
      </blockquote>
    );
  }

  if (isType(t, TYPE.CHECKLIST, "checklist", "CHECKLIST")) {
    const items = (block.items || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!items.length) return null;

    return (
      <div
        style={{
          padding: 12,
          borderRadius: 16,
          backgroundColor: styleOverrides.backgroundColor || "#ffffff",
          border: "1px solid var(--color-border)",
        }}
      >
        <ul
          style={{
            margin: 0,
            paddingLeft: "1.25rem",
            fontSize: 14,
            ...innerStyle,
          }}
        >
          {items.map((item, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (isType(t, TYPE.TWO_COLUMNS, "two_columns", "TWO_COLUMNS")) {
    return (
      <section
        style={{
          padding: 12,
          borderRadius: 16,
          backgroundColor: styleOverrides.backgroundColor || "#ffffff",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            fontSize: 14,
            ...innerStyle,
          }}
        >
          <div style={{ whiteSpace: "pre-wrap" }}>{block.left || ""}</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{block.right || ""}</div>
        </div>
      </section>
    );
  }

  return null;
};

/* ===========================
   Draggable Element
   UX: Klick in ContentEditable selektiert Element automatisch
   =========================== */

const DraggableElement = ({
  element,
  children,
  onChange,
  selected,
  onSelect,
  interactive,
  onDelete,
}) => {
  if (!element.visible) return null;

  const { x, y, width, height, opacity, zIndex, locked, rotation = 0 } = element;
  const hasShadow = element.hasShadow !== undefined ? element.hasShadow : true;

  const handleDragStop = (e, d) => {
    if (!interactive || locked) return;
    onChange({ ...element, x: d.x, y: d.y });
  };

  const handleResizeStop = (e, dir, ref, delta, position) => {
    if (!interactive || locked) return;
    onChange({
      ...element,
      x: position.x,
      y: position.y,
      width: parseInt(ref.style.width, 10),
      height: parseInt(ref.style.height, 10),
    });
  };

  return (
    <Rnd
      size={{ width, height }}
      position={{ x, y }}
      bounds="parent"
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      enableResizing={interactive && !locked}
      disableDragging={!interactive || locked}
      dragHandleClassName="flyer-drag-handle"
      dragGrid={interactive ? [5, 5] : undefined}
      resizeGrid={interactive ? [5, 5] : undefined}
      cancel={'[contenteditable="true"],input,textarea,button,select,option,a'}
      enableUserSelectHack={false}
      /**
       * Wichtig: NICHT in der Capture-Phase stoppen – sonst erreicht das Event
       * den Drag-Handle nicht und react-rnd kann den Drag nicht starten.
       */
      style={{
        position: "absolute",
        zIndex,
        opacity,
        boxShadow:
          interactive && selected
            ? "0 0 0 2px #3b82f6, 0 10px 20px rgba(15,23,42,0.25)"
            : hasShadow
            ? "0 8px 20px rgba(15,23,42,0.12)"
            : "none",
        borderRadius: 20,
        backgroundColor: "transparent",
        cursor: interactive && !locked ? "move" : "default",
      }}
    >
      {interactive && selected && !locked && (
        <div
          className="flyer-drag-handle"
          style={{
            position: "absolute",
            top: -12,
            left: 14,
            right: 14,
            height: 22,
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-text)",
            background: ui.glassBg,
            border: "1px solid rgba(148,163,184,0.9)",
            boxShadow: "0 6px 14px rgba(15,23,42,0.14)",
            cursor: "grab",
            userSelect: "none",
            zIndex: 1001,
          }}
          title="Zum Bewegen hier ziehen (oder Pfeiltasten nutzen)"
        >
          <span style={{ opacity: 0.8 }}>↕︎</span>
          <span style={{ opacity: 0.9 }}>ziehen</span>
        </div>
      )}

      {interactive && selected && !locked && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(element.id);
          }}
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 22,
            height: 22,
            borderRadius: "999px",
            border: "1px solid #fecaca",
            background: "#fee2e2",
            color: "#b91c1c",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 8px rgba(15,23,42,0.25)",
            zIndex: 1000,
          }}
          title="Element löschen"
        >
          ✕
        </button>
      )}

      <div
        onPointerDown={
          interactive
            ? (e) => {
                // Klick auf Inhalt -> selektieren, aber Drag (Handle) nicht stören
                onSelect(element.id);
                e.stopPropagation();
              }
            : undefined
        }
        onMouseDown={
          interactive
            ? (e) => {
                onSelect(element.id);
                e.stopPropagation();
              }
            : undefined
        }
        style={{
          width: "100%",
          height: "100%",
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "center center",
          pointerEvents: "auto",
        }}
      >
        {children}
      </div>
    </Rnd>
  );
};

/* ===========================
   Extra-Elemente-Renderer
   UX: Focus/Click selektiert Element, kein „neu klicken“ nötig
   =========================== */

const renderExtraElementContent = (
  element,
  interactive,
  onElementTextChange,
  triggerImageUpload,
  setActiveEditableId,
  setSelectedId
) => {
  if (element.type === "shape-rect") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 16,
          backgroundColor: element.backgroundColor || "#bfdbfe",
        }}
      />
    );
  }

  if (element.type === "shape-circle") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 999,
          backgroundColor: element.backgroundColor || "#f97373",
        }}
      />
    );
  }

  if (element.type === "line") {
    const color = element.backgroundColor || "#111827";
    const thickness = element.thickness || 3;
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
        <div
          style={{
            width: "100%",
            height: thickness,
            borderRadius: 999,
            backgroundColor: color,
          }}
        />
      </div>
    );
  }

  if (element.type === "button") {
    const label = element.label || "Call to Action";
    const bg = element.backgroundColor;
    const textColor = element.textColor || "#ffffff";
    const fontFamily = mapFontFamily(element.fontFamily);
    const fontSize = element.fontSize || 13;
    const textAlign = element.textAlign || "center";

    return (
      <button
        type="button"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 999,
          border: "none",
          background: bg
            ? bg
            : "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #ec4899 100%)",
          color: textColor,
          fontSize,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: "uppercase",
          cursor: interactive && !element.locked ? "text" : "default",
          fontFamily,
          textAlign,
          display: "flex",
          alignItems: "center",
          justifyContent:
            textAlign === "left"
              ? "flex-start"
              : textAlign === "right"
              ? "flex-end"
              : "center",
          paddingInline: 12,
        }}
        onClick={(e) => e.preventDefault()}
      >
        <span
          contentEditable={interactive && !element.locked}
          suppressContentEditableWarning
          onFocus={() => {
            if (interactive) setSelectedId?.(element.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={(e) =>
            onElementTextChange(element.id, "label", e.currentTarget.innerText.trim())
          }
        >
          {label}
        </span>
      </button>
    );
  }

  if (element.type === "icon") {
    const symbol = element.icon || "★";
    const borderColor = element.borderColor || "#111827";
    const textColor = element.textColor || "#111827";

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 999,
          border: `2px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          color: textColor,
          backgroundColor: element.backgroundColor || "transparent",
        }}
      >
        <span
          contentEditable={interactive && !element.locked}
          suppressContentEditableWarning
          onFocus={() => {
            if (interactive) setSelectedId?.(element.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={(e) =>
            onElementTextChange(
              element.id,
              "icon",
              e.currentTarget.innerText.trim().slice(0, 2)
            )
          }
        >
          {symbol}
        </span>
      </div>
    );
  }

  // ✅ TEXT BOX: Rich Text (HTML)
  if (element.type === "text-box") {
    const html = element.html ?? element.text ?? "Text hier eingeben …";
    const bg = element.backgroundColor || "#ffffff";
    const textColor = element.textColor || "#111827";
    const fontFamily = mapFontFamily(element.fontFamily);
    const fontSize = element.fontSize || 13;
    const textAlign = element.textAlign || "left";
    const lineHeight = element.lineHeight || 1.5;

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 16,
          border: "1px solid var(--color-border)",
          backgroundColor: bg,
          padding: 8,
          fontSize,
          lineHeight,
          color: textColor,
          overflow: "hidden",
          fontFamily,
          textAlign,
        }}
      >
        <div
          data-editable="true"
          data-editable-id={element.id}
          contentEditable={interactive && !element.locked}
          suppressContentEditableWarning
          style={{
            width: "100%",
            height: "100%",
            outline: "none",
            whiteSpace: "normal",
          }}
          dangerouslySetInnerHTML={{ __html: html }}
          onMouseDown={(e) => e.stopPropagation()}
          onFocus={() => {
            if (!interactive) return;
            setSelectedId?.(element.id);
            setActiveEditableId?.(element.id);
          }}
          onInput={(e) => {
            onElementTextChange(element.id, "html", e.currentTarget.innerHTML);
          }}
          onBlur={(e) => {
            onElementTextChange(element.id, "html", e.currentTarget.innerHTML);}}
        />
      </div>
    );
  }

  if (element.type === "chip") {
    const label = element.label || "Label";
    const bg = element.backgroundColor || "#111827";
    const textColor = element.textColor || "#f9fafb";
    const fontFamily = mapFontFamily(element.fontFamily);
    const fontSize = element.fontSize || 11;
    const textAlign = element.textAlign || "center";
    const borderColor = element.borderColor || "transparent";

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent:
            textAlign === "left"
              ? "flex-start"
              : textAlign === "right"
              ? "flex-end"
              : "center",
          paddingInline: 10,
        }}
      >
        <span
          contentEditable={interactive && !element.locked}
          suppressContentEditableWarning
          onFocus={() => {
            if (interactive) setSelectedId?.(element.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onBlur={(e) =>
            onElementTextChange(element.id, "label", e.currentTarget.innerText.trim())
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px 10px",
            borderRadius: 999,
            backgroundColor: bg,
            color: textColor,
            border: borderColor === "transparent" ? "none" : `1px solid ${borderColor}`,
            fontSize,
            letterSpacing: 1,
            textTransform: "uppercase",
            fontFamily,
            whiteSpace: "nowrap",
            cursor: interactive && !element.locked ? "text" : "default",
            userSelect: "none",
          }}
        >
          {label}
        </span>
      </div>
    );
  }

  if (element.type === "image-element") {
    const url = element.url || "";
    const placeholder = "Klicke, um ein Bild hinzuzufügen …";
    const borderColor = element.borderColor || "#e5e7eb";
    const bg = element.backgroundColor || "#f9fafb";
    const clickable = interactive && !element.locked;

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 16,
          border: `1px solid ${borderColor}`,
          background: bg,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          cursor: clickable ? "pointer" : "default",
        }}
        onMouseDown={(e) => {
          if (interactive) {
            e.stopPropagation();
            setSelectedId?.(element.id);
          }
        }}
        onClick={
          clickable
            ? () => triggerImageUpload({ type: "image-element", elementId: element.id })
            : undefined
        }
      >
        {url ? (
          <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "var(--color-muted)",
              padding: 8,
              textAlign: "center",
              userSelect: "none",
            }}
          >
            {placeholder}
          </div>
        )}
      </div>
    );
  }

  return null;
};

/* ===========================
   Initial-Elemente
   =========================== */

const createInitialElements = (article, blocks) => {
  const elements = [];
  const {
    title = "",
    subtitle = "",
    short_description = "",
    sideLabel,
    badgeTop,
    badgeBottom,
    badgeCenter,
    infoText,
    hero_image_url,
  } = article || {};

  const titleText = stripHtml(title || "");
  const subtitleText = stripHtml(subtitle || "");
  const descriptionText = stripHtml(short_description || "");
  const infoBoxText = stripHtml(infoText || descriptionText || "");
  const sideLabelText = sideLabel || "@deinprofil";

  elements.push({
    id: "hero",
    type: "hero",
    x: 40,
    y: 40,
    width: 460,
    height: 280,
    rotation: 0,
    opacity: 1,
    zIndex: 30,
    locked: false,
    visible: true,
    imageUrl: hero_image_url || null,
    hasShadow: true,
  });

  elements.push({
    id: "accent",
    type: "accent",
    x: 420,
    y: 220,
    width: 320,
    height: 620,
    rotation: 0,
    opacity: 1,
    zIndex: 10,
    locked: false,
    visible: true,
    backgroundColor: "#e3ebe5",
    hasShadow: false,
  });

  elements.push({
    id: "badge",
    type: "badge",
    x: 60,
    y: 260,
    width: 210,
    height: 52,
    rotation: 0,
    opacity: 1,
    zIndex: 40,
    locked: false,
    visible: !!(badgeTop || badgeBottom || badgeCenter),
    topText: badgeTop || "HIGHLIGHT",
    bottomText: badgeBottom || "MIT VIEL LIEBE",
    centerText: badgeCenter || "",
    backgroundColor: "#ffffff",
    textColor: "#111827",
    borderColor: "rgba(15,23,42,0.25)",
    fontFamily: "sans",
    fontSize: 10,
    hasShadow: true,
  });

  elements.push({
    id: "verticalLabel",
    type: "verticalLabel",
    x: 4,
    y: 420,
    width: 160,
    height: 30,
    rotation: -90,
    opacity: 1,
    zIndex: 50,
    locked: false,
    visible: true,
    text: sideLabelText,
    textColor: "#4b5563",
    fontFamily: "sans",
    fontSize: 12,
    letterSpacing: 3,
    hasShadow: false,
  });

  elements.push({
    id: "title",
    type: "title",
    x: 40,
    y: 350,
    width: 460,
    height: 110,
    rotation: 0,
    opacity: 1,
    zIndex: 50,
    locked: false,
    visible: true,
    title: titleText || "Titel eingeben",
    subtitle: subtitleText || "",
    fontFamily: "serif",
    fontSize: 30,
    fontWeight: 600,
    textAlign: "center",
    textColor: "#1f2933",
    subtitleColor: "#374151",
    letterSpacing: 6,
    hasShadow: false,
  });

  elements.push({
    id: "infoBox",
    type: "infoBox",
    x: 430,
    y: 760,
    width: 320,
    height: 140,
    rotation: 0,
    opacity: 1,
    zIndex: 60,
    locked: false,
    visible: true,
    text: infoBoxText || "Zusätzliche Infos hier eintragen …",
    html: infoBoxText || "Zusätzliche Infos hier eintragen …",
    textColor: "#374151",
    backgroundColor: "#ffffff",
    fontFamily: "sans",
    fontSize: 12,
    textAlign: "left",
    lineHeight: 1.6,
    hasShadow: true,
  });

  (blocks || []).forEach((block, index) => {
    elements.push({
      id: `block-${block.id || index}`,
      type: "block",
      blockId: block.id,
      x: 40,
      y: 500 + index * 140,
      width: 330,
      height: 120,
      rotation: 0,
      opacity: 1,
      zIndex: 40,
      locked: false,
      visible: true,
      hasShadow: true,
      fontFamily: "sans",
      fontSize: 14,
      textAlign: "left",
      textColor: "#111827",
      backgroundColor: "#ffffff",
      lineHeight: 1.6,
    });
  });

  return elements;
};

/* ===========================
   Inspector (RECHTS)
   UX:
   - Global-Änderungen nur wenn explizit aktiviert (Toggle)
   - Ohne Auswahl NICHT automatisch alles ändern
   =========================== */

const Inspector = ({
  elements = [],
  selectedId,
  selectedElement,
  interactive,
  activeEditableId,
  globalMode,
  setGlobalMode,
  onSelect,
  onChange,
  onBringFront,
  onSendBack,
  onDelete,
  onApplyGlobalPatch,
}) => {
  const [query, setQuery] = React.useState("");

  const [linkUrl, setLinkUrl] = React.useState("");
  const [selTextColor, setSelTextColor] = React.useState("#111827");
  const [selHighlightColor, setSelHighlightColor] = React.useState("#fde68a");

  const [groupsCollapsed, setGroupsCollapsed] = React.useState({
    pick: false,
    basis: false,
    colors: false,
    typography: false,
    format: false,
    actions: false,
  });

  const hasSelection = !!selectedElement;

  const typeLabel = (t) => ELEMENT_TYPE_LABELS?.[t] || t || "Element";

  const displayName = (el) => {
    if (!el) return "—";
    if (el.type === "title") return "Titel";
    if (el.type === "hero") return "Hero-Bild";
    if (el.type === "infoBox") return "Infobox";
    if (el.type === "badge") return "Badge";
    if (el.type === "verticalLabel") return "Seitenlabel";
    if (el.type === "block") return `Artikel-Block (${el.blockId || el.id})`;
    if (el.type === "button") return `Button (${el.label || el.id})`;
    if (el.type === "text-box") {
      const t = String(el.text || "").replace(/\s+/g, " ").trim();
      return `Textfeld (${(t || el.id).slice(0, 22)}${t.length > 22 ? "…" : ""})`;
    }
    return `${typeLabel(el.type)} (${el.id})`;
  };

  const q = query.trim().toLowerCase();

  const visibleElements = React.useMemo(
    () => (elements || []).filter((el) => el && el.visible !== false),
    [elements]
  );

  const filtered = React.useMemo(() => {
    const list = [...visibleElements].sort((a, b) => (b?.zIndex ?? 0) - (a?.zIndex ?? 0));
    if (!q) return list;
    return list.filter((el) => {
      const hay = `${displayName(el)} ${el.type} ${el.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [visibleElements, q]);

  const grouped = React.useMemo(() => {
    return filtered.reduce((acc, el) => {
      const key = typeLabel(el.type);
      if (!acc[key]) acc[key] = [];
      acc[key].push(el);
      return acc;
    }, {});
  }, [filtered]);

  // UI fallback (wenn nichts ausgewählt): wir zeigen "global" Steuerung, aber patchen nur bei aktivem GlobalMode
  const element = selectedElement || {
    id: "__none__",
    type: "title",
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 0,
    rotation: 0,
    backgroundColor: "#ffffff",
    textColor: "#111827",
    subtitleColor: "#374151",
    borderColor: "#111827",
    fontFamily: "sans",
    fontSize: 14,
    fontWeight: 400,
    textAlign: "left",
    thickness: 3,
    hasShadow: true,
    lineHeight: 1.6,
  };

  const update = (patch) => {
    if (!patch) return;

    // Änderung am selektierten Element
    if (selectedElement) {
      onChange?.({ ...selectedElement, ...patch });

      // ✅ UX: Bei aktiver Textbearbeitung Fokus/Marker im Element halten,
      // damit man z.B. Schriftgröße mehrfach ändern kann ohne wieder ins Textfeld zu klicken.
      if (hasRichFocus) {
        requestAnimationFrame(() => {
          try {
            focusActiveEditable();
          } catch {}
        });
      }
      return;
    }

    // ✅ NICHT automatisch global
    if (globalMode) {
      onApplyGlobalPatch?.(patch);

      if (hasRichFocus) {
        requestAnimationFrame(() => {
          try {
            focusActiveEditable();
          } catch {}
        });
      }
    }
  };

  const supportsBgColor = SUPPORTS_BG_COLOR.includes(element.type);
  const supportsTextColor = SUPPORTS_TEXT_COLOR.includes(element.type);
  const supportsSubtitleColor = SUPPORTS_SUBTITLE_COLOR.includes(element.type);
  const supportsBorderColor = SUPPORTS_BORDER_COLOR.includes(element.type);
  const supportsTypography = SUPPORTS_TYPOGRAPHY.includes(element.type);
  const supportsShadow = SUPPORTS_SHADOW.includes(element.type);
  const supportsLineThickness = SUPPORTS_LINE_THICKNESS.includes(element.type);
  const supportsLineHeight = SUPPORTS_LINE_HEIGHT.includes(element.type);

  const hasRichFocus = !!(interactive && activeEditableId);

  // ✅ Merkt sich die aktuelle Text-Selektion im aktiven contentEditable,
  // damit Toolbar (Farbe/Highlight/Buttons) auch nach Klick in die Sidebar funktioniert.
  const savedSelectionRef = React.useRef(null);

  const getActiveEditableNode = React.useCallback(() => {
    if (!interactive || !activeEditableId) return null;
    const selId = CSS?.escape ? CSS.escape(activeEditableId) : activeEditableId;
    return document?.querySelector?.(`[data-editable-id="${selId}"]`) || null;
  }, [activeEditableId, interactive]);

  const restoreSelection = React.useCallback(() => {
    if (!interactive || !activeEditableId) return;
    const node = getActiveEditableNode();
    if (!node) return;

    // Fokus zurückholen
    if (typeof node.focus === "function") node.focus();

    const saved = savedSelectionRef.current;
    const selection = window.getSelection?.();
    if (!saved || !selection) return;

    try {
      selection.removeAllRanges();
      selection.addRange(saved);
    } catch {
      // Ignorieren (z.B. wenn Range ungültig geworden ist)
    }
  }, [activeEditableId, getActiveEditableNode, interactive]);

  React.useEffect(() => {
    if (!interactive) return;

    const handler = () => {
      if (!activeEditableId) return;
      const node = getActiveEditableNode();
      const selection = window.getSelection?.();
      if (!node || !selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const anchor = selection.anchorNode;
      const focus = selection.focusNode;

      // Nur speichern, wenn Selektion wirklich im aktiven Editor ist
      const inside =
        (anchor && node.contains(anchor)) ||
        (focus && node.contains(focus)) ||
        (range.commonAncestorContainer && node.contains(range.commonAncestorContainer));

      if (!inside) return;

      // cloneRange() ist wichtig, sonst "lebt" die Range weiter und wird ungültig
      savedSelectionRef.current = range.cloneRange();
    };

    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, [activeEditableId, getActiveEditableNode, interactive]);

  const focusActiveEditable = React.useCallback(() => {
    if (!interactive || !activeEditableId) return;
    const node = getActiveEditableNode();
    if (node && typeof node.focus === "function") node.focus();
  }, [activeEditableId, getActiveEditableNode, interactive]);

  const execSafe = (command) => {
    if (!interactive || !activeEditableId) return;
    restoreSelection();
    exec(command);
  };

  const execValueSafe = (command, value) => {
    if (!interactive || !activeEditableId) return;
    restoreSelection();
    execWithValue(command, value);
  };

  const fontToken = element.fontFamily || "sans";
  
const fontSizeValue = element.fontSize || 14;

const FONT_MIN = 8;
const FONT_MAX = 120;
const FONT_PRESETS = [10, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60];

const clampNumber = (v, min, max) => {
  const n = Number(v);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const setFontSize = (v) => {
  update({ fontSize: clampNumber(v, FONT_MIN, FONT_MAX) });
};
  const fontWeightValue = element.fontWeight || (element.type === "title" ? 600 : 400);
  const textAlignValue = element.textAlign || "left";
  const thicknessValue = element.thickness || 3;
  const lineHeightValue = element.lineHeight || 1.6;

  const commonLabel = { fontSize: 12, display: "block", marginBottom: 4 };

  const commonBtn = (extra = {}) => ({
    width: "100%",
    fontSize: 11,
    padding: "6px 8px",
    borderRadius: 999,
    border: "1px solid var(--color-border)",
    background: "var(--color-card)",
    cursor: "pointer",
    ...extra,
  });

  const Group = ({ id, title, icon, children }) => {
    const collapsed = !!groupsCollapsed[id];
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <button
          type="button"
          style={{ ...sidebarButtonStyle, justifyContent: "space-between", width: "100%" }}
          onClick={() => setGroupsCollapsed((p) => ({ ...p, [id]: !p[id] }))}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={sidebarButtonIconStyle}>{icon}</span>
            <span>{title}</span>
          </span>
          <span>{collapsed ? "▸" : "▾"}</span>
        </button>

        {!collapsed && <div style={{ display: "grid", gap: 12 }}>{children}</div>}
      </div>
    );
  };

  const bgHex = toHexOr(element.backgroundColor, "#ffffff");
  const textHex = toHexOr(element.textColor, "#111827");
  const subHex = toHexOr(element.subtitleColor, "#374151");
  const borderHex = toHexOr(element.borderColor, "#111827");

  const bgLabel = element.type === "line" ? "Linienfarbe" : "Hintergrundfarbe";

  const globalHint = !hasSelection ? (
    <div style={{ fontSize: 11, color: "var(--color-muted)", lineHeight: 1.35 }}>
      Kein Element ausgewählt.{" "}
      <b>Global</b> wirkt nur wenn du den Toggle aktivierst (damit sich nicht „aus Versehen“ alles ändert).
    </div>
  ) : null;

  return (
    <div style={{ fontSize: 12, color: "var(--color-text)", display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
          {hasSelection ? (
            <span>
              Modus: <b>Element</b>
            </span>
          ) : (
            <span>
              Modus: <b>Keine Auswahl</b>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setGlobalMode?.(!globalMode)}
          style={{
            fontSize: 11,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid var(--color-border)",
            background: globalMode ? "rgba(34,197,94,0.14)" : "var(--color-card)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          title="Global-Änderungen explizit aktivieren"
        >
          {globalMode ? "✓ Global aktiv" : "Global aus"}
        </button>
      </div>

      {globalHint}

      <Group id="pick" title="Auswahl" icon="⌁">
        <div>
          <label style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Element auswählen</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen (Typ, Titel, ID)…"
            style={{
              width: "100%",
              fontSize: 12,
              padding: "8px 10px",
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
              marginBottom: 8,
              outline: "none",
            }}
          />
          <select
            value={selectedId || ""}
            onChange={(e) => onSelect?.(e.target.value || null)}
            style={{
              width: "100%",
              fontSize: 12,
              padding: "8px 10px",
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
              cursor: "pointer",
            }}
          >
            <option value="">— nichts ausgewählt —</option>
            {Object.entries(grouped).map(([groupName, els]) => (
              <optgroup key={groupName} label={`${groupName} (${els.length})`}>
                {els.map((el) => (
                  <option key={el.id} value={el.id}>
                    {displayName(el)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--color-muted)" }}>
            {hasSelection ? (
              <span>
                Ausgewählt: <b>{displayName(selectedElement)}</b>
              </span>
            ) : (
              <span>Kein Element ausgewählt.</span>
            )}
          </div>
        </div>
      </Group>

      <Group id="basis" title="Basis" icon="👁">
        <div>
          <label style={commonLabel}>Sichtbarkeit</label>
          <button
            type="button"
            onClick={() => update({ visible: !element.visible })}
            style={
              commonBtn({
                background: element.visible
                  ? "rgba(34,197,94,0.14)"
                  : "rgba(239,68,68,0.14)",
              })
            }
            title={hasSelection ? "Toggle Sichtbarkeit" : "Global (nur wenn aktiv)"}
          >
            {element.visible ? "Sichtbar" : "Ausgeblendet"}
          </button>
        </div>

        <div>
          <label style={commonLabel}>Sperre</label>
          <button
            type="button"
            onClick={() => update({ locked: !element.locked })}
            style={
              commonBtn({
                background: element.locked
                  ? "rgba(245,158,11,0.12)"
                  : "var(--color-card)",
              })
            }
            title={hasSelection ? "Toggle Sperre" : "Global (nur wenn aktiv)"}
          >
            {element.locked ? "Gesperrt" : "Beweglich"}
          </button>
        </div>

        {supportsShadow && (
          <div>
            <label style={commonLabel}>Schatten</label>
            <button
              type="button"
              onClick={() => update({ hasShadow: !element.hasShadow })}
              style={
                commonBtn({
                  background: element.hasShadow
                    ? "rgba(59,130,246,0.14)"
                    : "var(--color-card)",
                })
              }
            >
              {element.hasShadow ? "Schatten aktiv" : "Kein Schatten"}
            </button>
          </div>
        )}

        {supportsLineThickness && (
          <div>
            <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span>Linienstärke</span>
              <span>{thicknessValue}px</span>
            </label>
            <input
              type="range"
              min={1}
              max={20}
              value={thicknessValue}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => update({ thickness: Number(e.target.value) })}
              onInput={(e) => update({ thickness: Number(e.target.value) })}
              style={{ width: "100%" }}
            />
          </div>
        )}

        <div>
          <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>Opacity</span>
            <span>{Math.round((element.opacity ?? 1) * 100)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={element.opacity ?? 1}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => update({ opacity: Number(e.target.value) })}
            onInput={(e) => update({ opacity: Number(e.target.value) })}
            style={{ width: "100%" }}
          />
        </div>
      </Group>

      <Group id="colors" title="Farben" icon="🎨">
        {(supportsBgColor || (globalMode && !hasSelection)) && (
          <div>
            <label
              style={{
                fontSize: 12,
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span>{bgLabel}</span>
              <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                {element.backgroundColor || "#ffffff"}
              </span>
            </label>
            <input
              type="color"
              value={bgHex}
              onChange={(e) => update({ backgroundColor: e.target.value })}
              style={{ width: "100%" }}
              disabled={!hasSelection && !globalMode}
              title={!hasSelection && !globalMode ? "Aktiviere Global oder wähle ein Element" : ""}
            />
            {!isHexColor(element.backgroundColor) && element.backgroundColor ? (
              <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 6 }}>
                Hinweis: Aktuell ist keine HEX-Farbe gespeichert (z.B. Gradient). Der Picker zeigt daher
                einen Ersatzwert.
              </div>
            ) : null}
          </div>
        )}

        {(supportsTextColor || (globalMode && !hasSelection)) && (
          <div>
            <label
              style={{
                fontSize: 12,
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span>Textfarbe</span>
              <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                {element.textColor || "#111827"}
              </span>
            </label>
            <input
              type="color"
              value={textHex}
              onChange={(e) => update({ textColor: e.target.value })}
              style={{ width: "100%" }}
              disabled={!hasSelection && !globalMode}
              title={!hasSelection && !globalMode ? "Aktiviere Global oder wähle ein Element" : ""}
            />
          </div>
        )}

        {(supportsSubtitleColor || (globalMode && !hasSelection)) && (
          <div>
            <label
              style={{
                fontSize: 12,
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span>Untertitel-Farbe</span>
              <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                {element.subtitleColor || "#374151"}
              </span>
            </label>
            <input
              type="color"
              value={subHex}
              onChange={(e) => update({ subtitleColor: e.target.value })}
              style={{ width: "100%" }}
              disabled={!hasSelection && !globalMode}
            />
          </div>
        )}

        {(supportsBorderColor || (globalMode && !hasSelection)) && (
          <div>
            <label
              style={{
                fontSize: 12,
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span>Rahmenfarbe</span>
              <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                {element.borderColor || "#111827"}
              </span>
            </label>
            <input
              type="color"
              value={borderHex}
              onChange={(e) => update({ borderColor: e.target.value })}
              style={{ width: "100%" }}
              disabled={!hasSelection && !globalMode}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Farbpaletten</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {COLOR_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                title={`${p.name} (Element)`}
                onClick={() => update({ backgroundColor: p.bg, textColor: p.text })}
                disabled={!hasSelection && !globalMode}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  border: "1px solid var(--color-border)",
                  padding: 0,
                  cursor: !hasSelection && !globalMode ? "not-allowed" : "pointer",
                  opacity: !hasSelection && !globalMode ? 0.5 : 1,
                  background: `linear-gradient(135deg, ${p.bg} 50%, ${p.text} 50%)`,
                }}
              />
            ))}
          </div>
        </div>
      </Group>

      <Group id="typography" title="Typografie" icon="T">
        <div>
          <h4 style={{ fontSize: 12, margin: "0 0 6px", fontWeight: 600 }}>Typografie</h4>

          <div style={{ marginBottom: 8 }}>
            <label style={commonLabel}>Schriftart</label>
            <select
              value={fontToken}
              onChange={(e) => update({ fontFamily: e.target.value })}
              style={{ width: "100%", fontSize: 12 }}
              disabled={!hasSelection && !globalMode}
            >
              <option value="sans">Sans (Inter)</option>
              <option value="serif">Serif (Playfair)</option>
              <option value="display">Display (DM Sans)</option>
              <option value="mono">Mono (Space Mono)</option>
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span>Schriftgröße</span>
              <span style={{ fontFamily: "monospace", fontSize: 11 }}>{fontSizeValue}px</span>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 36px", gap: 6, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setFontSize(fontSizeValue - 1)}
                onMouseDown={(e) => e.preventDefault()}
                disabled={!hasSelection && !globalMode}
                style={{
                  height: 32,
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  cursor: !hasSelection && !globalMode ? "not-allowed" : "pointer",
                  opacity: !hasSelection && !globalMode ? 0.55 : 1,
                }}
                title="1px kleiner"
              >
                −
              </button>

              <input
                type="number"
                value={fontSizeValue}
                min={FONT_MIN}
                max={FONT_MAX}
                step={1}
                onChange={(e) => setFontSize(Number(e.target.value))}
                onMouseDown={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  // Pfeile: normal 1px, mit Shift 5px
                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault();
                    const step = e.shiftKey ? 5 : 1;
                    setFontSize(fontSizeValue + (e.key === "ArrowUp" ? step : -step));
                  }
                }}
                disabled={!hasSelection && !globalMode}
                style={{
                  width: "100%",
                  height: 32,
                  padding: "0 10px",
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  fontSize: 12,
                  outline: "none",
                  fontFamily: "monospace",
                  opacity: !hasSelection && !globalMode ? 0.55 : 1,
                }}
                title="Zahl eingeben (Shift + Pfeile = 5px Schritte)"
              />

              <button
                type="button"
                onClick={() => setFontSize(fontSizeValue + 1)}
                onMouseDown={(e) => e.preventDefault()}
                disabled={!hasSelection && !globalMode}
                style={{
                  height: 32,
                  borderRadius: 12,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  cursor: !hasSelection && !globalMode ? "not-allowed" : "pointer",
                  opacity: !hasSelection && !globalMode ? 0.55 : 1,
                }}
                title="1px größer"
              >
                +
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {FONT_PRESETS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFontSize(v)}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={!hasSelection && !globalMode}
                  style={{
                    fontSize: 11,
                    padding: "5px 8px",
                    borderRadius: 999,
                    border: "1px solid var(--color-border)",
                    background: v === fontSizeValue ? "var(--color-borderSubtle)" : "#ffffff",
                    cursor: !hasSelection && !globalMode ? "not-allowed" : "pointer",
                    opacity: !hasSelection && !globalMode ? 0.55 : 1,
                  }}
                  title={`${v}px`}
                >
                  {v}px
                </button>
              ))}
            </div>

            <div style={{ marginTop: 8 }}>
              <input
                type="range"
                min={FONT_MIN}
                max={FONT_MAX}
                step={1}
                value={fontSizeValue}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{ width: "100%" }}
                disabled={!hasSelection && !globalMode}
                title="Slider"
              />
            </div>
          </div>

          {SUPPORTS_LINE_HEIGHT.includes(element.type) && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span>Zeilenabstand</span>
                <span>{Number(lineHeightValue).toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={1}
                max={2.4}
                step={0.05}
                value={lineHeightValue}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => update({ lineHeight: Number(e.target.value) })}
                onInput={(e) => update({ lineHeight: Number(e.target.value) })}
                style={{ width: "100%" }}
                disabled={!hasSelection && !globalMode}
              />
            </div>
          )}

          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Ausrichtung</label>
              <div
                style={{
                  display: "flex",
                  borderRadius: 999,
                  border: "1px solid var(--color-border)",
                  overflow: "hidden",
                  opacity: !hasSelection && !globalMode ? 0.55 : 1,
                }}
              >
                {["left", "center", "right", "justify"].map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => update({ textAlign: align })}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={!hasSelection && !globalMode}
                    style={{
                      flex: 1,
                      fontSize: 11,
                      padding: "4px 0",
                      border: "none",
                      background: textAlignValue === align ? "var(--color-borderSubtle)" : "transparent",
                      cursor: !hasSelection && !globalMode ? "not-allowed" : "pointer",
                    }}
                  >
                    {align === "left" ? "⟸" : align === "center" ? "☰" : align === "right" ? "⟹" : "≡"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Fett</label>
              <button
                type="button"
                onClick={() => update({ fontWeight: fontWeightValue >= 600 ? 400 : 700 })}
                disabled={!hasSelection && !globalMode}
                onMouseDown={(e) => e.preventDefault()}
                style={{
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 999,
                  border: "1px solid var(--color-border)",
                  background: fontWeightValue >= 600 ? "var(--color-borderSubtle)" : "#ffffff",
                  cursor: !hasSelection && !globalMode ? "not-allowed" : "pointer",
                  opacity: !hasSelection && !globalMode ? 0.55 : 1,
                }}
              >
                F
              </button>
            </div>
          </div>
        </div>
      </Group>

      <Group id="format" title="Textformat" icon="✍️">
        <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
          {hasRichFocus
            ? "Formatierung wirkt auf die aktuelle Text-Auswahl."
            : "Klicke in ein Textfeld/Infobox, markiere Text → dann hier formatieren."}
        </div>

        <div style={{ display: "grid", gap: 10, opacity: hasRichFocus ? 1 : 0.55 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            <button
              type="button"
              disabled={!hasRichFocus}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execSafe("bold")}
              style={commonBtn({ padding: "6px 0" })}
              title="Fett"
            >
              <b>B</b>
            </button>
            <button
              type="button"
              disabled={!hasRichFocus}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execSafe("italic")}
              style={commonBtn({ padding: "6px 0" })}
              title="Kursiv"
            >
              <i>I</i>
            </button>
            <button
              type="button"
              disabled={!hasRichFocus}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execSafe("underline")}
              style={commonBtn({ padding: "6px 0" })}
              title="Unterstrichen"
            >
              <u>U</u>
            </button>
            <button
              type="button"
              disabled={!hasRichFocus}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execSafe("strikeThrough")}
              style={commonBtn({ padding: "6px 0" })}
              title="Durchgestrichen"
            >
              <span style={{ textDecoration: "line-through" }}>S</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
            <button
              type="button"
              disabled={!hasRichFocus}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execSafe("insertUnorderedList")}
              style={commonBtn()}
              title="Aufzählung"
            >
              • Aufzählung
            </button>
            <button
              type="button"
              disabled={!hasRichFocus}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execSafe("insertOrderedList")}
              style={commonBtn()}
              title="Nummerierung"
            >
              1. Nummerierung
            </button>
          </div>

          <div>
            <div style={{ fontSize: 12, marginBottom: 6, fontWeight: 600 }}>Farbe & Highlight</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--color-muted)", display: "block", marginBottom: 4 }}>
                  Textfarbe
                </label>
                <input
                  type="color"
                  value={selTextColor}
                  disabled={!hasRichFocus}
                  onChange={(e) => {
                    setSelTextColor(e.target.value);
                    execValueSafe("foreColor", e.target.value);
                  }}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--color-muted)", display: "block", marginBottom: 4 }}>
                  Highlight
                </label>
                <input
                  type="color"
                  value={selHighlightColor}
                  disabled={!hasRichFocus}
                  onChange={(e) => {
                    setSelHighlightColor(e.target.value);
                    execValueSafe("hiliteColor", e.target.value);
                  }}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, marginBottom: 6, fontWeight: 600 }}>Links</div>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Link (z.B. example.com)"
              style={{
                width: "100%",
                fontSize: 12,
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                outline: "none",
                marginBottom: 6,
              }}
              onMouseDown={(e) => {
                if (hasRichFocus) e.preventDefault();
              }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
              <button
                type="button"
                disabled={!hasRichFocus}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const url = normalizeUrl(linkUrl);
                  if (!url) return;
                  execValueSafe("createLink", url);
                }}
                style={commonBtn()}
              >
                🔗 Link
              </button>
              <button
                type="button"
                disabled={!hasRichFocus}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execSafe("unlink")}
                style={commonBtn()}
              >
                ⛔ Link entfernen
              </button>
            </div>
          </div>
        </div>
      </Group>

      <Group id="actions" title="Aktionen" icon="✕">
        <button
          type="button"
          disabled={!hasSelection}
          onClick={() => onDelete?.(selectedElement?.id)}
          style={{
            width: "100%",
            fontSize: 11,
            padding: "6px 8px",
            borderRadius: 999,
            border: "1px solid #fecaca",
            background: !hasSelection ? "#f9fafb" : "#fee2e2",
            color: !hasSelection ? "#6b7280" : "#b91c1c",
            cursor: hasSelection ? "pointer" : "default",
          }}
        >
          Element löschen
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <button
            type="button"
            disabled={!hasSelection}
            onClick={onBringFront}
            style={commonBtn({ background: "var(--color-soft)" })}
            title="Element nach vorne"
          >
            ⬆︎ nach vorn
          </button>
          <button
            type="button"
            disabled={!hasSelection}
            onClick={onSendBack}
            style={commonBtn({ background: "var(--color-soft)" })}
            title="Element nach hinten"
          >
            ⬇︎ nach hinten
          </button>
        </div>
      </Group>
    </div>
  );
};

/* ===========================
   Haupt-Komponente
   UX: Global-Patch nur explizit via Toggle
   UX: Text-Focus selektiert automatisch das Element
   =========================== */

const FlyerLayout = ({
  article = {},
  mode = "preview",
  onElementsChange,
  showToolbar = true,
  compact = false,
  onUploadImage,
  onChangeHeroImageUrl,
}) => {
  const { language } = useLanguage();
  const { isDark } = useTheme();

  const ui = {
    softBg: "var(--color-soft)",
    cardBg: "var(--color-card)",
    text: "var(--color-text)",
    muted: "var(--color-muted)",
    border: "var(--color-border)",
    borderSubtle: "var(--color-borderSubtle)",
    glassBg: isDark ? "rgba(20,26,35,0.88)" : "rgba(255,255,255,0.85)",
  };

  const {
    hero_image_url,
    title = "",
    subtitle = "",
    short_description = "",
    sideLabel,
    badgeTop,
    badgeBottom,
    badgeCenter,
    infoText,
    blocks = [],
    layoutElements,
    layout_elements,
  } = article;

  // ✅ Prefer normalized fields (ArticlePage normalizes these).
  // Fallback to language-specific raw fields only if a caller did not normalize.
  const effectiveBlocks =
    Array.isArray(article?.blocks)
      ? article.blocks
      : language === "en"
      ? article?.blocks_en || article?.blocks_de || blocks || []
      : article?.blocks_de || article?.blocks_en || blocks || [];

  const effectiveLayoutElements =
    Array.isArray(article?.layout_elements)
      ? article.layout_elements
      : language === "en"
      ? article?.layout_elements_en ||
        article?.layout_elements_de ||
        layout_elements ||
        layoutElements ||
        []
      : article?.layout_elements_de ||
        article?.layout_elements_en ||
        layout_elements ||
        layoutElements ||
        [];

  const titleText = stripHtml(title || "");
  const subtitleText = stripHtml(subtitle || "");
  const descriptionText = stripHtml(short_description || "");
  const infoBoxText = stripHtml(infoText || descriptionText || "");
  const sideLabelText = sideLabel || "@deinprofil";

  const [viewMode, setViewMode] = React.useState(mode);
  const interactive = viewMode === "editor";

  // ✅ neu: Global-Patch Toggle (damit sich NICHT alles aus Versehen ändert)
  const [globalMode, setGlobalMode] = React.useState(false);

  const resolveLayoutElements = React.useCallback(() => {
    const source =
      Array.isArray(effectiveLayoutElements) && effectiveLayoutElements.length > 0
        ? effectiveLayoutElements
        : null;

    return source && source.length ? source : createInitialElements(article, effectiveBlocks);
  }, [article, effectiveBlocks, effectiveLayoutElements]);

  const [elements, setElements] = React.useState(() => resolveLayoutElements());
  const [selectedId, setSelectedId] = React.useState(null);

  // ✅ Auto-switch: wenn Sprache wechselt (oder Artikel neu), im VIEW/PREVIEW neu aus DB normalisieren
  // Im Editor-Modus überschreiben wir den Nutzer nicht.
  React.useEffect(() => {
    if (interactive) return;
    setElements(resolveLayoutElements());
  }, [interactive, resolveLayoutElements, language, article?.id]);

  const [rightCollapsed, setRightCollapsed] = React.useState(false);

  const [activeEditableId, setActiveEditableId] = React.useState(null);

  const historyRef = React.useRef({ past: [], future: [] });
  const skipHistoryRef = React.useRef(false);
  const [historyTick, setHistoryTick] = React.useState(0);

  React.useEffect(() => {
    setSelectedId(null);setElements(resolveLayoutElements());
    historyRef.current = { past: [], future: [] };
    setHistoryTick((t) => t + 1);
    setGlobalMode(false);
  }, [article?.id, resolveLayoutElements]);

  const selectedElement = React.useMemo(
    () => elements.find((el) => el.id === selectedId) || null,
    [elements, selectedId]
  );

  const setElementsAndNotify = React.useCallback(
    (updater) => {
      setElements((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;

        if (interactive && onElementsChange) onElementsChange(next);

        if (interactive && !skipHistoryRef.current && prev !== next) {
          historyRef.current = {
            past: [...historyRef.current.past, prev],
            future: [],
          };
          setHistoryTick((t) => t + 1);
        }

        return next;
      });
    },
    [interactive, onElementsChange]
  );

  const updateElement = React.useCallback(
    (updated) => {
      setElementsAndNotify((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
    },
    [setElementsAndNotify]
  );

  const applyGlobalPatch = React.useCallback(
    (patch) => {
      if (!patch) return;
      setElementsAndNotify((prev) =>
        prev.map((el) => {
          const next = { ...el };

          if ("visible" in patch) next.visible = patch.visible;
          if ("locked" in patch) next.locked = patch.locked;
          if ("opacity" in patch) next.opacity = patch.opacity;

          if ("hasShadow" in patch && SUPPORTS_SHADOW.includes(el.type)) next.hasShadow = patch.hasShadow;
          if ("thickness" in patch && SUPPORTS_LINE_THICKNESS.includes(el.type)) next.thickness = patch.thickness;

          if ("backgroundColor" in patch && SUPPORTS_BG_COLOR.includes(el.type))
            next.backgroundColor = patch.backgroundColor;

          if ("textColor" in patch && SUPPORTS_TEXT_COLOR.includes(el.type))
            next.textColor = patch.textColor;

          if ("subtitleColor" in patch && SUPPORTS_SUBTITLE_COLOR.includes(el.type))
            next.subtitleColor = patch.subtitleColor;

          if ("borderColor" in patch && SUPPORTS_BORDER_COLOR.includes(el.type))
            next.borderColor = patch.borderColor;

          if ("fontFamily" in patch && SUPPORTS_TYPOGRAPHY.includes(el.type))
            next.fontFamily = patch.fontFamily;

          if ("fontSize" in patch && SUPPORTS_TYPOGRAPHY.includes(el.type))
            next.fontSize = patch.fontSize;

          if ("fontWeight" in patch && SUPPORTS_TYPOGRAPHY.includes(el.type))
            next.fontWeight = patch.fontWeight;

          if ("textAlign" in patch && SUPPORTS_TYPOGRAPHY.includes(el.type))
            next.textAlign = patch.textAlign;

          if ("lineHeight" in patch && SUPPORTS_LINE_HEIGHT.includes(el.type))
            next.lineHeight = patch.lineHeight;

          return next;
        })
      );
    },
    [setElementsAndNotify]
  );

  const handleUndo = React.useCallback(() => {
    if (!interactive) return;
    const { past, future } = historyRef.current;
    if (!past.length) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    const current = elements;

    skipHistoryRef.current = true;
    setElements(previous);
    if (onElementsChange) onElementsChange(previous);
    historyRef.current = { past: newPast, future: [current, ...future] };
    skipHistoryRef.current = false;
    setHistoryTick((t) => t + 1);
  }, [elements, interactive, onElementsChange]);

  const handleRedo = React.useCallback(() => {
    if (!interactive) return;
    const { past, future } = historyRef.current;
    if (!future.length) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const current = elements;

    skipHistoryRef.current = true;
    setElements(next);
    if (onElementsChange) onElementsChange(next);
    historyRef.current = { past: [...past, current], future: newFuture };
    skipHistoryRef.current = false;
    setHistoryTick((t) => t + 1);
  }, [elements, interactive, onElementsChange]);

  const handleBringFront = React.useCallback(() => {
    if (!selectedElement) return;
    const maxZ = Math.max(...elements.map((el) => el.zIndex || 0), 0);
    updateElement({ ...selectedElement, zIndex: maxZ + 1 });
  }, [elements, selectedElement, updateElement]);

  const handleSendBack = React.useCallback(() => {
    if (!selectedElement) return;
    const minZ = Math.min(...elements.map((el) => el.zIndex || 0), 0);
    updateElement({ ...selectedElement, zIndex: minZ - 1 });
  }, [elements, selectedElement, updateElement]);

  const handleDeleteSelected = React.useCallback(() => {
    if (!selectedElement) return;
    setElementsAndNotify((prev) => prev.filter((el) => el.id !== selectedElement.id));
    setSelectedId(null);
  }, [selectedElement, setElementsAndNotify]);

  const handleDeleteElementById = React.useCallback(
    (id) => {
      setElementsAndNotify((prev) => prev.filter((el) => el.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [selectedId, setElementsAndNotify]
  );

  const handleElementTextChange = React.useCallback(
    (id, field, value) => {
      setElementsAndNotify((prev) =>
        prev.map((el) => (el.id === id ? { ...el, [field]: value } : el))
      );
    },
    [setElementsAndNotify]
  );

  const fileInputRef = React.useRef(null);
  const pendingImageRequestRef = React.useRef(null);

  const triggerImageUpload = React.useCallback(
    (payload) => {
      if (!onUploadImage) return;
      pendingImageRequestRef.current = payload;
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.click();
      }
    },
    [onUploadImage]
  );

  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0];
    const payload = pendingImageRequestRef.current;
    pendingImageRequestRef.current = null;

    if (!file || !payload || !onUploadImage) return;

    const url = await onUploadImage(file);
    if (!url) return;

    if (payload.type === "hero") {
      if (onChangeHeroImageUrl) onChangeHeroImageUrl(url);
      setElementsAndNotify((prev) =>
        prev.map((el) => (el.id === payload.elementId ? { ...el, imageUrl: url } : el))
      );
      return;
    }

    if (payload.type === "image-element") {
      setElementsAndNotify((prev) =>
        prev.map((el) => (el.id === payload.elementId ? { ...el, url } : el))
      );
    }
  };

  const handleApplyTheme = (preset) => {
    // bewusst global – Theme ist ein globales Feature
    setElementsAndNotify((prev) =>
      prev.map((el) => {
        if (["accent", "shape-rect", "shape-circle", "image-element"].includes(el.type)) {
          return { ...el, backgroundColor: preset.bg };
        }
        if (["infoBox", "block", "text-box"].includes(el.type)) {
          return { ...el, backgroundColor: "#ffffff", textColor: preset.text };
        }
        if (["badge", "chip", "button"].includes(el.type)) {
          return { ...el, backgroundColor: preset.bg, textColor: preset.text };
        }
        if (["title", "verticalLabel"].includes(el.type)) {
          return { ...el, textColor: preset.text };
        }
        if (el.type === "line") {
          return { ...el, backgroundColor: preset.text };
        }
        return el;
      })
    );
  };

  const handleApplyTypographyPreset = (preset) => {
    // bewusst global – Typo-Preset ist globales Feature
    setElementsAndNotify((prev) =>
      prev.map((el) => {
        const updated = { ...el };
        switch (el.type) {
          case "title":
            updated.fontFamily = preset.title;
            break;
          case "infoBox":
          case "text-box":
          case "button":
          case "block":
            updated.fontFamily = preset.body;
            break;
          case "badge":
          case "chip":
          case "verticalLabel":
            updated.fontFamily = preset.accent;
            break;
          default:
            break;
        }
        return updated;
      })
    );
  };

  const [leftTab, setLeftTab] = React.useState("elements");
  const [dragLayerId, setDragLayerId] = React.useState(null);
  const [sidebarGroupsCollapsed, setSidebarGroupsCollapsed] = React.useState({
    shapes: false,
    meta: false,
    content: false,
  });

  const handleLayerDrop = React.useCallback(
    (sourceId, targetId) => {
      if (!sourceId || !targetId || sourceId === targetId) return;

      setElementsAndNotify((prev) => {
        const ordered = prev.slice().sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
        const srcIndex = ordered.findIndex((e) => e.id === sourceId);
        const targetIndex = ordered.findIndex((e) => e.id === targetId);
        if (srcIndex === -1 || targetIndex === -1) return prev;

        const moved = ordered.splice(srcIndex, 1)[0];
        ordered.splice(targetIndex, 0, moved);

        return ordered.map((el, index) => ({ ...el, zIndex: 10 + index }));
      });
    },
    [setElementsAndNotify]
  );

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;

  const sortedByZ = React.useMemo(
    () => elements.slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [elements]
  );

  
  const handleKeyDown = React.useCallback(
    (e) => {
      if (!interactive) return;

      const tag = e.target?.tagName;
      const inputType = e.target?.type;
      const isTextInput =
        tag === "INPUT" &&
        ["text", "search", "email", "url", "tel", "password", "number"].includes(String(inputType || "text"));
      const isEditable =
        isTextInput || tag === "TEXTAREA" || Boolean(e.target?.isContentEditable);

      // Undo/Redo: funktioniert global, aber wir lassen es in echten Textfeldern (und ContentEditable)
      // beim Browser, damit man Text-Undo nicht kaputt macht.
      if (e.metaKey || e.ctrlKey) {
        const key = String(e.key || "").toLowerCase();

        if (key === "z" || key === "y") {
          // in Textfeldern/ContentEditable -> Browser Undo/Redo (z.B. beim Schreiben)
          if (isEditable && (isTextInput || tag === "TEXTAREA" || e.target?.isContentEditable)) return;

          e.preventDefault();
          if (key === "z") {
            e.shiftKey ? handleRedo() : handleUndo();
          } else {
            handleRedo();
          }
          return;
        }
      }

      // Ab hier: nur Shortcuts für ausgewählte Elemente
      if (!selectedId || isEditable) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      const sel = elements.find((el) => el.id === selectedId);
      if (!sel || sel.locked) return;

      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case "ArrowUp":
          dy = -step;
          break;
        case "ArrowDown":
          dy = step;
          break;
        case "ArrowLeft":
          dx = -step;
          break;
        case "ArrowRight":
          dx = step;
          break;
        default:
          return;
      }

      e.preventDefault();
      updateElement({ ...sel, x: sel.x + dx, y: sel.y + dy });
    },
    [elements, handleDeleteSelected, handleRedo, handleUndo, interactive, selectedId, updateElement]
  );

  // ✅ globaler KeyListener: damit Ctrl/Cmd+Z auch funktioniert, wenn der Canvas nicht fokussiert ist
  React.useEffect(() => {
    if (!interactive) return;
    const listener = (e) => handleKeyDown(e);
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, [handleKeyDown, interactive]);

  const renderElementContent = (element) => {
    switch (element.type) {
      case "hero": {
        const effectiveUrl = element.imageUrl || hero_image_url;
        const img = effectiveUrl ? (
          <img
            src={effectiveUrl}
            alt={titleText}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          heroPlaceholder
        );

        if (!interactive) return <HeroBlock>{img}</HeroBlock>;

        return (
          <HeroBlock>
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              {img}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerImageUpload({ type: "hero", elementId: element.id });
                }}
                style={{
                  position: "absolute",
                  right: 10,
                  bottom: 10,
                  padding: "4px 8px",
                  fontSize: 11,
                  borderRadius: 999,
                  border: "1px solid rgba(15,23,42,0.3)",
                  background: ui.glassBg,
                  cursor: "pointer",
                }}
              >
                Bild ändern
              </button>
            </div>
          </HeroBlock>
        );
      }

      case "accent":
        return <AccentPanel backgroundColor={element.backgroundColor} />;

      case "badge": {
        const top = element.topText ?? badgeTop ?? "HIGHLIGHT";
        const bottom = element.bottomText ?? badgeBottom ?? "MIT VIEL LIEBE";
        const center = element.centerText ?? badgeCenter ?? "";
        const fontFamily = mapFontFamily(element.fontFamily);
        const fontSize = element.fontSize || 10;
        const borderColor = element.borderColor || "rgba(15,23,42,0.25)";

        if (!interactive) {
          return (
            <StickerBadge
              textTop={top}
              textBottom={bottom}
              center={center}
              backgroundColor={element.backgroundColor}
              textColor={element.textColor}
              fontFamily={fontFamily}
              fontSize={fontSize}
              borderColor={borderColor}
            />
          );
        }

        return (
          <div
            style={{
              backgroundColor: element.backgroundColor || "#ffffff",
              borderRadius: "999px",
              padding: "6px 10px",
              border: `2px solid ${borderColor}`,
              boxShadow: "0 10px 20px rgba(15,23,42,0.15)",
              fontSize,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: element.textColor || "#111827",
              fontFamily,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                contentEditable={interactive && !element.locked}
                suppressContentEditableWarning
                onFocus={() => setSelectedId(element.id)}
                onMouseDown={(e) => e.stopPropagation()}
                onBlur={(e) =>
                  handleElementTextChange(element.id, "topText", e.currentTarget.innerText.trim())
                }
              >
                {top}
              </span>
              <span style={{ fontSize: fontSize + 4 }}>♥</span>
              <span
                contentEditable={interactive && !element.locked}
                suppressContentEditableWarning
                onFocus={() => setSelectedId(element.id)}
                onMouseDown={(e) => e.stopPropagation()}
                onBlur={(e) =>
                  handleElementTextChange(element.id, "bottomText", e.currentTarget.innerText.trim())
                }
              >
                {bottom}
              </span>
              {(center || interactive) && (
                <span
                  style={{ fontWeight: 600, marginLeft: 4 }}
                  contentEditable={interactive && !element.locked}
                  suppressContentEditableWarning
                  onFocus={() => setSelectedId(element.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onBlur={(e) =>
                    handleElementTextChange(element.id, "centerText", e.currentTarget.innerText.trim())
                  }
                >
                  {center || "Center"}
                </span>
              )}
            </div>
          </div>
        );
      }

      case "verticalLabel": {
        const labelText = element.text ?? sideLabelText ?? "@deinprofil";
        const color = element.textColor || "#4b5563";
        const fontFamily = mapFontFamily(element.fontFamily);
        const fontSize = element.fontSize || 12;
        const letterSpacing = element.letterSpacing ?? 3;
        const bg = element.backgroundColor || "transparent";

        if (!interactive) {
          return (
            <VerticalLabel
              text={labelText}
              color={color}
              fontFamily={fontFamily}
              fontSize={fontSize}
              letterSpacing={letterSpacing}
              backgroundColor={bg}
            />
          );
        }

        return (
          <div
            style={{
              fontSize,
              letterSpacing,
              textTransform: "lowercase",
              color,
              fontFamily,
              backgroundColor: bg,
              borderRadius: bg === "transparent" ? 0 : 999,
              padding: bg === "transparent" ? 0 : "2px 6px",
            }}
          >
            <span
              contentEditable={interactive && !element.locked}
              suppressContentEditableWarning
              onFocus={() => setSelectedId(element.id)}
              onMouseDown={(e) => e.stopPropagation()}
              onBlur={(e) => handleElementTextChange(element.id, "text", e.currentTarget.innerText.trim())}
            >
              {labelText || "@deinprofil"}
            </span>
          </div>
        );
      }

      case "title": {
        const t = element.title ?? titleText ?? "";
        const s = element.subtitle ?? subtitleText ?? "";
        const fontFamily = mapFontFamily(element.fontFamily);
        const fontSize = element.fontSize || 30;
        const fontWeight = element.fontWeight || 600;
        const textAlign = element.textAlign || "center";
        const letterSpacing = element.letterSpacing ?? 6;
        const bg = element.backgroundColor || "transparent";

        if (!interactive) {
          return (
            <TitleBlock
              title={t}
              subtitle={s}
              fontFamily={fontFamily}
              fontSize={fontSize}
              fontWeight={fontWeight}
              textAlign={textAlign}
              colorTitle={element.textColor || "#1f2933"}
              colorSubtitle={element.subtitleColor || "#374151"}
              letterSpacing={letterSpacing}
              backgroundColor={bg}
            />
          );
        }

        return (
          <header
            onMouseDown={(e) => {
              if (!interactive) return;
              e.stopPropagation();
              setSelectedId(element.id);
            }}
            style={{
              textAlign,
              position: "relative",
              backgroundColor: bg,
              borderRadius: bg === "transparent" ? 0 : 12,
              padding: bg === "transparent" ? 0 : 4,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize,
                letterSpacing,
                textTransform: "uppercase",
                color: element.textColor || "#1f2933",
                fontFamily,
                fontWeight,
              }}
            >
              <span
                contentEditable={interactive && !element.locked}
                suppressContentEditableWarning
                onFocus={() => setSelectedId(element.id)}
                onMouseDown={(e) => e.stopPropagation()}
                onBlur={(e) => handleElementTextChange(element.id, "title", e.currentTarget.innerText.trim())}
              >
                {t || "TITEL EINGEBEN"}
              </span>
            </h1>
            <p
              style={{
                marginTop: 6,
                marginBottom: 0,
                fontSize: Math.round(fontSize * 0.55),
                letterSpacing: Math.max(letterSpacing - 2, 0),
                textTransform: "uppercase",
                color: element.subtitleColor || "#374151",
                fontFamily,
              }}
            >
              <span
                contentEditable={interactive && !element.locked}
                suppressContentEditableWarning
                onFocus={() => setSelectedId(element.id)}
                onMouseDown={(e) => e.stopPropagation()}
                onBlur={(e) => handleElementTextChange(element.id, "subtitle", e.currentTarget.innerText.trim())}
              >
                {s || "Untertitel"}
              </span>
            </p>
          </header>
        );
      }

      case "infoBox": {
        const html = element.html ?? element.text ?? infoBoxText ?? "";
        const bg = element.backgroundColor || "#ffffff";
        const color = element.textColor || "#374151";
        const fontFamily = mapFontFamily(element.fontFamily);
        const fontSize = element.fontSize || 12;
        const textAlign = element.textAlign || "left";
        const lineHeight = element.lineHeight || 1.6;

        const boxStyle = {
          borderRadius: 16,
          border: "1px solid var(--color-border)",
          backgroundColor: bg,
          padding: 10,
          fontFamily,
        };

        const innerStyle = { fontSize, lineHeight, color, textAlign };

        if (!interactive) {
          return (
            <div style={boxStyle}>
              <div style={innerStyle} dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          );
        }

        return (
          <div style={boxStyle}>
            <div
              data-editable="true"
              data-editable-id={element.id}
              contentEditable={interactive && !element.locked}
              suppressContentEditableWarning
              style={{ ...innerStyle, outline: "none" }}
              dangerouslySetInnerHTML={{
                __html:
                  html ||
                  (language === "en"
                    ? "Enter additional information here …"
                    : "Zusätzliche Informationen hier eintragen …"),
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onFocus={() => {
                setSelectedId(element.id);
                setActiveEditableId(element.id);
              }}
              onInput={(e) => handleElementTextChange(element.id, "html", e.currentTarget.innerHTML)}
              onBlur={(e) => {
                handleElementTextChange(element.id, "html", e.currentTarget.innerHTML);}}
            />
          </div>
        );
      }

      case "block": {
        const block = effectiveBlocks.find((b) => b.id === element.blockId);
        const fontFamily = mapFontFamily(element.fontFamily);
        const fontSize = element.fontSize || 14;
        const textAlign = element.textAlign || "left";
        const color = element.textColor || "#111827";
        const bg = element.backgroundColor || "#ffffff";
        const lineHeight = element.lineHeight || 1.6;

        return renderBlockContent(block, {
          textAlign,
          color,
          fontFamily,
          fontSize,
          lineHeight,
          backgroundColor: bg,
        });
      }

      case "shape-rect":
      case "shape-circle":
      case "button":
      case "icon":
      case "text-box":
      case "image-element":
      case "line":
      case "chip":
        return renderExtraElementContent(
          element,
          interactive,
          handleElementTextChange,
          triggerImageUpload,
          setActiveEditableId,
          setSelectedId
        );

      default:
        return null;
    }
  };

  const wrapperStyle = compact
    ? {
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: 8,
        overflowY: "visible",
        overflowX: "visible",
        maxWidth: "100%",
        position: "relative",
        background: "var(--color-border)",
      }
    : {
        minHeight: "100vh",
        backgroundColor: "#e5e7eb",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: interactive ? "flex-start" : "center",
        padding: 24,
        boxSizing: "border-box",
        gap: 16,
        position: "relative",
        overflowY: "auto",
        overflowX: "auto",
        width: "100%",
      };

  return (
    <main style={wrapperStyle} tabIndex={interactive ? 0 : -1} onKeyDown={handleKeyDown}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />

      {/* Floating Rich-Text Mini Toolbar */}
      {interactive && activeEditableId && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            top: 12,
            zIndex: 999999,
            display: "flex",
            gap: 6,
            padding: "6px 8px",
            borderRadius: 999,
            border: "1px solid var(--color-border)",
            background: ui.glassBg,
            backdropFilter: "blur(8px)",
            boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
            pointerEvents: "auto",
            alignItems: "center",
            fontSize: 12,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("bold")}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
              cursor: "pointer",
            }}
            title="Fett"
          >
            <b>B</b>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec("italic")}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
              cursor: "pointer",
            }}
            title="Kursiv"
          >
            <i>I</i>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execList("ul")}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
              cursor: "pointer",
            }}
            title="Aufzählung"
          >
            • Liste
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execList("ol")}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
              cursor: "pointer",
            }}
            title="Nummerierung"
          >
            1. Liste
          </button>

          <div style={{ width: 1, height: 18, background: "var(--color-border)", marginInline: 4 }} />

          <span style={{ fontSize: 11, color: "var(--color-muted)" }}>
            Tipp: In Textfeldern geht <b>Ctrl/Cmd+Z</b> direkt.
          </span>
        </div>
      )}

      {/* Bottom Toolbar */}
      {mode === "editor" && showToolbar && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: compact ? 8 : 16,
            display: "flex",
            gap: 8,
            padding: "6px 10px",
            background: ui.glassBg,
            backdropFilter: "blur(8px)",
            borderRadius: 999,
            border: "1px solid var(--color-border)",
            boxShadow: "0 10px 30px rgba(15,23,42,0.25)",
            zIndex: 999999,
            alignItems: "center",
            pointerEvents: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("editor")}
            disabled={viewMode === "editor"}
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 999,
              border: viewMode === "editor" ? "1px solid #3b82f6" : "1px solid #d1d5db",
              background: viewMode === "editor" ? "var(--color-borderSubtle)" : "#ffffff",
              color: "var(--color-text)",
              cursor: viewMode === "editor" ? "default" : "pointer",
            }}
          >
            🖊️ Bearbeiten
          </button>

          <button
            type="button"
            onClick={() => setViewMode("preview")}
            disabled={viewMode === "preview"}
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 999,
              border: viewMode === "preview" ? "1px solid #3b82f6" : "1px solid #d1d5db",
              background: viewMode === "preview" ? "var(--color-borderSubtle)" : "#ffffff",
              color: "var(--color-text)",
              cursor: viewMode === "preview" ? "default" : "pointer",
            }}
          >
            👁️ Vorschau
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid var(--color-border)",
              background: canUndo ? "#ffffff" : "#f9fafb",
              color: "var(--color-text)",
              cursor: canUndo ? "pointer" : "default",
            }}
          >
            ↺ Rückgängig
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid var(--color-border)",
              background: canRedo ? "#ffffff" : "#f9fafb",
              color: "var(--color-text)",
              cursor: canRedo ? "pointer" : "default",
            }}
          >
            ↻ Wiederholen
          </button>
        </div>
      )}

      {/* Linke Sidebar */}
      {interactive && (
        <aside
          style={{
            width: 180,
            flexShrink: 0,
            padding: 12,
            borderRadius: 16,
            background: "var(--color-soft)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            position: "sticky",
            top: 16,
            zIndex: 10,
            pointerEvents: "auto",
            alignSelf: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 6,
              borderRadius: 999,
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
              padding: 4,
              marginBottom: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setLeftTab("elements")}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 999,
                padding: "6px 8px",
                fontSize: 12,
                cursor: "pointer",
                background: leftTab === "elements" ? "var(--color-borderSubtle)" : "transparent",
              }}
            >
              Elemente
            </button>
            <button
              type="button"
              onClick={() => setLeftTab("fonts")}
              style={{
                flex: 1,
                border: "none",
                borderRadius: 999,
                padding: "6px 8px",
                fontSize: 12,
                cursor: "pointer",
                background: leftTab === "fonts" ? "var(--color-borderSubtle)" : "transparent",
              }}
            >
              Schriftarten
            </button>
          </div>

          {leftTab === "elements" && (
            <>
              <div style={{ fontSize: 12, marginBottom: 4, fontWeight: 600 }}>Farb-Presets</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    title={preset.name}
                    onClick={() => handleApplyTheme(preset)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      border: "1px solid var(--color-border)",
                      background: `linear-gradient(135deg, ${preset.bg} 50%, ${preset.text} 50%)`,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>

              {/* Formen */}
              <button
                type="button"
                style={{ ...sidebarButtonStyle, justifyContent: "space-between" }}
                onClick={() => setSidebarGroupsCollapsed((prev) => ({ ...prev, shapes: !prev.shapes }))}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={sidebarButtonIconStyle}>▢</span>
                  <span>Formen</span>
                </span>
                <span>{sidebarGroupsCollapsed.shapes ? "▸" : "▾"}</span>
              </button>

              {!sidebarGroupsCollapsed.shapes && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <button
                    type="button"
                    style={sidebarButtonStyle}
                    onClick={() =>
                      setElementsAndNotify((prev) => [
                        ...prev,
                        {
                          id: `rect-${Date.now()}`,
                          type: "shape-rect",
                          x: 100,
                          y: 540,
                          width: 260,
                          height: 140,
                          rotation: 0,
                          opacity: 1,
                          zIndex: 20,
                          locked: false,
                          visible: true,
                          backgroundColor: "#bfdbfe",
                          hasShadow: true,
                        },
                      ])
                    }
                  >
                    <span style={sidebarButtonIconStyle}>▭</span>
                    <span>Rect</span>
                  </button>

                  <button
                    type="button"
                    style={sidebarButtonStyle}
                    onClick={() =>
                      setElementsAndNotify((prev) => [
                        ...prev,
                        {
                          id: `circle-${Date.now()}`,
                          type: "shape-circle",
                          x: 110,
                          y: 540,
                          width: 150,
                          height: 150,
                          rotation: 0,
                          opacity: 1,
                          zIndex: 20,
                          locked: false,
                          visible: true,
                          backgroundColor: "#f97373",
                          hasShadow: true,
                        },
                      ])
                    }
                  >
                    <span style={sidebarButtonIconStyle}>●</span>
                    <span>Kreis</span>
                  </button>

                  <button
                    type="button"
                    style={sidebarButtonStyle}
                    onClick={() =>
                      setElementsAndNotify((prev) => [
                        ...prev,
                        {
                          id: `line-${Date.now()}`,
                          type: "line",
                          x: 100,
                          y: 720,
                          width: 280,
                          height: 20,
                          rotation: 0,
                          opacity: 1,
                          zIndex: 30,
                          locked: false,
                          visible: true,
                          backgroundColor: "#111827",
                          thickness: 3,
                          hasShadow: false,
                        },
                      ])
                    }
                  >
                    <span style={sidebarButtonIconStyle}>─</span>
                    <span>Linie</span>
                  </button>

                  <button
                    type="button"
                    style={sidebarButtonStyle}
                    onClick={() =>
                      setElementsAndNotify((prev) => [
                        ...prev,
                        {
                          id: `chip-${Date.now()}`,
                          type: "chip",
                          x: 240,
                          y: 320,
                          width: 200,
                          height: 34,
                          rotation: 0,
                          opacity: 1,
                          zIndex: 65,
                          locked: false,
                          visible: true,
                          label: "NEU",
                          backgroundColor: "#111827",
                          textColor: "#f9fafb",
                          borderColor: "transparent",
                          fontFamily: "display",
                          fontSize: 11,
                          textAlign: "center",
                          hasShadow: true,
                        },
                      ])
                    }
                  >
                    <span style={sidebarButtonIconStyle}>🏷</span>
                    <span>Label</span>
                  </button>
                </div>
              )}

              <hr style={{ margin: "10px 0", borderColor: "#e5e7eb" }} />

              {/* Meta */}
              <button
                type="button"
                style={{ ...sidebarButtonStyle, justifyContent: "space-between" }}
                onClick={() => setSidebarGroupsCollapsed((prev) => ({ ...prev, meta: !prev.meta }))}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={sidebarButtonIconStyle}>★</span>
                  <span>Meta</span>
                </span>
                <span>{sidebarGroupsCollapsed.meta ? "▸" : "▾"}</span>
              </button>

              {!sidebarGroupsCollapsed.meta && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <button
                    type="button"
                    style={sidebarButtonStyle}
                    onClick={() =>
                      setElementsAndNotify((prev) => [
                        ...prev,
                        {
                          id: `button-${Date.now()}`,
                          type: "button",
                          x: 200,
                          y: 820,
                          width: 180,
                          height: 40,
                          rotation: 0,
                          opacity: 1,
                          zIndex: 70,
                          locked: false,
                          visible: true,
                          label: "Jetzt anmelden",
                          backgroundColor: "#4f46e5",
                          textColor: "#ffffff",
                          fontFamily: "display",
                          fontSize: 13,
                          textAlign: "center",
                          hasShadow: true,
                        },
                      ])
                    }
                  >
                    <span style={sidebarButtonIconStyle}>🔘</span>
                    <span>Button</span>
                  </button>

                  <button
                    type="button"
                    style={sidebarButtonStyle}
                    onClick={() =>
                      setElementsAndNotify((prev) => [
                        ...prev,
                        {
                          id: `icon-${Date.now()}`,
                          type: "icon",
                          x: 60,
                          y: 720,
                          width: 42,
                          height: 42,
                          rotation: 0,
                          opacity: 1,
                          zIndex: 70,
                          locked: false,
                          visible: true,
                          icon: "★",
                          textColor: "#111827",
                          borderColor: "#111827",
                          hasShadow: true,
                        },
                      ])
                    }
                  >
                    <span style={sidebarButtonIconStyle}>★</span>
                    <span>Icon</span>
                  </button>
                </div>
              )}

              {/* Text & Medien */}
              <button
                type="button"
                style={{ ...sidebarButtonStyle, justifyContent: "space-between" }}
                onClick={() => setSidebarGroupsCollapsed((prev) => ({ ...prev, content: !prev.content }))}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={sidebarButtonIconStyle}>✏️</span>
                  <span>Text &amp; Medien</span>
                </span>
                <span>{sidebarGroupsCollapsed.content ? "▸" : "▾"}</span>
              </button>

              {!sidebarGroupsCollapsed.content && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <button
                    type="button"
                    style={sidebarButtonStyle}
                    onClick={() =>
                      setElementsAndNotify((prev) => [
                        ...prev,
                        {
                          id: `textbox-${Date.now()}`,
                          type: "text-box",
                          x: 80,
                          y: 640,
                          width: 260,
                          height: 120,
                          rotation: 0,
                          opacity: 1,
                          zIndex: 60,
                          locked: false,
                          visible: true,
                          html: "Neuer Text …",
                          text: "Neuer Text …",
                          backgroundColor: "#ffffff",
                          textColor: "#111827",
                          fontFamily: "sans",
                          fontSize: 13,
                          textAlign: "left",
                          lineHeight: 1.5,
                          hasShadow: true,
                        },
                      ])
                    }
                  >
                    <span style={sidebarButtonIconStyle}>T</span>
                    <span>Textfeld</span>
                  </button>

                  <button
                    type="button"
                    style={sidebarButtonStyle}
                    onClick={() =>
                      setElementsAndNotify((prev) => [
                        ...prev,
                        {
                          id: `img-${Date.now()}`,
                          type: "image-element",
                          x: 100,
                          y: 560,
                          width: 220,
                          height: 160,
                          rotation: 0,
                          opacity: 1,
                          zIndex: 60,
                          locked: false,
                          visible: true,
                          url: "",
                          backgroundColor: "#f9fafb",
                          borderColor: "#e5e7eb",
                          hasShadow: true,
                        },
                      ])
                    }
                  >
                    <span style={sidebarButtonIconStyle}>🖼</span>
                    <span>Bild</span>
                  </button>
                </div>
              )}

              <hr style={{ margin: "10px 0", borderColor: "#e5e7eb" }} />

              <h4 style={{ margin: 0, marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Ebenen</h4>
              <div
                style={{
                  maxHeight: 260,
                  overflowY: "auto",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                }}
              >
                {elements
                  .slice()
                  .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
                  .map((el) => {
                    const isSelected = el.id === selectedId;
                    const label = ELEMENT_TYPE_LABELS[el.type] || el.id;
                    return (
                      <div
                        key={el.id}
                        draggable
                        onDragStart={() => setDragLayerId(el.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragLayerId) {
                            handleLayerDrop(dragLayerId, el.id);
                            setDragLayerId(null);
                          }
                        }}
                        onClick={() => setSelectedId(el.id)}
                        style={{
                          padding: "6px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: isSelected ? "var(--color-borderSubtle)" : "transparent",
                          borderBottom: "1px solid #f3f4f6",
                          gap: 8,
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {label}
                        </span>

                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ opacity: el.visible ? 1 : 0.4, fontSize: 10 }}>
                            {el.visible ? "👁" : "🚫"}
                          </span>

                          <button
                            type="button"
                            title="Element löschen"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteElementById(el.id);
                            }}
                            style={{
                              border: "1px solid #fecaca",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              borderRadius: 999,
                              width: 18,
                              height: 18,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            ✕
                          </button>
                        </span>
                      </div>
                    );
                  })}
              </div>
            </>
          )}

          {leftTab === "fonts" && (
            <>
              <div style={{ fontSize: 12, marginBottom: 4, fontWeight: 600 }}>Typo-Presets</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                {TYPO_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyTypographyPreset(preset)}
                    style={{ ...sidebarButtonStyle, justifyContent: "space-between" }}
                  >
                    <span>{preset.name}</span>
                    <span style={{ fontSize: 11, color: "var(--color-muted)" }}>
                      Title: {preset.title} / Body: {preset.body}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
                Hinweis: Presets sind bewusst global. Einzel-Änderungen machst du rechts im Inspector.
              </div>
            </>
          )}
        </aside>
      )}

      {/* Canvas */}
      <div
        style={{
          flexShrink: 0,
          position: "relative",
          zIndex: 1,
          pointerEvents: "auto",
        }}
        onMouseDown={(e) => {
          if (!interactive) return;
          // ✅ Beim Editieren nicht „aus Versehen“ deselecten
          if (activeEditableId) return;
          if (e.target === e.currentTarget) setSelectedId(null);
        }}
      >
        <FlyerFrame>
          {sortedByZ.map((el) => (
            <DraggableElement
              key={el.id}
              element={el}
              interactive={interactive}
              selected={el.id === selectedId}
              onSelect={setSelectedId}
              onChange={updateElement}
              onDelete={handleDeleteElementById}
            >
              {renderElementContent(el)}
            </DraggableElement>
          ))}
        </FlyerFrame>
      </div>

      {/* Rechte Sidebar */}
      {interactive && (
        <aside
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: rightCollapsed ? 46 : 260,
            flexShrink: 0,
            padding: rightCollapsed ? 8 : 12,
            borderRadius: 16,
            background: "var(--color-soft)",
            border: "1px solid var(--color-border)",
            position: "sticky",
            top: 16,
            alignSelf: "flex-start",
            zIndex: 1000,
            maxHeight: "calc(100vh - 32px)",
            overflowY: rightCollapsed ? "hidden" : "auto",
            overflowX: "hidden",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            transition: "width 160ms ease, padding 160ms ease",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: rightCollapsed ? "center" : "space-between",
              gap: 8,
              marginBottom: rightCollapsed ? 0 : 10,
              position: "sticky",
              top: 0,
              background: "var(--color-soft)",
              paddingTop: 2,
              paddingBottom: 8,
              zIndex: 2,
            }}
          >
            {!rightCollapsed && (
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                Eigenschaften
              </div>
            )}

            <button
              type="button"
              onClick={() => setRightCollapsed((v) => !v)}
              title={rightCollapsed ? "Sidebar öffnen" : "Sidebar einklappen"}
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 2px rgba(148,163,184,0.25)",
                flexShrink: 0,
              }}
            >
              {rightCollapsed ? "⚙️" : "▸"}
            </button>
          </div>

          {!rightCollapsed && (
            <Inspector
              elements={elements}
              selectedId={selectedId}
              selectedElement={selectedElement}
              interactive={interactive}
              activeEditableId={activeEditableId}
              globalMode={globalMode}
              setGlobalMode={setGlobalMode}
              onSelect={setSelectedId}
              onChange={updateElement}
              onBringFront={handleBringFront}
              onSendBack={handleSendBack}
              onDelete={handleDeleteSelected}
              onApplyGlobalPatch={applyGlobalPatch}
            />
          )}
        </aside>
      )}

      <span style={{ display: "none" }}>{historyTick}</span>
    </main>
  );
};

export default FlyerLayout;
