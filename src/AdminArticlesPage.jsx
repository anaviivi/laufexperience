// src/AdminArticlesPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";

// Tiptap core
import { useEditor, EditorContent } from "@tiptap/react";

// Tiptap extensions
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import FontFamily from "@tiptap/extension-font-family";

import FlyerLayout from "./FlyerLayout";
import { useLanguage } from "./LanguageContext";
import CustomImage from "./CustomImage"; // ✅ eigene Image-Extension
import BlockRenderer from "./BlockRenderer"; // (falls ungenutzt, kannst du es entfernen)
import { useTheme } from "./ThemeContext.jsx";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ========== UI-Texte (DE/EN) ========== */

const UI_TEXT = {
  de: {
    // Toolbar
    fontFamilyTitle: "Schriftart",

    // Haupt-UI
    searchPlaceholder: "Nach Titel oder Slug suchen…",
    newArticle: "Neuer Artikel",
    active: "Aktive",
    trash: "Papierkorb",
    loadingArticles: "Lade Artikel…",
    noArticles: "Keine Artikel gefunden.",
    untitled: "(ohne Titel)",
    publishedBadge: "veröffentlicht",

    errorLoading: "Fehler beim Laden der Artikel.",
    articleSaved: "Artikel gespeichert.",
    autoTranslateRunning: "Übersetze nach EN…",
    autoTranslateDone: "EN aktualisiert.",
    autoTranslateErrorPrefix: "Übersetzung fehlgeschlagen",
    retranslateBtn: "EN neu übersetzen",
    retranslateRunning: "Übersetze…",
    retranslateDone: "EN neu generiert.",

    errorSavingPrefix: "Fehler beim Speichern des Artikels",
    heroUploadError: "Fehler beim Upload des Hero-Bildes.",

    missingTitle: "Bitte gib einen Titel ein, bevor du speicherst.",
    missingSlug: "Bitte gib einen Slug für die URL ein.",

    moveToTrashConfirm: "Diesen Artikel in den Papierkorb verschieben?",
    moveToTrashSuccess: "Artikel in den Papierkorb verschoben.",
    moveToTrashError: "Fehler beim Verschieben des Artikels.",
    restoreSuccess: "Artikel wiederhergestellt.",
    restoreError: "Fehler beim Wiederherstellen des Artikels.",
    deletePermanentConfirm:
      "Diesen Artikel endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
    deletePermanentSuccess: "Artikel dauerhaft gelöscht.",
    deletePermanentError: "Fehler beim dauerhaften Löschen des Artikels.",

    restore: "Wiederherstellen",
    deletePermanently: "Endgültig löschen",
    moveToTrash: "In Papierkorb",

    editArticle: "Artikel bearbeiten",
    save: "Speichern",
    saving: "Speichern…",

    titleLabel: "Titel",
    slugLabel: "URL-Slug",
    slugPlaceholder: "mein-artikel",
    subtitleLabel: "Untertitel",
    shortDescLabel: "Kurzbeschreibung (Teaser)",

    layoutLabel: "Layout",
    layoutSimple: "Simple (nur Inhalt)",
    layoutArticle: "Artikel (Block-Layout)",
    layoutFlyer: "Flyer (A4, Block-Layout)",

    flyerHint:
      "Hinweis: Das Flyer-Layout wird im Frontend als einseitiger A4-Flyer gerendert und nutzt ausschließlich die unten definierten Blocks.",

    heroLabel: "Hero-Bild",
    heroButton: "Vom Rechner wählen",
    heroSizeLabel: "Hero-Größe",
    heroSizeSmall: "Klein",
    heroSizeMedium: "Mittel",
    heroSizeLarge: "Groß",
    heroSizeFull: "Vollhöhe",
    heroQuestionLabel: "Hero-Frage / Text",
    heroFocusLabel: "Bildfokus",
    heroFocusTop: "Oben",
    heroFocusCenter: "Mitte",
    heroFocusBottom: "Unten",

    titleVariantLabel: "Titel-Variante",
    titleVariantAbove: "Über dem Inhalt (Standard)",
    titleVariantOverlay: "Im Hero-Bild (Overlay)",
    titleVariantBelow: "Unter dem Hero-Bild",
    titleVariantHidden: "Titel im Frontend ausblenden",
    titleVariantPreviewHidden: "Titel im Frontend ausgeblendet.",
    flyerTitleVariantHint:
      "Hinweis: Im Flyer-Layout wird die Titel-Variante derzeit ignoriert.",

    publishedFlag: "Veröffentlicht",
    deletedFlag: "Im Papierkorb",

    simpleContentLabel: "Inhalt (Simple-Layout, mit Formatierung)",

    blocksTitle: "Blocks",
    noBlocks:
      "Noch keine Blocks hinzugefügt. Wähle oben einen Blocktyp aus und bearbeite den Inhalt direkt im Block.",
    blockTextButton: "Text",
    blockImageButton: "Bild",
    blockTwoColButton: "Zwei Spalten",
    blockQuoteButton: "Zitat",
    blockChecklistButton: "Checkliste",

    textBlockTitle: (i) => `Textblock #${i}`,
    imageBlockTitle: (i) => `Bildblock #${i}`,
    twoColBlockTitle: (i) => `Zweispaltiger Text #${i}`,
    quoteBlockTitle: (i) => `Zitat #${i}`,
    checklistBlockTitle: (i) => `Checkliste #${i}`,

    imageUrlLabel: "Bild-URL",
    altTextLabel: "Alternativtext",
    captionLabel: "Bildunterschrift",

    style5050: "50 / 50",
    style6040: "60 / 40",

    authorLabel: "Autor / Quelle",
    checklistPlaceholder: "Ein Punkt pro Zeile…",

    languageLabel: "Sprache",
    langDe: "DE",
    langEn: "EN",
  },
  en: {
    fontFamilyTitle: "Font family",

    searchPlaceholder: "Search by title or slug…",
    newArticle: "New article",
    active: "Active",
    trash: "Trash",
    loadingArticles: "Loading articles…",
    noArticles: "No articles found.",
    untitled: "(untitled)",
    publishedBadge: "Published",

    errorLoading: "Error while loading articles.",
    articleSaved: "Article saved.",
    autoTranslateRunning: "Translating to EN…",
    autoTranslateDone: "EN updated.",
    autoTranslateErrorPrefix: "Translation failed",
    retranslateBtn: "Re-translate EN",
    retranslateRunning: "Translating…",
    retranslateDone: "EN regenerated.",

    errorSavingPrefix: "Error while saving the article",
    heroUploadError: "Error while uploading hero image.",

    missingTitle: "Please enter a title before saving.",
    missingSlug: "Please enter a slug for the URL.",

    moveToTrashConfirm: "Move this article to the trash?",
    moveToTrashSuccess: "Article moved to trash.",
    moveToTrashError: "Error while moving article to trash.",
    restoreSuccess: "Article restored.",
    restoreError: "Error while restoring article.",
    deletePermanentConfirm:
      "Delete this article permanently? This action cannot be undone.",
    deletePermanentSuccess: "Article deleted permanently.",
    deletePermanentError: "Error while deleting article permanently.",

    restore: "Restore",
    deletePermanently: "Delete permanently",
    moveToTrash: "Move to trash",

    editArticle: "Edit article",
    save: "Save",
    saving: "Saving…",

    titleLabel: "Title",
    slugLabel: "URL slug",
    slugPlaceholder: "my-article",
    subtitleLabel: "Subtitle",
    shortDescLabel: "Short description (teaser)",

    layoutLabel: "Layout",
    layoutSimple: "Simple (content only)",
    layoutArticle: "Article (block layout)",
    layoutFlyer: "Flyer (A4, block layout)",

    flyerHint:
      "Note: The flyer layout is rendered as a single-page A4 flyer in the frontend and only uses the blocks defined below.",

    heroLabel: "Hero image",
    heroButton: "Choose from computer",
    heroSizeLabel: "Hero size",
    heroSizeSmall: "Small",
    heroSizeMedium: "Medium",
    heroSizeLarge: "Large",
    heroSizeFull: "Full height",
    heroQuestionLabel: "Hero question / text",
    heroFocusLabel: "Image focus",
    heroFocusTop: "Top",
    heroFocusCenter: "Center",
    heroFocusBottom: "Bottom",

    titleVariantLabel: "Title variant",
    titleVariantAbove: "Above content (default)",
    titleVariantOverlay: "In hero image (overlay)",
    titleVariantBelow: "Below hero image",
    titleVariantHidden: "Hide title in frontend",
    titleVariantPreviewHidden: "Title is hidden in the frontend.",
    flyerTitleVariantHint:
      "Note: In flyer layout, the title variant is currently ignored.",

    publishedFlag: "Published",
    deletedFlag: "In trash",

    simpleContentLabel: "Content (simple layout, formatted)",

    blocksTitle: "Blocks",
    noBlocks:
      "No blocks added yet. Choose a block type above and edit the content directly in the block.",
    blockTextButton: "Text",
    blockImageButton: "Image",
    blockTwoColButton: "Two columns",
    blockQuoteButton: "Quote",
    blockChecklistButton: "Checklist",

    textBlockTitle: (i) => `Text block #${i}`,
    imageBlockTitle: (i) => `Image block #${i}`,
    twoColBlockTitle: (i) => `Two-column text #${i}`,
    quoteBlockTitle: (i) => `Quote #${i}`,
    checklistBlockTitle: (i) => `Checklist #${i}`,

    imageUrlLabel: "Image URL",
    altTextLabel: "Alt text",
    captionLabel: "Caption",

    style5050: "50 / 50",
    style6040: "60 / 40",

    authorLabel: "Author / source",
    checklistPlaceholder: "One item per line…",

    languageLabel: "Language",
    langDe: "DE",
    langEn: "EN",
  },
};

/* ========== Block types ========== */

export const BLOCK_TYPES = {
  HEADER: "header-block",
  RICH: "rich-text",
  IMAGE: "image-block",
  QUOTE: "quote",
  CHECKLIST: "checklist",
  TWO_COLUMNS: "two-columns",
};

/* ========== Supabase Bucket-Konstante ========== */

const IMAGE_BUCKET = "block-images";

/* ========== Helferfunktionen für Rich-Text ========== */

function isEmptyRichText(html) {
  if (!html) return true;
  const cleaned = html.replace(/&nbsp;/gi, " ");
  const text = cleaned.replace(/<[^>]*>/g, "").trim();
  return text.length === 0;
}

function normalizeRichTextForSave(html) {
  if (!html) return null;
  const cleaned = html.replace(/&nbsp;/gi, " ");
  const text = cleaned.replace(/<[^>]*>/g, "").trim();
  if (!text) return null;
  return cleaned;
}

function normalizeBlocksForSave(blocks) {
  if (!Array.isArray(blocks)) return [];

  return blocks
    .map((block) => {
      if (!block) return null;

      switch (block.type) {
        case BLOCK_TYPES.RICH: {
          const content = normalizeRichTextForSave(block.content);
          if (!content) return null;
          return { ...block, content };
        }

        case BLOCK_TYPES.TWO_COLUMNS: {
          const left = normalizeRichTextForSave(block.left);
          const right = normalizeRichTextForSave(block.right);
          if (!left && !right) return null;
          return { ...block, left, right };
        }

        case BLOCK_TYPES.QUOTE: {
          const text = normalizeRichTextForSave(block.text);
          if (!text && !block.author) return null;
          return { ...block, text };
        }

        case BLOCK_TYPES.CHECKLIST: {
          const items = (block.items || "")
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
            .join("\n");
          if (!items) return null;
          return { ...block, items };
        }

        case BLOCK_TYPES.IMAGE: {
          if (!block.url) return null;
          return block;
        }

        default:
          return block;
      }
    })
    .filter(Boolean);
}

/* ========== Tiptap Basis-Extensions (DRY) ========== */

const BASE_TIPTAP_EXTENSIONS = [
  StarterKit,
  Underline,
  Highlight.configure({ multicolor: true }),
  TextStyle,
  FontFamily.configure({ types: ["textStyle"] }),
  Color,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  CustomImage,
  Link.configure({ openOnClick: true, autolink: true }),
];

// ✅ verhindert doppelte Extension-Namen
function dedupeExtensions(exts = []) {
  const map = new Map();
  for (const ext of exts) {
    if (!ext) continue;
    const name = ext?.name;
    if (name && !map.has(name)) map.set(name, ext);
  }
  return Array.from(map.values());
}

/* ========== Theme helper (semantic styles) ========== */

function useSemanticUI() {
  const { isDark } = useTheme();
  return {
    accentBg: isDark ? "rgba(59,130,246,.25)" : "rgba(37,99,235,.14)",
    accentBorder: isDark ? "rgba(59,130,246,.45)" : "rgba(37,99,235,.28)",
    accentText: isDark ? "rgba(147,197,253,1)" : "rgba(29,78,216,1)",

    successBg: isDark ? "rgba(34,197,94,.18)" : "rgba(34,197,94,.12)",
    successBorder: isDark ? "rgba(34,197,94,.38)" : "rgba(34,197,94,.26)",
    successText: isDark ? "rgba(134,239,172,1)" : "rgba(22,101,52,1)",

    dangerBg: isDark ? "rgba(239,68,68,.18)" : "rgba(239,68,68,.12)",
    dangerBorder: isDark ? "rgba(239,68,68,.38)" : "rgba(239,68,68,.26)",
    dangerText: isDark ? "rgba(252,165,165,1)" : "rgba(185,28,28,1)",

    warnBg: isDark ? "rgba(249,115,22,.18)" : "rgba(249,115,22,.12)",
    warnBorder: isDark ? "rgba(249,115,22,.38)" : "rgba(249,115,22,.26)",
    warnText: isDark ? "rgba(253,186,116,1)" : "rgba(154,52,18,1)",
  };
}

/* ========== Tiptap Toolbar ========== */

function TiptapMenuBar({ editor, enableHeadings = false, enableImages = false }) {
  const { language } = useLanguage();
  const t = UI_TEXT[language];
  const UI = useSemanticUI();

  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showBgPalette, setShowBgPalette] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const formatMenuRef = useRef(null);
  const fileInputInsertRef = useRef(null);
  const fileInputReplaceRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!formatMenuRef.current) return;
      if (!formatMenuRef.current.contains(e.target)) {
        setShowFormatMenu(false);
        setShowColorPalette(false);
        setShowBgPalette(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (!editor) return null;

  const buttonStyle = (isActive) => ({
    borderRadius: 9999,
    border: "1px solid var(--color-border)",
    padding: "2px 6px",
    fontSize: 11,
    cursor: "pointer",
    background: isActive ? "var(--color-panelBg)" : "var(--color-card)",
    color: "var(--color-text)",
  });

  const PALETTE_COLORS = [
    "#000000", "#111827", "#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb", "#f3f4f6", "#ffffff",
    "#7f1d1d", "#b91c1c", "#dc2626", "#ef4444", "#f87171", "#fecaca",
    "#7c2d12", "#c2410c", "#ea580c", "#f97316", "#fdba74", "#ffedd5",
    "#78350f", "#d97706", "#f59e0b", "#fbbf24", "#fef08a", "#fef9c3",
    "#064e3b", "#047857", "#10b981", "#22c55e", "#4ade80", "#bbf7d0",
    "#1e3a8a", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe",
    "#4338ca", "#6366f1", "#8b5cf6", "#a855f7", "#c4b5fd", "#ddd6fe",
    "#be185d", "#db2777", "#ec4899", "#f472b6", "#f9a8d4", "#fce7f3",
  ];

  const LINE_HEIGHTS = [
    { value: "", de: "Standard", en: "Default" },
    { value: "1.0", de: "1.0 (eng)", en: "1.0 (tight)" },
    { value: "1.2", de: "1.2", en: "1.2" },
    { value: "1.5", de: "1.5", en: "1.5" },
    { value: "1.75", de: "1.75", en: "1.75" },
    { value: "2", de: "2.0 (luftig)", en: "2.0 (loose)" },
  ];

  const FONT_FAMILIES = [
    { key: "default", value: "", de: "Standard", en: "Default" },
    { key: "sans", value: "Arial, Helvetica, sans-serif", de: "Sans Serif", en: "Sans Serif" },
    { key: "serif", value: "Georgia, serif", de: "Serif", en: "Serif" },
    { key: "mono", value: "'Courier New', monospace", de: "Monospace", en: "Monospace" },
    { key: "roboto", value: "'Roboto', sans-serif", de: "Roboto", en: "Roboto" },
    { key: "poppins", value: "'Poppins', sans-serif", de: "Poppins", en: "Poppins" },
    { key: "opensans", value: "'Open Sans', sans-serif", de: "Open Sans", en: "Open Sans" },
    { key: "montserrat", value: "'Montserrat', sans-serif", de: "Montserrat", en: "Montserrat" },
  ];

  const currentColor = editor.getAttributes("textStyle").color || "";
  const currentFont = editor.getAttributes("textStyle").fontFamily || "";
  const currentLineHeight = editor.getAttributes("textStyle").lineHeight || "";

  const currentImageAttrs = editor.getAttributes("image") || {};
  const currentImageSize = currentImageAttrs.size || "medium";
  const currentImageAlign = currentImageAttrs.align || "center";

  const isImageSelected =
    !!editor?.state?.selection?.node && editor.state.selection.node.type?.name === "image";

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt(language === "de" ? "URL eingeben:" : "Enter URL:", previousUrl);
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const readImageAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      if (!file) return reject(new Error("No file"));
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const validateImageFile = (file) => {
    if (!file?.type?.startsWith("image/")) {
      alert(language === "de" ? "Bitte eine Bilddatei auswählen." : "Please select an image file.");
      return false;
    }
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(
        language === "de"
          ? `Bild ist zu groß (max. ${MAX_MB}MB).`
          : `Image is too large (max ${MAX_MB}MB).`
      );
      return false;
    }
    return true;
  };

  // ✅ Einfügen (PC)
  const insertImageFromFile = async (file) => {
    if (!validateImageFile(file)) return;
    const dataUrl = await readImageAsDataURL(file);
    if (typeof dataUrl !== "string") return;

    editor
      .chain()
      .focus()
      .setImage({ src: dataUrl, size: "medium", align: "center" })
      .run();
  };

  // ✅ Ersetzen (PC) – nur wenn ein Bild selektiert ist
  const replaceSelectedImageFromFile = async (file) => {
    if (!isImageSelected) {
      alert(language === "de" ? "Bitte zuerst ein Bild anklicken." : "Please select an image first.");
      return;
    }
    if (!validateImageFile(file)) return;
    const dataUrl = await readImageAsDataURL(file);
    if (typeof dataUrl !== "string") return;

    editor
      .chain()
      .focus()
      .updateAttributes("image", { src: dataUrl })
      .run();
  };

  // ✅ Einfügen (URL)
  const insertImageFromUrl = () => {
    const url = window.prompt(language === "de" ? "Bild-URL eingeben:" : "Enter image URL:");
    if (!url || !url.trim()) return;

    editor
      .chain()
      .focus()
      .setImage({ src: url.trim(), size: "medium", align: "center" })
      .run();
  };

  // ✅ Ersetzen (URL)
  const replaceSelectedImageFromUrl = () => {
    if (!isImageSelected) {
      alert(language === "de" ? "Bitte zuerst ein Bild anklicken." : "Please select an image first.");
      return;
    }
    const url = window.prompt(language === "de" ? "Neue Bild-URL:" : "New image URL:");
    if (!url || !url.trim()) return;

    editor.chain().focus().updateAttributes("image", { src: url.trim() }).run();
  };

  // ✅ Löschen (selektiertes Bild)
  const deleteSelectedImage = () => {
    if (!isImageSelected) {
      alert(language === "de" ? "Bitte zuerst ein Bild anklicken." : "Please select an image first.");
      return;
    }
    editor.chain().focus().deleteSelection().run();
  };

  const onPickInsert = () => {
    if (!fileInputInsertRef.current) return;
    fileInputInsertRef.current.value = "";
    fileInputInsertRef.current.click();
  };

  const onPickReplace = () => {
    if (!fileInputReplaceRef.current) return;
    fileInputReplaceRef.current.value = "";
    fileInputReplaceRef.current.click();
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8, alignItems: "center", position: "relative" }}>
      <div ref={formatMenuRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => {
            setShowFormatMenu((p) => !p);
            setShowColorPalette(false);
            setShowBgPalette(false);
          }}
          style={{
            borderRadius: 9999,
            border: "1px solid var(--color-border)",
            padding: "4px 10px",
            fontSize: 12,
            cursor: "pointer",
            background: "var(--color-card)",
            color: "var(--color-text)",
          }}
          title={language === "de" ? "Formatierungen" : "Formatting"}
        >
          {language === "de" ? "Format" : "Format"} ▾
        </button>

        {showFormatMenu && (
          <div
            style={{
              position: "absolute",
              top: "120%",
              left: 0,
              minWidth: 300,
              padding: 10,
              background: "var(--color-panelBg)",
              border: "1px solid var(--color-panelBorder)",
              borderRadius: 12,
              boxShadow: "var(--color-panelShadow)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              color: "var(--color-text)",
            }}
          >
            {/* Basic formatting */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={buttonStyle(editor.isActive("bold"))}>B</button>
              <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={buttonStyle(editor.isActive("italic"))}>I</button>
              <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} style={buttonStyle(editor.isActive("underline"))}>U</button>
              <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} style={buttonStyle(editor.isActive("highlight"))}>Highlight</button>
            </div>

            {/* Lists */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={buttonStyle(editor.isActive("bulletList"))}>••</button>
              <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={buttonStyle(editor.isActive("orderedList"))}>1.</button>
            </div>

            {/* Headings */}
            {enableHeadings && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={buttonStyle(editor.isActive("heading", { level: 2 }))}>H2</button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={buttonStyle(editor.isActive("heading", { level: 3 }))}>H3</button>
              </div>
            )}

            {/* Alignment */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} style={buttonStyle(editor.isActive({ textAlign: "left" }))}>L</button>
              <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} style={buttonStyle(editor.isActive({ textAlign: "center" }))}>M</button>
              <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} style={buttonStyle(editor.isActive({ textAlign: "right" }))}>R</button>
              <button type="button" onClick={() => editor.chain().focus().setTextAlign("justify").run()} style={buttonStyle(editor.isActive({ textAlign: "justify" }))}>J</button>
            </div>

            {/* Font + Line height */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
              <select
                value={currentFont}
                onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                style={{
                  borderRadius: 9999,
                  border: "1px solid var(--color-border)",
                  padding: "6px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                  background: "var(--color-card)",
                  color: "var(--color-text)",
                }}
                title={t.fontFamilyTitle}
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.key} value={font.value}>
                    {language === "de" ? font.de : font.en}
                  </option>
                ))}
              </select>

              <select
                value={currentLineHeight}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) editor.chain().focus().setTextStyle({ lineHeight: "normal" }).run();
                  else editor.chain().focus().setTextStyle({ lineHeight: value }).run();
                }}
                style={{
                  borderRadius: 9999,
                  border: "1px solid var(--color-border)",
                  padding: "6px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                  background: "var(--color-card)",
                  color: "var(--color-text)",
                }}
                title={language === "de" ? "Zeilenabstand" : "Line height"}
              >
                {LINE_HEIGHTS.map((lh) => (
                  <option key={lh.value || "default"} value={lh.value}>
                    {language === "de" ? lh.de : lh.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Colors */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" onClick={() => { setShowColorPalette((p) => !p); setShowBgPalette(false); }} style={buttonStyle(false)} title={language === "de" ? "Textfarbe" : "Text color"}>🎨</button>
              <button type="button" onClick={() => { setShowBgPalette((p) => !p); setShowColorPalette(false); }} style={buttonStyle(false)} title={language === "de" ? "Hintergrundfarbe" : "Background color"}>🟥</button>

              <div style={{ position: "relative" }}>
                {showColorPalette && (
                  <div style={{ position: "absolute", top: "120%", left: 0, display: "grid", gridTemplateColumns: "repeat(7, 18px)", gap: 4, padding: 6, background: "var(--color-panelBg)", border: "1px solid var(--color-panelBorder)", borderRadius: 8, boxShadow: "var(--color-panelShadow)", zIndex: 9999 }}>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPalette(false); }}
                      style={{ gridColumn: "span 7", fontSize: 10, padding: 3, borderRadius: 4, border: "1px dashed var(--color-border)", background: "var(--color-soft)", cursor: "pointer", color: "var(--color-text)" }}
                    >
                      {language === "de" ? "Standardfarbe" : "Default color"}
                    </button>

                    <div style={{ gridColumn: "span 7", display: "flex", alignItems: "center", gap: 6, fontSize: 10, marginBottom: 2, color: "var(--color-text)" }}>
                      <span>{language === "de" ? "Eigene:" : "Custom:"}</span>
                      <input
                        type="color"
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;
                          editor.chain().focus().setColor(value).run();
                          setShowColorPalette(false);
                        }}
                        style={{ width: 40, height: 20, padding: 0, border: "none", background: "transparent" }}
                      />
                    </div>

                    {PALETTE_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPalette(false); }}
                        style={{ width: 18, height: 18, borderRadius: 4, background: color, border: currentColor === color ? "2px solid var(--color-text)" : "1px solid var(--color-border)", cursor: "pointer" }}
                      />
                    ))}
                  </div>
                )}

                {showBgPalette && (
                  <div style={{ position: "absolute", top: "120%", left: 0, display: "grid", gridTemplateColumns: "repeat(7, 18px)", gap: 4, padding: 6, background: "var(--color-panelBg)", border: "1px solid var(--color-panelBorder)", borderRadius: 8, boxShadow: "var(--color-panelShadow)", zIndex: 9999 }}>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowBgPalette(false); }}
                      style={{ gridColumn: "span 7", fontSize: 10, padding: 3, borderRadius: 4, border: "1px dashed var(--color-border)", background: "var(--color-soft)", cursor: "pointer", color: "var(--color-text)" }}
                    >
                      {language === "de" ? "Standard" : "Default"}
                    </button>

                    {PALETTE_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => { editor.chain().focus().setHighlight({ color }).run(); setShowBgPalette(false); }}
                        style={{ width: 18, height: 18, borderRadius: 4, background: color, border: "1px solid var(--color-border)", cursor: "pointer" }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Link */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" onClick={setLink} style={buttonStyle(editor.isActive("link"))}>Link</button>
              <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} style={buttonStyle(false)}>
                {language === "de" ? "Link entfernen" : "Remove link"}
              </button>
            </div>

            {/* Images */}
            {enableImages && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* hidden file inputs */}
                <input
                  ref={fileInputInsertRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => insertImageFromFile(e.target.files?.[0])}
                />
                <input
                  ref={fileInputReplaceRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => replaceSelectedImageFromFile(e.target.files?.[0])}
                />

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={onPickInsert}
                    style={{
                      borderRadius: 9999,
                      border: "1px solid var(--color-border)",
                      padding: "6px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                      background: "var(--color-card)",
                      color: "var(--color-text)",
                    }}
                  >
                    🖼️ {language === "de" ? "Bild vom PC" : "Image from PC"}
                  </button>
                  <button
                    type="button"
                    onClick={insertImageFromUrl}
                    style={{
                      borderRadius: 9999,
                      border: "1px solid var(--color-border)",
                      padding: "6px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                      background: "var(--color-card)",
                      color: "var(--color-text)",
                    }}
                  >
                    🔗 {language === "de" ? "Bild per URL" : "Image by URL"}
                  </button>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={onPickReplace}
                    disabled={!isImageSelected}
                    style={{
                      borderRadius: 9999,
                      border: "1px solid var(--color-border)",
                      padding: "6px 10px",
                      fontSize: 12,
                      cursor: isImageSelected ? "pointer" : "not-allowed",
                      background: isImageSelected ? "var(--color-card)" : "var(--color-soft)",
                      opacity: isImageSelected ? 1 : 0.6,
                      color: "var(--color-text)",
                    }}
                  >
                    🔁 {language === "de" ? "Ersetzen (PC)" : "Replace (PC)"}
                  </button>

                  <button
                    type="button"
                    onClick={replaceSelectedImageFromUrl}
                    disabled={!isImageSelected}
                    style={{
                      borderRadius: 9999,
                      border: "1px solid var(--color-border)",
                      padding: "6px 10px",
                      fontSize: 12,
                      cursor: isImageSelected ? "pointer" : "not-allowed",
                      background: isImageSelected ? "var(--color-card)" : "var(--color-soft)",
                      opacity: isImageSelected ? 1 : 0.6,
                      color: "var(--color-text)",
                    }}
                  >
                    🔁 {language === "de" ? "Ersetzen (URL)" : "Replace (URL)"}
                  </button>

                  <button
                    type="button"
                    onClick={deleteSelectedImage}
                    disabled={!isImageSelected}
                    style={{
                      borderRadius: 9999,
                      border: "1px solid var(--color-border)",
                      padding: "6px 10px",
                      fontSize: 12,
                      cursor: isImageSelected ? "pointer" : "not-allowed",
                      background: isImageSelected ? UI.dangerBg : "var(--color-soft)",
                      opacity: isImageSelected ? 1 : 0.6,
                      color: isImageSelected ? UI.dangerText : "var(--color-muted)",
                    }}
                  >
                    🗑️ {language === "de" ? "Bild löschen" : "Delete image"}
                  </button>
                </div>

                {/* Size & align for active image */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <select
                    value={currentImageSize}
                    onChange={(e) => editor.chain().focus().updateAttributes("image", { size: e.target.value }).run()}
                    style={{
                      borderRadius: 9999,
                      border: "1px solid var(--color-border)",
                      padding: "6px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                      background: "var(--color-card)",
                      color: "var(--color-text)",
                    }}
                    title={language === "de" ? "Bildgröße (aktives Bild)" : "Image size (active image)"}
                  >
                    <option value="small">{language === "de" ? "Klein" : "Small"}</option>
                    <option value="medium">{language === "de" ? "Mittel" : "Medium"}</option>
                    <option value="large">{language === "de" ? "Groß" : "Large"}</option>
                  </select>

                  <button type="button" onClick={() => editor.chain().focus().updateAttributes("image", { align: "left" }).run()} style={buttonStyle(currentImageAlign === "left")}>L</button>
                  <button type="button" onClick={() => editor.chain().focus().updateAttributes("image", { align: "center" }).run()} style={buttonStyle(currentImageAlign === "center")}>C</button>
                  <button type="button" onClick={() => editor.chain().focus().updateAttributes("image", { align: "right" }).run()} style={buttonStyle(currentImageAlign === "right")}>R</button>
                </div>

                <div style={{ fontSize: 11, color: "var(--color-muted)" }}>
                  {language === "de"
                    ? "Tipp: Bilder kannst du auch per Drag & Drop oder Strg+V einfügen."
                    : "Tip: You can also insert images via drag & drop or Ctrl+V."}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== Block Rich-Text Editor ========== */

function BlockRichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: dedupeExtensions(BASE_TIPTAP_EXTENSIONS),
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  return (
    <div>
      <TiptapMenuBar editor={editor} enableHeadings enableImages />
      <div
        style={{
          minHeight: 80,
          padding: 8,
          borderRadius: 12,
          border: "1px solid var(--color-border)",
          background: "var(--color-card)",
          color: "var(--color-text)",
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

/* ========== Sortable Block Wrapper ========== */

function SortableBlockWrapper({ id, children, onRemove, onMoveUp, onMoveDown }) {
  const { language } = useLanguage();
  const UI = useSemanticUI();

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 10,
    padding: 10,
    borderRadius: 16,
    border: "1px solid var(--color-border)",
    background: "var(--color-soft)",
    color: "var(--color-text)",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 6,
          gap: 8,
        }}
      >
        <button
          type="button"
          {...listeners}
          style={{
            borderRadius: 9999,
            border: "1px solid var(--color-border)",
            padding: "2px 6px",
            fontSize: 11,
            cursor: "grab",
            background: "var(--color-panelBg)",
            color: "var(--color-text)",
          }}
          title={language === "de" ? "Block ziehen" : "Drag block"}
        >
          ↕
        </button>

        <span
          style={{
            flex: 1,
            fontSize: 11,
            color: "var(--color-muted)",
          }}
        >
          {language === "de" ? "Block-ID:" : "Block ID:"}{" "}
          <span
            style={{
              padding: "2px 6px",
              borderRadius: 9999,
              background: "rgba(15,23,42,0.08)",
              fontSize: 10,
              color: "var(--color-text)",
            }}
          >
            {id}
          </span>
        </span>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <button
            type="button"
            onClick={onMoveUp}
            style={{
              borderRadius: 9999,
              border: "1px solid var(--color-border)",
              padding: "2px 6px",
              fontSize: 11,
              cursor: "pointer",
              background: "var(--color-card)",
              color: "var(--color-text)",
            }}
            title={language === "de" ? "Block nach oben" : "Move block up"}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            style={{
              borderRadius: 9999,
              border: "1px solid var(--color-border)",
              padding: "2px 6px",
              fontSize: 11,
              cursor: "pointer",
              background: "var(--color-card)",
              color: "var(--color-text)",
            }}
            title={language === "de" ? "Block nach unten" : "Move block down"}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            style={{
              borderRadius: 9999,
              border: `1px solid ${UI.dangerBorder}`,
              padding: "2px 6px",
              fontSize: 11,
              cursor: "pointer",
              background: UI.dangerBg,
              color: UI.dangerText,
              marginLeft: 4,
            }}
            title={language === "de" ? "Block löschen" : "Delete block"}
          >
            {language === "de" ? "Löschen" : "Delete"}
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}

/* ========== Title variant preview ========== */

function TitleVariantPreview({ variant }) {
  const { language } = useLanguage();
  const t = UI_TEXT[language];
  const v = variant || "above-content";

  const heroStyle = {
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(to right, rgba(148,163,184,.35), rgba(148,163,184,.15))",
    marginBottom: 6,
  };

  const titleBar = (
    <div
      style={{
        height: 10,
        borderRadius: 9999,
        background: "var(--color-text)",
        marginBottom: 4,
        width: "70%",
        opacity: 0.9,
      }}
    />
  );

  const subtitleBar = (
    <div
      style={{
        height: 8,
        borderRadius: 9999,
        background: "var(--color-muted)",
        width: "50%",
        opacity: 0.9,
      }}
    />
  );

  return (
    <div
      style={{
        marginTop: 6,
        padding: 6,
        borderRadius: 12,
        border: "1px dashed var(--color-border)",
        background: "var(--color-soft)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          color: "var(--color-muted)",
          marginBottom: 4,
        }}
      >
        {language === "de" ? "Vorschau" : "Preview"}
      </div>
      <div>
        {(v === "hero-overlay" || v === "below-hero") && <div style={heroStyle} />}

        {v === "above-content" && (
          <>
            {titleBar}
            {subtitleBar}
          </>
        )}

        {v === "below-hero" && (
          <>
            {titleBar}
            {subtitleBar}
          </>
        )}

        {v === "hero-overlay" && (
          <div
            style={{
              position: "relative",
              marginTop: -34,
              paddingLeft: 6,
            }}
          >
            <div
              style={{
                width: "60%",
                height: 10,
                borderRadius: 9999,
                background: "var(--color-card)",
                marginBottom: 4,
                opacity: 0.9,
              }}
            />
            <div
              style={{
                width: "40%",
                height: 7,
                borderRadius: 9999,
                background: "rgba(249,250,251,0.55)",
              }}
            />
          </div>
        )}

        {v === "hidden" && (
          <div
            style={{
              fontSize: 11,
              color: "var(--color-muted)",
              fontStyle: "italic",
            }}
          >
            {t.titleVariantPreviewHidden}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== Defaults & helper ========== */

// helper: pick language value (DE/EN) with fallback
function pickLang(language, de, en) {
  return language === "en" ? en || de || "" : de || en || "";
}

function pickLangJson(language, de, en, fallback) {
  if (language === "en") return en ?? de ?? fallback;
  return de ?? en ?? fallback;
}

function normalizeArticleForLanguage(article, language) {
  const blocks =
    pickLangJson(language, article.blocks_de, article.blocks_en, article.blocks || []) || [];
  const layoutElements =
    pickLangJson(
      language,
      article.layout_elements_de,
      article.layout_elements_en,
      article.layout_elements || article.layoutElements || []
    ) || [];

  return {
    ...EMPTY_ARTICLE,
    ...article,
    title: pickLang(language, article.title_de, article.title_en) || article.title || "",
    subtitle: pickLang(language, article.subtitle_de, article.subtitle_en) || article.subtitle || "",
    short_description:
      pickLang(language, article.short_description_de, article.short_description_en) ||
      article.short_description ||
      "",
    content: pickLang(language, article.content_de, article.content_en) || article.content || "",
    blocks: Array.isArray(blocks) ? blocks : [],
    layout_elements: Array.isArray(layoutElements) ? layoutElements : [],
    layoutElements: Array.isArray(layoutElements) ? layoutElements : [],
  };
}

const EMPTY_ARTICLE = {
  id: null,
  slug: "",
  title: "",
  subtitle: "",
  layout: "simple",
  hero_image_url: "",
  hero_size: "medium",
  hero_focus: "center",
  hero_question: "",
  title_variant: "above-content",
  blocks: [],
  deleted: false,
  is_published: false,
  content: "",
  short_description: "",
  layout_elements: [],
};

function createNewBlock(type) {
  return {
    id: `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    content: "",
    url: "",
    alt: "",
    caption: "",
    items: "",
    left: "",
    right: "",
    style: "full",
    text: "",
    author: "",
    title: "",
    subtitle: "",
  };
}

/* ========== Main component ========== */

export default function AdminArticlesPage() {
  const { language } = useLanguage();
  const t = UI_TEXT[language];
  const UI = useSemanticUI();

  const [articles, setArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(EMPTY_ARTICLE);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [translating, setTranslating] = useState(false);
  const [viewTrash, setViewTrash] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [selectedArticleRaw, setSelectedArticleRaw] = useState(null);

  const formRef = useRef(null);

  // Auto switch editor content when global language toggle changes
  useEffect(() => {
    if (!selectedArticleRaw) return;
    setCurrentArticle(normalizeArticleForLanguage(selectedArticleRaw, language));
  }, [language, selectedArticleRaw]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Layout-Flags
  const layout = currentArticle.layout || "simple";
  const isBlocksLayout = layout === "blocks" || layout === "article";
  const isFlyerLayout = layout === "flyer";

  // Flyer-Editor soll auch unter dem Block-Artikel erscheinen, wenn Flyer-Daten existieren
  const hasFlyerElements = Array.isArray(currentArticle.layout_elements);

  const showFlyerEditor = isFlyerLayout;

  // Hero-Size-Mapping für Vorschau
  const heroSize = currentArticle.hero_size || "medium";
  const heroHeightMap = {
    small: 120,
    medium: 220,
    large: 340,
    full: 520,
  };
  const heroHeight = heroHeightMap[heroSize] || heroHeightMap.medium;

  /* ========== Tiptap instances ========== */

  const simpleEditor = useEditor({
    extensions: dedupeExtensions(BASE_TIPTAP_EXTENSIONS),
    content: "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setCurrentArticle((prev) => ({ ...prev, content: html }));
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor prose prose-base max-w-none focus:outline-none",
      },
    },
  });

  const titleEditor = useEditor({
    extensions: dedupeExtensions(BASE_TIPTAP_EXTENSIONS),
    content: "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setCurrentArticle((prev) => ({ ...prev, title: html }));
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor prose prose-lg max-w-none focus:outline-none",
      },
    },
  });

  const subtitleEditor = useEditor({
    extensions: dedupeExtensions(BASE_TIPTAP_EXTENSIONS),
    content: "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setCurrentArticle((prev) => ({ ...prev, subtitle: html }));
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor prose prose-base max-w-none focus:outline-none",
      },
    },
  });

  const shortDescEditor = useEditor({
    extensions: dedupeExtensions(BASE_TIPTAP_EXTENSIONS),
    content: "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setCurrentArticle((prev) => ({ ...prev, short_description: html }));
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  /* ========== Fetch & sync articles ========== */

  useEffect(() => {
    async function fetchArticles() {
      setLoadingArticles(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setArticles(data || []);
      } catch (err) {
        console.error(err);
        setError(t.errorLoading);
      } finally {
        setLoadingArticles(false);
      }
    }

    fetchArticles();
  }, [language, t.errorLoading]);

  useEffect(() => {
    if (simpleEditor) {
      simpleEditor.commands.setContent(currentArticle.content || "", false);
    }
    if (titleEditor) {
      titleEditor.commands.setContent(currentArticle.title || "", false);
    }
    if (subtitleEditor) {
      subtitleEditor.commands.setContent(currentArticle.subtitle || "", false);
    }
    if (shortDescEditor) {
      shortDescEditor.commands.setContent(currentArticle.short_description || "", false);
    }
  }, [currentArticle, simpleEditor, titleEditor, subtitleEditor, shortDescEditor]);

  function resetMessages() {
    setError("");
    setSuccess("");
  }

  // Extract helpful error details from supabase.functions.invoke()
  function getInvokeErrorDetails(invokeError, invokeData) {
    try {
      const dataErr =
        invokeData && (invokeData.error || invokeData.details || invokeData.message);
      if (typeof dataErr === "string" && dataErr.trim()) return dataErr.trim();

      const ctxBody = invokeError?.context?.body;
      if (ctxBody) {
        if (typeof ctxBody === "string") return ctxBody;
        return JSON.stringify(ctxBody);
      }

      const ctx = invokeError?.context;
      if (ctx && typeof ctx === "object") {
        if (typeof ctx.body === "string") return ctx.body;
        if (ctx.body) return JSON.stringify(ctx.body);
      }

      if (invokeError?.message) return invokeError.message;

      return String(invokeError || "Unknown error");
    } catch {
      return invokeError?.message || "Unknown error";
    }
  }

  async function reloadArticles() {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setArticles(data || []);
    } catch (err) {
      console.error(err);
      setError(t.errorLoading);
    }
  }

  function handleSelectArticle(article) {
    resetMessages();
    setSelectedArticleId(article.id);
    setSelectedArticleRaw(article);

    const normalized = normalizeArticleForLanguage(article, language);
    setCurrentArticle(normalized);

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleCreateNew() {
    resetMessages();
    setSelectedArticleId(null);
    setSelectedArticleRaw(null);
    setCurrentArticle(EMPTY_ARTICLE);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Keep success visible while editing; only clear error on edits
  function updateArticleField(field, value) {
    setError("");
    setCurrentArticle((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "layout" && value === "simple") {
        next.blocks = [];
      }
      return next;
    });
  }

  function addBlock(type) {
    setError("");
    const newBlock = createNewBlock(type);
    setCurrentArticle((prev) => ({
      ...prev,
      blocks: [...(prev.blocks || []), newBlock],
    }));
  }

  function updateBlock(blockId, changes) {
    setError("");
    setCurrentArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).map((block) =>
        block.id === blockId ? { ...block, ...changes } : block
      ),
    }));
  }

  function removeBlock(blockId) {
    setError("");
    setCurrentArticle((prev) => ({
      ...prev,
      blocks: (prev.blocks || []).filter((block) => block.id !== blockId),
    }));
  }

  function moveBlock(blockId, direction) {
    setError("");
    setCurrentArticle((prev) => {
      const blocks = [...(prev.blocks || [])];
      const index = blocks.findIndex((b) => b.id === blockId);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= blocks.length) return prev;

      const [moved] = blocks.splice(index, 1);
      blocks.splice(newIndex, 0, moved);

      return { ...prev, blocks };
    });
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCurrentArticle((prev) => {
      const oldIndex = (prev.blocks || []).findIndex((block) => block.id === active.id);
      const newIndex = (prev.blocks || []).findIndex((block) => block.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;

      const newBlocks = arrayMove(prev.blocks || [], oldIndex, newIndex);
      return { ...prev, blocks: newBlocks };
    });
  }

  async function handleHeroFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `hero_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(`hero/${fileName}`, file);

      if (error) throw error;

      const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(data.path);

      updateArticleField("hero_image_url", pub.publicUrl);
    } catch (err) {
      console.error(err);
      setError(t.heroUploadError);
    }
  }

  /* ========== Save & trash ========== */

  async function handleSave(e) {
    if (e) e.preventDefault();
    resetMessages();

    const plainTitle = (currentArticle.title || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim();

    if (!plainTitle) {
      setError(t.missingTitle);
      return;
    }

    if (!currentArticle.slug || !currentArticle.slug.trim()) {
      setError(t.missingSlug);
      return;
    }

    const normalizedTitle = normalizeRichTextForSave(currentArticle.title);
    const normalizedSubtitle = normalizeRichTextForSave(currentArticle.subtitle);
    const normalizedShortDesc = normalizeRichTextForSave(currentArticle.short_description);

    const normalizedBlocks =
      currentArticle.layout === "simple" ? [] : normalizeBlocksForSave(currentArticle.blocks || []);

    const layoutElementsRaw = currentArticle.layout_elements || currentArticle.layoutElements || [];
    const layoutElements = Array.isArray(layoutElementsRaw) ? layoutElementsRaw : null;

    const payload = {
      slug: currentArticle.slug || null,

      layout: currentArticle.layout || "simple",
      hero_image_url: currentArticle.hero_image_url || null,
      hero_size: currentArticle.hero_size || "medium",
      hero_focus: currentArticle.hero_focus || "center",
      hero_question: currentArticle.hero_question || null,
      title_variant: currentArticle.title_variant || "above-content",

      deleted: currentArticle.deleted || false,
      is_published: currentArticle.is_published || false,
    };

    // write language-specific columns (do not overwrite the other language)
    if (language === "en") {
      payload.title_en = normalizedTitle;
      payload.subtitle_en = normalizedSubtitle;
      payload.short_description_en = normalizedShortDesc;

      payload.content_en =
        currentArticle.layout === "simple"
          ? normalizeRichTextForSave(currentArticle.content) || null
          : null;

      payload.blocks_en = normalizedBlocks;
      payload.layout_elements_en = layoutElements;
    } else {
      // DE is source of truth for legacy fields (backward compatible)
      payload.title = normalizedTitle;
      payload.subtitle = normalizedSubtitle;
      payload.short_description = normalizedShortDesc;

      payload.content =
        currentArticle.layout === "simple"
          ? normalizeRichTextForSave(currentArticle.content) || null
          : null;

      payload.blocks = normalizedBlocks;
      payload.layout_elements = layoutElements;

      payload.title_de = normalizedTitle;
      payload.subtitle_de = normalizedSubtitle;
      payload.short_description_de = normalizedShortDesc;
      payload.content_de = payload.content;
      payload.blocks_de = normalizedBlocks;
      payload.layout_elements_de = layoutElements;
    }

    setSaving(true);

    try {
      let response;
      if (currentArticle.id) {
        response = await supabase
          .from("articles")
          .update(payload)
          .eq("id", currentArticle.id)
          .select("*")
          .single();
      } else {
        response = await supabase.from("articles").insert(payload).select("*").single();
      }

      if (response.error) throw response.error;

      const data = response.data;

      // ✅ Auto-Übersetzung nach EN
      if (data?.id) {
        try {
          setTranslating(true);
          setSuccess(t.autoTranslateRunning);
          const { error: trError } = await supabase.functions.invoke("translate-article", {
            body: { article_id: data.id },
          });
          if (trError) throw trError;
          setSuccess(`${t.articleSaved} • ${t.autoTranslateDone}`);
        } catch (trErr) {
          console.error(trErr);
          setError(`${t.autoTranslateErrorPrefix}${trErr?.message ? `: ${trErr.message}` : ""}`);
          setSuccess(t.articleSaved);
        } finally {
          setTranslating(false);
        }
      } else {
        setSuccess(t.articleSaved);
      }

      await reloadArticles();

      if (data) {
        const normalized = {
          ...EMPTY_ARTICLE,
          ...data,
          blocks: data.blocks || [],
          content: data.content || "",
          short_description: data.short_description || "",
          layout_elements: data.layout_elements || data.layoutElements || [],
        };
        setCurrentArticle(normalized);
        setSelectedArticleId(data.id);
        setSelectedArticleRaw(data);
      }
    } catch (err) {
      console.error(err);
      setError(`${t.errorSavingPrefix}${err?.message ? `: ${err.message}` : ""}`);
    } finally {
      setSaving(false);
    }
  }

  // 🔁 EN neu übersetzen (überschreibt vorhandene *_en Felder)
  async function handleReTranslateEn() {
    if (!currentArticle?.id) return;
    resetMessages();

    try {
      setTranslating(true);
      setSuccess(t.retranslateRunning);

      const { data: trData, error: trError } = await supabase.functions.invoke("translate-article", {
        body: { article_id: currentArticle.id, force: true },
      });
      if (trError) {
        const details = getInvokeErrorDetails(trError, trData);
        throw new Error(details);
      }
      if (trData && trData.ok === false) {
        const details = getInvokeErrorDetails(null, trData);
        throw new Error(details);
      }

      setSuccess(t.retranslateDone);
      await reloadArticles();
    } catch (trErr) {
      console.error(trErr);
      setError(`${t.autoTranslateErrorPrefix}${trErr?.message ? `: ${trErr.message}` : ""}`);
    } finally {
      setTranslating(false);
    }
  }

  async function handleMoveToTrash(article) {
    if (!window.confirm(t.moveToTrashConfirm)) return;

    resetMessages();

    try {
      const { error } = await supabase.from("articles").update({ deleted: true }).eq("id", article.id);

      if (error) throw error;

      setSuccess(t.moveToTrashSuccess);
      await reloadArticles();
      if (selectedArticleId === article.id) {
        setSelectedArticleId(null);
        setSelectedArticleRaw(null);
        setCurrentArticle(EMPTY_ARTICLE);
      }
    } catch (err) {
      console.error(err);
      setError(t.moveToTrashError);
    }
  }

  async function handleRestore(article) {
    resetMessages();

    try {
      const { error } = await supabase.from("articles").update({ deleted: false }).eq("id", article.id);

      if (error) throw error;

      setSuccess(t.restoreSuccess);
      await reloadArticles();
    } catch (err) {
      console.error(err);
      setError(t.restoreError);
    }
  }

  async function handleDeletePermanently(article) {
    if (!window.confirm(t.deletePermanentConfirm)) return;

    resetMessages();

    try {
      const { error } = await supabase.from("articles").delete().eq("id", article.id);

      if (error) throw error;

      setSuccess(t.deletePermanentSuccess);
      await reloadArticles();
      if (selectedArticleId === article.id) {
        setSelectedArticleId(null);
        setSelectedArticleRaw(null);
        setCurrentArticle(EMPTY_ARTICLE);
      }
    } catch (err) {
      console.error(err);
      setError(t.deletePermanentError);
    }
  }

  /* ========== Filter & list ========== */

  const filteredArticles = articles.filter((article) => {
    if (viewTrash ? !article.deleted : article.deleted) return false;

    if (!searchTerm.trim()) return true;

    const haystack = `${article.title || ""} ${article.slug || ""}`
      .replace(/<[^>]+>/g, "")
      .toLowerCase();

    return haystack.includes(searchTerm.toLowerCase());
  });

  /* ========== Render ========== */

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 320px) minmax(0, 1.6fr)",
        gap: 20,
        padding: 20,
        minHeight: "100vh",
        background: "var(--color-soft)",
        color: "var(--color-text)",
      }}
    >
      {/* left column: list */}
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--color-border)",
          background: "var(--color-card)",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          height: 300,
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 8 }}>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 10px",
              borderRadius: 9999,
              border: "1px solid var(--color-border)",
              fontSize: 13,
              background: "var(--color-card)",
              color: "var(--color-text)",
            }}
          />
          <button
            type="button"
            onClick={handleCreateNew}
            style={{
              borderRadius: 9999,
              border: `1px solid ${UI.accentBorder}`,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              background: UI.accentBg,
              color: UI.accentText,
              whiteSpace: "nowrap",
            }}
          >
            {t.newArticle}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 12 }}>
          <button
            type="button"
            onClick={() => setViewTrash(false)}
            style={{
              flex: 1,
              padding: "4px 8px",
              borderRadius: 9999,
              border: viewTrash ? "1px solid var(--color-border)" : `1px solid ${UI.accentBorder}`,
              background: viewTrash ? "var(--color-card)" : UI.accentBg,
              color: "var(--color-text)",
              cursor: "pointer",
            }}
          >
            {t.active}
          </button>
          <button
            type="button"
            onClick={() => setViewTrash(true)}
            style={{
              flex: 1,
              padding: "4px 8px",
              borderRadius: 9999,
              border: viewTrash ? `1px solid ${UI.accentBorder}` : "1px solid var(--color-border)",
              background: viewTrash ? UI.accentBg : "var(--color-card)",
              color: "var(--color-text)",
              cursor: "pointer",
            }}
          >
            {t.trash}
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            borderRadius: 12,
            border: "1px solid var(--color-border)",
            background: "var(--color-card)",
          }}
        >
          {loadingArticles && <div style={{ padding: 10, fontSize: 12 }}>{t.loadingArticles}</div>}

          {!loadingArticles && filteredArticles.length === 0 && (
            <div style={{ padding: 10, fontSize: 12 }}>{t.noArticles}</div>
          )}

          {filteredArticles.map((article) => {
            const isActive = selectedArticleId === article.id;
            const plainTitle = (article.title || "").replace(/<[^>]+>/g, "").trim();

            return (
              <div
                key={article.id}
                style={{
                  padding: 10,
                  borderBottom: "1px solid var(--color-border)",
                  background: isActive ? "var(--color-panelBg)" : "var(--color-card)",
                  cursor: "pointer",
                }}
                onClick={() => handleSelectArticle(article)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                    {plainTitle || t.untitled}
                  </div>
                  {article.is_published && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 9999,
                        background: UI.successBg,
                        border: `1px solid ${UI.successBorder}`,
                        color: UI.successText,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.publishedBadge}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-muted)",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span>/{article.slug}</span>
                  {article.layout && <span style={{ fontStyle: "italic" }}>Layout: {article.layout}</span>}
                </div>

                {viewTrash && (
                  <div style={{ marginTop: 6, display: "flex", gap: 6, fontSize: 11 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(article);
                      }}
                      style={{
                        borderRadius: 9999,
                        border: `1px solid ${UI.successBorder}`,
                        padding: "2px 8px",
                        background: UI.successBg,
                        color: UI.successText,
                        cursor: "pointer",
                      }}
                    >
                      {t.restore}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePermanently(article);
                      }}
                      style={{
                        borderRadius: 9999,
                        border: `1px solid ${UI.dangerBorder}`,
                        padding: "2px 8px",
                        background: UI.dangerBg,
                        color: UI.dangerText,
                        cursor: "pointer",
                      }}
                    >
                      {t.deletePermanently}
                    </button>
                  </div>
                )}

                {!viewTrash && (
                  <div style={{ marginTop: 6, display: "flex", gap: 6, fontSize: 11 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveToTrash(article);
                      }}
                      style={{
                        borderRadius: 9999,
                        border: `1px solid ${UI.warnBorder}`,
                        padding: "2px 8px",
                        background: UI.warnBg,
                        color: UI.warnText,
                        cursor: "pointer",
                      }}
                    >
                      {t.moveToTrash}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* right column: form */}
      <form
        ref={formRef}
        onSubmit={handleSave}
        style={{
          borderRadius: 16,
          border: "1px solid var(--color-border)",
          background: "var(--color-card)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          color: "var(--color-text)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{t.editArticle}</h2>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                borderRadius: 9999,
                border: saving ? "1px solid var(--color-border)" : `1px solid ${UI.successBorder}`,
                padding: "6px 12px",
                fontSize: 13,
                cursor: saving ? "not-allowed" : "pointer",
                background: saving ? "var(--color-soft)" : UI.successBg,
                color: saving ? "var(--color-muted)" : UI.successText,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {saving ? t.saving : t.save}
            </button>

            {currentArticle?.id && (
              <button
                type="button"
                onClick={handleReTranslateEn}
                disabled={saving || translating}
                style={{
                  borderRadius: 9999,
                  border: `1px solid ${UI.accentBorder}`,
                  padding: "6px 12px",
                  fontSize: 13,
                  cursor: saving || translating ? "not-allowed" : "pointer",
                  background: saving || translating ? "var(--color-soft)" : UI.accentBg,
                  color: saving || translating ? "var(--color-muted)" : UI.accentText,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
                title={t.retranslateBtn}
              >
                {translating ? t.retranslateRunning : t.retranslateBtn}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: 8,
              borderRadius: 12,
              background: UI.dangerBg,
              border: `1px solid ${UI.dangerBorder}`,
              fontSize: 12,
              color: UI.dangerText,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: 8,
              borderRadius: 12,
              background: UI.successBg,
              border: `1px solid ${UI.successBorder}`,
              fontSize: 12,
              color: UI.successText,
            }}
          >
            {success}
          </div>
        )}

        {/* Meta fields */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              {t.titleLabel}
            </label>
            <TiptapMenuBar editor={titleEditor} enableHeadings enableImages />
            <div
              style={{
                minHeight: 60,
                padding: 8,
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
              }}
            >
              <EditorContent editor={titleEditor} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              {t.slugLabel}
            </label>
            <input
              type="text"
              value={currentArticle.slug || ""}
              onChange={(e) => updateArticleField("slug", e.target.value)}
              style={{
                width: "100%",
                borderRadius: 9999,
                border: "1px solid var(--color-border)",
                padding: "8px 12px",
                fontSize: 13,
                background: "var(--color-card)",
                color: "var(--color-text)",
              }}
              placeholder={t.slugPlaceholder}
            />

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginTop: 8, marginBottom: 4 }}>
              {t.subtitleLabel}
            </label>
            <TiptapMenuBar editor={subtitleEditor} enableHeadings={false} />
            <div
              style={{
                minHeight: 40,
                padding: 8,
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
              }}
            >
              <EditorContent editor={subtitleEditor} />
            </div>
          </div>
        </div>

        {/* Short description */}
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            {t.shortDescLabel}
          </label>
          <TiptapMenuBar editor={shortDescEditor} />
          <div
            style={{
              minHeight: 40,
              padding: 8,
              borderRadius: 12,
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
            }}
          >
            <EditorContent editor={shortDescEditor} />
          </div>
        </div>

        {/* Layout / Hero / Flags */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              {t.layoutLabel}
            </label>
            <select
              value={currentArticle.layout || "simple"}
              onChange={(e) => updateArticleField("layout", e.target.value)}
              style={{
                width: "100%",
                borderRadius: 9999,
                border: "1px solid var(--color-border)",
                padding: "8px 12px",
                fontSize: 13,
                background: "var(--color-card)",
                color: "var(--color-text)",
              }}
            >
              <option value="simple">{t.layoutSimple}</option>
              <option value="article">{t.layoutArticle}</option>
              <option value="flyer">{t.layoutFlyer}</option>
            </select>

            {isFlyerLayout && (
              <p style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>{t.flyerHint}</p>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
              {t.heroLabel}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <input
                type="text"
                value={currentArticle.hero_image_url || ""}
                onChange={(e) => updateArticleField("hero_image_url", e.target.value)}
                placeholder="https://…"
                style={{
                  flex: "1 1 200px",
                  padding: "8px 12px",
                  borderRadius: 9999,
                  border: "1px solid var(--color-border)",
                  fontSize: 13,
                  background: "var(--color-card)",
                  color: "var(--color-text)",
                }}
              />

              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: 9999,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-card)",
                  fontSize: 12,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  color: "var(--color-text)",
                }}
              >
                {t.heroButton}
                <input type="file" accept="image/*" onChange={handleHeroFileChange} style={{ display: "none" }} />
              </label>
            </div>

            {currentArticle.hero_image_url && (
              <div style={{ marginTop: 8, borderRadius: 16, overflow: "hidden", maxHeight: heroHeight, height: heroHeight }}>
                <img
                  src={currentArticle.hero_image_url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition:
                      currentArticle.hero_focus === "top"
                        ? "center top"
                        : currentArticle.hero_focus === "bottom"
                        ? "center bottom"
                        : "center center",
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* Hero Settings: size + question */}
            <div
              style={{
                marginTop: 8,
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.2fr)",
                gap: 8,
                fontSize: 12,
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  {t.heroSizeLabel}
                </label>
                <select
                  value={currentArticle.hero_size || "medium"}
                  onChange={(e) => updateArticleField("hero_size", e.target.value)}
                  style={{
                    width: "100%",
                    borderRadius: 9999,
                    border: "1px solid var(--color-border)",
                    padding: "6px 10px",
                    fontSize: 13,
                    background: "var(--color-card)",
                    color: "var(--color-text)",
                  }}
                >
                  <option value="small">{t.heroSizeSmall}</option>
                  <option value="medium">{t.heroSizeMedium}</option>
                  <option value="large">{t.heroSizeLarge}</option>
                  <option value="full">{t.heroSizeFull}</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  {t.heroQuestionLabel}
                </label>
                <input
                  type="text"
                  value={currentArticle.hero_question || ""}
                  onChange={(e) => updateArticleField("hero_question", e.target.value)}
                  placeholder={language === "de" ? "z.B. Welche Vorteile habe ich davon?" : "e.g. What’s in it for me?"}
                  style={{
                    width: "100%",
                    borderRadius: 9999,
                    border: "1px solid var(--color-border)",
                    padding: "6px 10px",
                    fontSize: 13,
                    background: "var(--color-card)",
                    color: "var(--color-text)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
              {t.titleVariantLabel}
            </label>
            <select
              value={currentArticle.title_variant || "above-content"}
              onChange={(e) => updateArticleField("title_variant", e.target.value)}
              style={{
                width: "100%",
                borderRadius: 9999,
                border: "1px solid var(--color-border)",
                padding: "8px 12px",
                fontSize: 13,
                background: "var(--color-card)",
                color: "var(--color-text)",
              }}
            >
              <option value="above-content">{t.titleVariantAbove}</option>
              <option value="hero-overlay">{t.titleVariantOverlay}</option>
              <option value="below-hero">{t.titleVariantBelow}</option>
              <option value="hidden">{t.titleVariantHidden}</option>
            </select>

            <TitleVariantPreview variant={currentArticle.title_variant} />

            {isFlyerLayout && <p style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 4 }}>{t.flyerTitleVariantHint}</p>}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={currentArticle.is_published || false}
                onChange={(e) => updateArticleField("is_published", e.target.checked)}
              />
              {t.publishedFlag}
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={currentArticle.deleted || false}
                onChange={(e) => updateArticleField("deleted", e.target.checked)}
              />
              {t.deletedFlag}
            </label>
          </div>
        </div>

        {/* Simple layout content */}
        {currentArticle.layout === "simple" && (
          <div
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 18,
              border: "1px solid var(--color-border)",
              background: "var(--color-soft)",
            }}
          >
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
              {t.simpleContentLabel}
            </label>

            <TiptapMenuBar editor={simpleEditor} enableHeadings enableImages />

            <div
              style={{
                minHeight: 160,
                padding: 10,
                borderRadius: 12,
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
              }}
            >
              <EditorContent editor={simpleEditor} />
            </div>
          </div>
        )}

        {/* Block layout content */}
        {currentArticle.layout !== "simple" && (
          <div
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 18,
              border: "1px solid var(--color-border)",
              background: "var(--color-soft)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{t.blocksTitle}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  [BLOCK_TYPES.RICH, t.blockTextButton],
                  [BLOCK_TYPES.IMAGE, t.blockImageButton],
                  [BLOCK_TYPES.TWO_COLUMNS, t.blockTwoColButton],
                  [BLOCK_TYPES.QUOTE, t.blockQuoteButton],
                  [BLOCK_TYPES.CHECKLIST, t.blockChecklistButton],
                ].map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addBlock(type)}
                    style={{
                      borderRadius: 9999,
                      border: "1px solid var(--color-border)",
                      padding: "4px 8px",
                      fontSize: 11,
                      background: "var(--color-card)",
                      cursor: "pointer",
                      color: "var(--color-text)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {(!currentArticle.blocks || currentArticle.blocks.length === 0) && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 16,
                  border: "1px dashed var(--color-border)",
                  background: "var(--color-panelBg)",
                  boxShadow: "var(--color-shadow)",
                  fontSize: 12,
                  color: "var(--color-muted)",
                  textAlign: "center",
                }}
              >
                {t.noBlocks}
              </div>
            )}

            {currentArticle.blocks && currentArticle.blocks.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={currentArticle.blocks.map((b) => b.id)} strategy={rectSortingStrategy}>
                  <div style={{ marginTop: 8 }}>
                    {currentArticle.blocks.map((block, index) => (
                      <SortableBlockWrapper
                        key={block.id}
                        id={block.id}
                        onRemove={() => removeBlock(block.id)}
                        onMoveUp={() => moveBlock(block.id, "up")}
                        onMoveDown={() => moveBlock(block.id, "down")}
                      >
                        {/* RICH */}
                        {block.type === BLOCK_TYPES.RICH && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
                              {t.textBlockTitle(index + 1)}
                            </div>
                            <BlockRichTextEditor
                              value={block.content || ""}
                              onChange={(html) => updateBlock(block.id, { content: html })}
                            />
                          </div>
                        )}

                        {/* IMAGE */}
                        {block.type === BLOCK_TYPES.IMAGE && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
                              {t.imageBlockTitle(index + 1)}
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
                                gap: 8,
                                fontSize: 12,
                              }}
                            >
                              <div>
                                <label style={{ display: "block", marginBottom: 2 }}>{t.imageUrlLabel}</label>
                                <input
                                  type="text"
                                  value={block.url || ""}
                                  onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                                  placeholder="https://…"
                                  style={{
                                    width: "100%",
                                    borderRadius: 9999,
                                    border: "1px solid var(--color-border)",
                                    padding: "6px 10px",
                                    background: "var(--color-card)",
                                    color: "var(--color-text)",
                                  }}
                                />
                                <label style={{ display: "block", marginTop: 4, marginBottom: 2 }}>{t.altTextLabel}</label>
                                <input
                                  type="text"
                                  value={block.alt || ""}
                                  onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                                  style={{
                                    width: "100%",
                                    borderRadius: 9999,
                                    border: "1px solid var(--color-border)",
                                    padding: "6px 10px",
                                    background: "var(--color-card)",
                                    color: "var(--color-text)",
                                  }}
                                />
                                <label style={{ display: "block", marginTop: 4, marginBottom: 2 }}>{t.captionLabel}</label>
                                <input
                                  type="text"
                                  value={block.caption || ""}
                                  onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                                  style={{
                                    width: "100%",
                                    borderRadius: 9999,
                                    border: "1px solid var(--color-border)",
                                    padding: "6px 10px",
                                    background: "var(--color-card)",
                                    color: "var(--color-text)",
                                  }}
                                />
                              </div>
                              <div>
                                {block.url && (
                                  <img
                                    src={block.url}
                                    alt={block.alt || ""}
                                    style={{
                                      width: "100%",
                                      maxHeight: 160,
                                      objectFit: "cover",
                                      borderRadius: 12,
                                      border: "1px solid var(--color-border)",
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* TWO COLUMNS */}
                        {block.type === BLOCK_TYPES.TWO_COLUMNS && (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)" }}>
                                {t.twoColBlockTitle(index + 1)}
                              </span>
                              <select
                                value={block.style || "full"}
                                onChange={(e) => updateBlock(block.id, { style: e.target.value })}
                                style={{
                                  borderRadius: 9999,
                                  border: "1px solid var(--color-border)",
                                  padding: "2px 8px",
                                  fontSize: 11,
                                  background: "var(--color-card)",
                                  color: "var(--color-text)",
                                }}
                              >
                                <option value="full">{t.style5050}</option>
                                <option value="split">{t.style6040}</option>
                              </select>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <BlockRichTextEditor value={block.left || ""} onChange={(html) => updateBlock(block.id, { left: html })} />
                              <BlockRichTextEditor value={block.right || ""} onChange={(html) => updateBlock(block.id, { right: html })} />
                            </div>
                          </div>
                        )}

                        {/* QUOTE */}
                        {block.type === BLOCK_TYPES.QUOTE && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
                              {t.quoteBlockTitle(index + 1)}
                            </div>
                            <BlockRichTextEditor value={block.text || ""} onChange={(html) => updateBlock(block.id, { text: html })} />
                            <label style={{ display: "block", marginTop: 4, marginBottom: 2, fontSize: 11 }}>
                              {t.authorLabel}
                            </label>
                            <input
                              type="text"
                              value={block.author || ""}
                              onChange={(e) => updateBlock(block.id, { author: e.target.value })}
                              style={{
                                width: "100%",
                                borderRadius: 9999,
                                border: "1px solid var(--color-border)",
                                padding: "6px 10px",
                                fontSize: 12,
                                background: "var(--color-card)",
                                color: "var(--color-text)",
                              }}
                            />
                          </div>
                        )}

                        {/* CHECKLIST */}
                        {block.type === BLOCK_TYPES.CHECKLIST && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
                              {t.checklistBlockTitle(index + 1)}
                            </div>
                            <textarea
                              value={block.items || ""}
                              onChange={(e) => updateBlock(block.id, { items: e.target.value })}
                              rows={4}
                              placeholder={t.checklistPlaceholder}
                              style={{
                                width: "100%",
                                borderRadius: 12,
                                border: "1px solid var(--color-border)",
                                padding: 8,
                                fontSize: 12,
                                fontFamily: "inherit",
                                background: "var(--color-card)",
                                color: "var(--color-text)",
                              }}
                            />
                          </div>
                        )}
                      </SortableBlockWrapper>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}

        {/* Flyer-Layout unter Blocks aktivieren (Block-Layout) */}
        {!showFlyerEditor && isBlocksLayout && (
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              onClick={() =>
                setCurrentArticle((prev) => ({
                  ...prev,
                  layout_elements: [],
                  layoutElements: [],
                }))
              }
              style={{
                borderRadius: 9999,
                border: "1px solid var(--color-border)",
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
                background: "var(--color-card)",
                color: "var(--color-text)",
              }}
            >
              + Flyer-Layout unterhalb hinzufügen
            </button>
          </div>
        )}
      </form>

      {/* ✅ Flyer-Layout Editor: eigener Block unterhalb (vollbreit) */}
      {currentArticle.layout === "flyer" && (<section
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 18,
            border: "1px solid var(--color-border)",
            background: "var(--color-soft)",
            gridColumn: "1 / -1",
            width: "100%",
            maxWidth: "none",
            overflowX: "auto",
          }}
        >
          <div style={{ minWidth: 250 + 794 + 180 + 64, margin: "0 auto" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "var(--color-text)" }}>
              Flyer-Layout Editor
            </div>

            <FlyerLayout
              article={currentArticle}
              mode="editor"
              showToolbar={true}
              compact={false}
              onElementsChange={(elements) =>
                setCurrentArticle((prev) => ({
                  ...prev,
                  layoutElements: elements,
                  layout_elements: elements,
                }))
              }
            />
          </div>
        </section>
      )}
    </div>
  );
}
