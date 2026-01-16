// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import { LanguageProvider } from "./LanguageContext.jsx";
import { ThemeProvider } from "./ThemeContext.jsx";
import "./index.css";

const container = document.getElementById("root");

// Sicherheitscheck, falls das Root-Element fehlt
if (!container) {
  throw new Error('Root-Element mit id="root" wurde in index.html nicht gefunden.');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
