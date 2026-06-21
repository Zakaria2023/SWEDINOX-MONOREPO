"use server";

import { db, SelectCompanies, SelectCompanyAddresses } from "@/db";
import { Companies, InsertCompanies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  InsertCompanyAddresses,
} from "@/db/schema/company-addresses";
import {
  CommunicationSettings,
  InsertCommunicationSettings,
} from "@/db/schema/communication-settings";
import { Contracts, InsertContracts } from "@/db/schema/contracts";
import { Texts, InsertTexts } from "@/db/schema/texts";
import { generateUuid } from "@/lib/helpers";
import { asc, desc, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export type CompanyOption = Pick<
  SelectCompanies,
  "uuid" | "searchCode1" | "companyName" | "roles"
>;

export type AddressInput = Omit<
  InsertCompanyAddresses,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CommSettingInput = Omit<
  InsertCommunicationSettings,
  "id" | "companyUuid" | "modifiedByUserId" | "createdAt" | "updatedAt"
>;

export type CompanyFields = Omit<
  InsertCompanies,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type CompanyContractInput = Omit<
  InsertContracts,
  "id" | "uuid" | "companyUuid" | "createdAt" | "updatedAt"
>;

export type CompanyTextInput = Omit<
  InsertTexts,
  "id" | "uuid" | "companyUuid" | "createdByUserId" | "createdAt" | "updatedAt"
>;

export type CompanyActionResult = {
  companyUuid?: string;
  error?: string;
  success?: boolean;
};

export type CompanyDetail = SelectCompanies & {
  addresses: SelectCompanyAddresses[];
};

export const getCompanyDetail = async (uuid: string): Promise<CompanyDetail | null> => {
  const [company] = await db
    .select()
    .from(Companies)
    .where(eq(Companies.uuid, uuid))
    .limit(1);
  if (!company) return null;
  const addresses = await db
    .select()
    .from(CompanyAddresses)
    .where(eq(CompanyAddresses.companyUuid, uuid));
  return { ...company, addresses };
};

export const getCompaniesForSelect = async (): Promise<CompanyOption[]> => {
  return db
    .select({
      uuid: Companies.uuid,
      searchCode1: Companies.searchCode1,
      companyName: Companies.companyName,
      roles: Companies.roles,
    })
    .from(Companies)
    .orderBy(asc(Companies.companyName));
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
  contracts: CompanyContractInput[] = [],
  texts: CompanyTextInput[] = [],
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

      for (const contract of contracts) {
        await tx.insert(Contracts).values({
          ...contract,
          uuid: generateUuid(),
          companyUuid: uuid,
        });
      }

      for (const text of texts) {
        await tx.insert(Texts).values({
          ...text,
          uuid: generateUuid(),
          companyUuid: uuid,
          createdByUserId: userId,
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
