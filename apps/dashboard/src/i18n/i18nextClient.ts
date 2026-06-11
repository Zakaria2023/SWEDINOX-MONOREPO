import ar from "@/lang/ar.json";
import en from "@/lang/en.json";
import nl from "@/lang/nl.json";
import {
  defaultLanguage,
  languageCookieName,
  normalizeLanguage,
  supportedLanguages,
} from "@/i18n/config";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Read the stored language from cookie synchronously so the first render
// uses the correct language and avoids a flash of the default language.
const getStoredLang = () => {
  if (typeof document === "undefined") return defaultLanguage;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${languageCookieName}=([^;]*)`),
  );
  return normalizeLanguage(match?.[1]);
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    nl: { translation: nl },
  },
  lng: getStoredLang(),
  fallbackLng: defaultLanguage,
  supportedLngs: supportedLanguages,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
