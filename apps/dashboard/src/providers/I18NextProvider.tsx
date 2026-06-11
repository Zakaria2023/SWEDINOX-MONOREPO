"use client";

import i18n from "@/i18n/i18nextClient";
import {
  defaultLanguage,
  getLanguageDirection,
  languageCookieName,
  normalizeLanguage,
  type AppLanguage,
} from "@/i18n/config";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { I18nextProvider } from "react-i18next";

type I18nContextValue = {
  changeLanguage: (language: AppLanguage) => void;
  dir: "ltr" | "rtl";
  language: AppLanguage;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: ReactNode;
  initialLang: AppLanguage;
};

const I18nProvider = ({ children, initialLang }: I18nProviderProps) => {
  const router = useRouter();
  const [language, setLanguage] = useState<AppLanguage>(
    normalizeLanguage(initialLang ?? defaultLanguage),
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = getLanguageDirection(language);
    localStorage.setItem(languageCookieName, language);
  }, [language]);

  const changeLanguage = (nextLanguage: AppLanguage) => {
    if (nextLanguage === language) return;

    // Change i18n synchronously BEFORE setLanguage so React 18 batches
    // both into one render — no flash of the previous language.
    void i18n.changeLanguage(nextLanguage);
    document.cookie = `${languageCookieName}=${nextLanguage}; path=/; max-age=31536000; samesite=lax`;
    setLanguage(nextLanguage);
    router.refresh();
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      changeLanguage,
      dir: getLanguageDirection(language),
      language,
    }),
    [language],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    </I18nextProvider>
  );
};

export const useI18nContext = () => {
  const context = useContext(I18nContext);
  if (!context)
    throw new Error("useI18nContext must be used within an I18nProvider");
  return context;
};

export default I18nProvider;
