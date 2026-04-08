/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api";
import {
  translations,
  type AppLanguage,
  type TranslationDictionary,
} from "../i18n/translations";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  section: (name: keyof TranslationDictionary["sections"]) => Record<string, string>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isUsableTranslation(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^[?\s]+$/.test(trimmed)) return false;
  return true;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem("app-language");
    return saved === "ne" ? "ne" : "en";
  });
  const previousLanguageRef = useRef<AppLanguage | null>(null);

  useEffect(() => {
    localStorage.setItem("app-language", language);
    document.documentElement.lang = language === "ne" ? "ne" : "en";
  }, [language]);

  useEffect(() => {
    if (previousLanguageRef.current && previousLanguageRef.current !== language) {
      void api.trackEvent({
        eventName: "language_changed",
        entityType: "language",
        entityId: language,
        entityName: language === "ne" ? "Nepali" : "English",
        sourcePage: typeof window !== "undefined" ? window.location.pathname || "/" : "/",
        metadata: {
          previousLanguage: previousLanguageRef.current,
          nextLanguage: language,
        },
      });
    }

    previousLanguageRef.current = language;
  }, [language]);

  const setLanguage = (lang: AppLanguage) => setLanguageState(lang);
  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "en" ? "ne" : "en"));
  };

  const value = useMemo(
    () => {
      const t = (key: string, fallback?: string) => {
        const localized = translations[language].common[key];
        const english = translations.en.common[key];

        if (isUsableTranslation(localized)) return localized;
        if (isUsableTranslation(english)) return english;
        if (isUsableTranslation(fallback)) return fallback;
        return key;
      };

      const section = (name: keyof TranslationDictionary["sections"]) => {
        const englishSection = translations.en.sections[name] || {};
        const localizedSection = translations[language].sections[name] || {};
        const merged: Record<string, string> = {};

        const keys = new Set([
          ...Object.keys(englishSection),
          ...Object.keys(localizedSection),
        ]);

        keys.forEach((key) => {
          const localized = localizedSection[key];
          const english = englishSection[key];

          if (isUsableTranslation(localized)) {
            merged[key] = localized;
          } else if (isUsableTranslation(english)) {
            merged[key] = english;
          } else {
            merged[key] = key;
          }
        });

        return merged;
      };

      return {
        language,
        setLanguage,
        toggleLanguage,
        t,
        section,
      };
    },
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
