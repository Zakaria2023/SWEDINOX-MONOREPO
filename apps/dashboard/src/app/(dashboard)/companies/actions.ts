"use server";

import { db, type SelectCompanies } from "@/db";
import { Companies } from "@/db/schema/companies";
import {
  CompanyAddresses,
  type InsertCompanyAddresses,
} from "@/db/schema/company-addresses";
import { CompanyRoleLinks } from "@/db/schema/company-role-links";
import { CommunicationSettings } from "@/db/schema/communication-settings";
import { Contracts } from "@/db/schema/contracts";
import type {
  CommunicationSettingDocumentType,
  CommunicationSettingShape,
  CommunicationSettingType,
  CompanyLang,
  CompanyRole,
} from "@/lib/enums";
import { generateUuid } from "@/lib/helpers";
import { desc } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export type AddressInput = Omit<InsertCompanyAddresses, "uuid" | "companyUuid">;

export type CommSettingInput = {
  documentType: CommunicationSettingDocumentType;
  communicationType: CommunicationSettingType;
  shape?: CommunicationSettingShape;
  contractUuid?: string;
  email?: string;
  fax?: string;
};

export type ContractOption = {
  uuid: string;
  description: string;
};

export type CompanyFields = {
  companyName: string;
  correspName?: string;
  remarks?: string;
  lang?: CompanyLang;
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

export const getContractsForCompanyForm = async (): Promise<ContractOption[]> =>
  db
    .select({ uuid: Contracts.uuid, description: Contracts.description })
    .from(Contracts)
    .orderBy(Contracts.description);

export const createCompany = async (
  companyFields: CompanyFields,
  firstAddress: AddressInput,
  additionalAddresses: AddressInput[] = [],
  roles: CompanyRole[] = [],
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
      await tx.insert(Companies).values({
        ...companyFields,
        uuid,
      });

      await tx.insert(CompanyAddresses).values({
        ...firstAddress,
        uuid,
        companyUuid: uuid,
      });

      for (const addr of additionalAddresses) {
        await tx.insert(CompanyAddresses).values({
          ...addr,
          uuid,
          companyUuid: uuid,
        });
      }

      for (const role of roles) {
        await tx.insert(CompanyRoleLinks).values({ companyUuid: uuid, role });
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
