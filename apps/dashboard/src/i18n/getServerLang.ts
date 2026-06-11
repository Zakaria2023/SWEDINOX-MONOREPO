"use server";

import { cookies } from "next/headers";

export async function getLang() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "ar";

  return lang;
}
