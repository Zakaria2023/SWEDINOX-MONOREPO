"use server";

import { getLang } from "@/i18n/getServerLang";
import initI18next from "@/i18n/i18nextServer";

export const getTranslation = async (ns: string = "translation") => {
  const lang = await getLang();

  const i18nextInstance = await initI18next(lang, ns);

  return {
    t: i18nextInstance.t,
    lang,
  };
};
