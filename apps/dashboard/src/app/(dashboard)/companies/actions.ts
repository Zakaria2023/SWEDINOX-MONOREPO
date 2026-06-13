"use server";

import { db, type SelectCompanies } from "@/db";
import { Companies, type InsertCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  type InsertCompanyAddresses,
} from "@/db/schema/company-addresses";
import {
  CommunicationSettings,
  type InsertCommunicationSettings,
} from "@/db/schema/communication-settings";
import { generateUuid } from "@/lib/helpers";
import { desc } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export type AddressInput = Omit<InsertCompanyAddresses, "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt">;

export type CommSettingInput = Omit<
  InsertCommunicationSettings,
  "id" | "companyUuid" | "modifiedByUserId" | "createdAt" | "updatedAt"
>;

export type CompanyFields = Omit<
  InsertCompanies,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

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
  addresses: AddressInput[] = [],
  communicationSettings: CommSettingInput[] = [],
): Promise<CompanyActionResult> => {
  const uuid = generateUuid();

  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return { error: "User not authenticated" };
    }

    await db.transaction(async (tx) => {
      await tx.insert(Companies).values({ ...companyFields, uuid });

      for (const address of addresses) {
        await tx.insert(CompanyAddresses).values({
          ...address,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const setting of communicationSettings) {
        await tx.insert(CommunicationSettings).values({
          ...setting,
          companyUuid: uuid,
          modifiedByUserId: userId,
        });
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
