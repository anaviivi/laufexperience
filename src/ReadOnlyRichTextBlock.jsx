import React from "react";

function decodeHtmlEntitiesDeep(input = "") {
  // Decodes &amp; etc. (also handles double-escaped strings like &amp;amp;)
  let str = String(input ?? "");
  if (!str) return "";
  if (typeof document === "undefined") return str;

  let prev = null;
  let curr = str;
  let guard = 0;

  while (curr !== prev && guard < 5) {
    prev = curr;
    const textarea = document.createElement("textarea");
    textarea.innerHTML = curr;
    curr = textarea.value;
    guard += 1;
  }

  return curr;
}

function normalizeHtml(content) {
  if (!content) return "";
  if (typeof content === "string") return content;

  // IMPORTANT:
  // This component is a *HTML* renderer. If callers accidentally pass structured
  // objects/arrays, we should NOT stringify them into HTML (that would render
  // tags like <h2>...</h2> as visible text).
  //
  // Instead, return an empty string (caller should render structured data via
  // BlockRenderer/FlyerLayout).
  return "";
}

/**
 * Read-only HTML renderer that is theme-safe.
 *
 * Problem it solves:
 * - RichText editors often store inline colors like style="color:#111".
 * - In Dark Mode that becomes unreadable.
 *
 * Solution:
 * - Use semantic CSS variables for base typography.
 * - Force inline text colors back to --color-text.
 * - Keep links readable with a dedicated link color.
 */
export default function ReadOnlyRichTextBlock({ content }) {
  const rawHtml = normalizeHtml(content);
  const html = decodeHtmlEntitiesDeep(rawHtml);
  if (!html) return null;

  return (
    <div className="article-richtext">
      <style>
        {`
.article-richtext {
  font-size: 18px;
  line-height: 1.8;
  color: var(--color-text, #111827);
}

/* Normalize accidental inline colors from editors */
.article-richtext [style*="color"] {
  color: var(--color-text, #111827) !important;
}

.article-richtext p {
  margin: 0 0 1.2em;
}

.article-richtext h2 {
  font-size: 28px;
  margin: 2em 0 0.6em;
  font-weight: 700;
  color: var(--color-text, #111827);
}

.article-richtext h3 {
  font-size: 22px;
  margin: 1.6em 0 0.5em;
  font-weight: 600;
  color: var(--color-text, #111827);
}

.article-richtext ul,
.article-richtext ol {
  margin: 1em 0 1.5em 1.2em;
}

.article-richtext blockquote {
  margin: 2em 0;
  padding: 1em 1.2em;
  border-left: 4px solid var(--color-border, #e5e7eb);
  background: var(--color-soft, #f9fafb);
  font-style: italic;
  color: var(--color-text, #111827);
}

.article-richtext a,
.article-richtext a[style*="color"] {
  color: var(--color-headerText, #0f172a) !important;
  text-decoration: underline;
}

.article-richtext img {
  max-width: 100%;
  border-radius: 16px;
  margin: 1.5em auto;
  display: block;
}
        `}
      </style>

      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
