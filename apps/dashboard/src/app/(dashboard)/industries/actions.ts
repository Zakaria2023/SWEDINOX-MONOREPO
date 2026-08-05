"use server";

import {
  db,
  Companies,
  Industries,
  InsertIndustries,
  SelectCompanies,
  SelectIndustries,
} from "@/db";
import { asc, eq } from "drizzle-orm";

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

export type IndustryCompanyRow = Pick<
  SelectCompanies,
  "uuid" | "id" | "companyName" | "roles" | "classification"
>;

export type IndustryDetail = SelectIndustries & {
  companies: IndustryCompanyRow[];
};

/** All industries (SBI codes) — for the Marketing Industry dropdown */
export const getIndustriesForSelect = async (): Promise<IndustryOption[]> =>
  db
    .select({ id: Industries.id, name: Industries.name })
    .from(Industries)
    .orderBy(asc(Industries.id));

export const getIndustries = async (): Promise<SelectIndustries[]> =>
  db.select().from(Industries).orderBy(asc(Industries.id));

/**
 * One industry (SBI code) with the companies filed under it. `Companies.industry`
 * stores the SBI code as a plain string rather than a foreign key, so the match
 * is on the code itself.
 */
export const getIndustryDetail = async (
  id: string,
): Promise<IndustryDetail | null> => {
  const [industry] = await db
    .select()
    .from(Industries)
    .where(eq(Industries.id, id))
    .limit(1);

  if (!industry) {
    return null;
  }

  const companies = await db
    .select({
      uuid: Companies.uuid,
      id: Companies.id,
      companyName: Companies.companyName,
      roles: Companies.roles,
      classification: Companies.classification,
    })
    .from(Companies)
    .where(eq(Companies.industry, id))
    .orderBy(asc(Companies.companyName));

  return { ...industry, companies };
};

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
