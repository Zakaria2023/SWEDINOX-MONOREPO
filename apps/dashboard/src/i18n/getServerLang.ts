"use server";

import {
  defaultLanguage,
  languageCookieName,
  normalizeLanguage,
} from "@/i18n/config";
import { cookies } from "next/headers";

export const getLang = async () => {
  const cookieStore = await cookies();
  const lang = normalizeLanguage(
    cookieStore.get(languageCookieName)?.value ?? defaultLanguage,
  );

  return lang;
};
