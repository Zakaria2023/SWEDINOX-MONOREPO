"use server";

import { db } from "@/db";
import { SawingLayouts, SelectSawingLayouts } from "@/db/schema/sawing-layouts";
import { asc, desc } from "drizzle-orm";

export type SawingLayoutListItem = SelectSawingLayouts;

export const getSawingLayouts = async (): Promise<SawingLayoutListItem[]> => {
  try {
    return await db
      .select()
      .from(SawingLayouts)
      .orderBy(desc(SawingLayouts.sawingDate), asc(SawingLayouts.machine));
  } catch {
    throw new Error("Failed to fetch sawing layouts");
  }
};
