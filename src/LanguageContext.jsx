// src/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // "de" oder "en"
  const [language, setLanguage] = useState("de");

  // Sprache aus localStorage laden (damit nach Reload gleich bleibt)
  useEffect(() => {
    const saved = localStorage.getItem("laufx_language");
    if (saved === "de" || saved === "en") {
      setLanguage(saved);
    }
  }, []);

  // Sprache speichern, wenn sie sich ändert
  useEffect(() => {
    localStorage.setItem("laufx_language", language);
  }, [language]);

  const value = { language, setLanguage };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
