"use server";

import { db, type SelectCompanies } from "@/db";
import { Companies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  type InsertCompanyAddresses,
} from "@/db/schema/company-addresses";
import { CompanyRoleLinks } from "@/db/schema/company-role-links";
import type { CompanyLang, CompanyRole } from "@/lib/enums";
import { generateUuid } from "@/lib/helpers";
import { desc } from "drizzle-orm";

export type AddressInput = Omit<InsertCompanyAddresses, "uuid" | "companyUuid">;

export type CompanyFields = {
  companyName: string;
  correspName?: string;
  remarks?: string;
  lang?: string;
  searchCode1?: string;
  searchCode2?: string;
  searchCode3?: string;
};

export type CompanyActionResult = {
  companyUuid?: string;
  error?: string;
  success?: boolean;
};

export const getCompanies = async (): Promise<SelectCompanies[]> => {
  try {
    return await db.select().from(Companies).orderBy(desc(Companies.createdAt));
  } catch {
    throw new Error("Failed to fetch companies");
  }
};

export const createCompany = async (
  companyFields: CompanyFields,
  firstAddress: AddressInput,
  additionalAddresses: AddressInput[] = [],
  roles: CompanyRole[] = [],
): Promise<CompanyActionResult> => {
  const uuid = generateUuid();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(Companies).values({
        uuid: uuid,
        companyName: companyFields.companyName,
        correspName: companyFields.correspName || undefined,
        remarks: companyFields.remarks || undefined,
        lang: (companyFields.lang as CompanyLang) || undefined,
        searchCode1: companyFields.searchCode1 || undefined,
        searchCode2: companyFields.searchCode2 || undefined,
        searchCode3: companyFields.searchCode3 || undefined,
      });

      await tx.insert(CompanyAddresses).values({
        ...firstAddress,
        uuid: uuid,
        companyUuid: uuid,
      });

      for (const addr of additionalAddresses) {
        await tx.insert(CompanyAddresses).values({
          ...addr,
          uuid: uuid,
          companyUuid: uuid,
        });
      }

      for (const role of roles) {
        await tx.insert(CompanyRoleLinks).values({ companyUuid: uuid, role });
      }
    });

    return { success: true, companyUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create company",
    };
  }
};
