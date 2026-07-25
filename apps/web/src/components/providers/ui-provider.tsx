"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Language } from "@/lib/types";
import { t as translate } from "@/lib/i18n";

type Theme = "dark" | "light";

type UiContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const savedLang = window.localStorage.getItem("taraka_lang") as Language | null;
    const savedTheme = window.localStorage.getItem("taraka_theme") as Theme | null;
    if (savedLang === "en" || savedLang === "si" || savedLang === "ta") {
      setLanguageState(savedLang);
    }
    if (savedTheme === "dark" || savedTheme === "light") {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = language;
  }, [theme, language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    window.localStorage.setItem("taraka_lang", lang);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem("taraka_theme", next);
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      t: (key: string) => translate(language, key),
    }),
    [language, setLanguage, theme, setTheme],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used within UiProvider");
  return ctx;
}
