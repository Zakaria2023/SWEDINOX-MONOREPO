import { createInstance, i18n as I18nType } from "i18next";
import resourcesToBackend from "i18next-resources-to-backend";

const loadLocale = (language: string) => {
  switch (language) {
    case "en":
      return import("@/lang/en.json");
    case "ar":
      return import("@/lang/ar.json");
    case "nl":
      return import("@/lang/nl.json");
    default:
      return import("@/lang/ar.json");
  }
};

const initI18next = async (
  lng: string,
  ns: string = "translation",
): Promise<I18nType> => {
  const i18nInstance = createInstance();

  await i18nInstance.use(resourcesToBackend(loadLocale)).init({
    lng,
    fallbackLng: "ar",
    ns,
    interpolation: { escapeValue: false },
  });

  return i18nInstance;
};

export default initI18next;
