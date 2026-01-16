import React from "react";

/**
 * Simple centered container for article pages.
 * Theme-aware via CSS variables from ThemeContext.
 */
export default function ArticleLayout({ children }) {
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "clamp(14px, 2.2vw, 22px)",
        color: "var(--color-text)",
      }}
    >
      {children}
    </div>
  );
}
