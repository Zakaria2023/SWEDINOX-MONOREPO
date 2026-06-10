"use server";

import { db, InsertCompanyAddresses, type SelectCompanies } from "@/db";

export type AddressInput = Omit<InsertCompanyAddresses, "uuid" | "companyUuid">;
import { Companies } from "@/db/schema/companies";
import { CompanyAddresses } from "@/db/schema/company-addresses";
import { generateUuid } from "@/lib/helpers";
import { desc } from "drizzle-orm";

export type CompanyActionResult = {
  companyUuid?: string;
  error?: string;
  success?: boolean;
};

export const getCompanies = async (): Promise<SelectCompanies[]> => {
  try {
    const companies = await db
      .select()
      .from(Companies)
      .orderBy(desc(Companies.createdAt));

    return companies;
  } catch {
    throw new Error("Failed to fetch companies");
  }
};

export const createCompany = async (
  companyName: string,
  address: AddressInput,
): Promise<CompanyActionResult> => {
  const uuid = generateUuid();
  const addressUuid = generateUuid();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(Companies).values({ uuid, companyName });
      await tx.insert(CompanyAddresses).values({
        ...address,
        uuid: addressUuid,
        companyUuid: uuid,
      });
    });

    return { success: true, companyUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create company",
    };
  }
};
