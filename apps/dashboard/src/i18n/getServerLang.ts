"use server";

import { defaultLanguage, languageCookieName, normalizeLanguage } from "@/i18n/config";
import { cookies } from "next/headers";

export async function getLang() {
  const cookieStore = await cookies();
  const lang = normalizeLanguage(
    cookieStore.get(languageCookieName)?.value ?? defaultLanguage,
  );

  return lang;
}
