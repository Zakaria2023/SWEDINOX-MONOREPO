"use server";

import { cookies } from "next/headers";

export async function getForcedLang(lang: string) {
  const cookiesStore = await cookies();
  const forcedExamLang = cookiesStore.get("forceExamLang")?.value;
  const langToSend = forcedExamLang === "ar" ? "ar" : lang;

  return langToSend;
}
