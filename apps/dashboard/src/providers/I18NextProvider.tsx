"use client";

import i18n from "@/i18n/i18nextClient";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

const I18nContext = createContext<{ t: (key: string) => string } | null>(null);

type I18nProviderProps = {
  children: ReactNode;
  initialLang?: string;
};

const getInitialLang = (initialLang?: string) => {
  if (initialLang) return initialLang;
  if (typeof window === "undefined") return "en";
  return localStorage.getItem("lang") || "en";
};

const I18nProvider = ({ children, initialLang }: I18nProviderProps) => {
  const { t } = useTranslation();

  const savedLang = useMemo(() => getInitialLang(initialLang), [initialLang]);

  if (i18n.language !== savedLang) {
    i18n.changeLanguage(savedLang);
  }

  useEffect(() => {
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
  }, [savedLang]);

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={{ t }}>{children}</I18nContext.Provider>
    </I18nextProvider>
  );
};

export const useI18nContext = () => {
  const context = useContext(I18nContext);
  if (!context)
    throw new Error("useI18nContext must be used within an I18nProvider");
  return context.t;
};

export default I18nProvider;
