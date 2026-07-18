"use server";

import { db, Industries, InsertIndustries, SelectIndustries } from "@/db";
import { asc } from "drizzle-orm";

export type IndustryOption = Pick<SelectIndustries, "id" | "name">;

export type IndustryInput = Omit<
  InsertIndustries,
  "createdAt" | "updatedAt"
>;

export type IndustryActionResult = {
  error?: string;
  success?: boolean;
  industryId?: string;
};

/** All industries (SBI codes) — for the Marketing Industry dropdown */
export const getIndustriesForSelect = async (): Promise<IndustryOption[]> =>
  db
    .select({ id: Industries.id, name: Industries.name })
    .from(Industries)
    .orderBy(asc(Industries.id));

export const getIndustries = async (): Promise<SelectIndustries[]> =>
  db.select().from(Industries).orderBy(asc(Industries.id));

export const createIndustry = async (
  input: IndustryInput,
): Promise<IndustryActionResult> => {
  try {
    await db.insert(Industries).values(input);
    return { success: true, industryId: input.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create industry",
    };
  }
};
