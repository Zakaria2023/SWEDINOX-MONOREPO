export const supportedLanguages = ["ar", "en", "nl"] as const;

export type AppLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: AppLanguage = "nl";
export const languageCookieName = "lang";

export const normalizeLanguage = (value?: string | null): AppLanguage =>
  supportedLanguages.includes(value as AppLanguage)
    ? (value as AppLanguage)
    : defaultLanguage;

export const getLanguageDirection = (language: AppLanguage) =>
  language === "ar" ? "rtl" : "ltr";

export const languageLocales: Record<AppLanguage, string> = {
  ar: "ar",
  en: "en-US",
  nl: "nl-NL",
};
