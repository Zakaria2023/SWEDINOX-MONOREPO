"use server";

import initI18next from "@/i18n/i18nextServer";
import { cookies } from "next/headers";

export const getTranslation = async (ns: string = "translation") => {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "ar";

  const i18nextInstance = await initI18next(lang, ns);

  return {
    t: i18nextInstance.t,
    lang,
  };
};
