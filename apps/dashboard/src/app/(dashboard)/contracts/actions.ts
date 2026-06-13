"use server";

import {
  db,
  Companies,
  ContractCompanyLinks,
  ContractGroups,
  Contracts,
  type InsertContractCompanyLinks,
  type InsertContracts,
  type SelectCompanies,
  type SelectContractGroups,
  type SelectContracts,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { asc, desc, eq } from "drizzle-orm";

export type ContractInput = Omit<InsertContracts, "id" | "uuid" | "createdAt" | "updatedAt">;
export type ContractCompanyLinkInput = Omit<InsertContractCompanyLinks, "id" | "uuid" | "contractUuid" | "createdAt" | "updatedAt">;

export type ContractActionResult = {
  contractUuid?: string;
  error?: string;
  success?: boolean;
};

export type ContractListItem = SelectContracts & { contractGroupName: string | null };
export type ContractGroupOption = Pick<SelectContractGroups, "uuid" | "name">;
export type CompanyOption = Pick<SelectCompanies, "uuid" | "searchCode1" | "companyName" | "roles">;

export const getContracts = async (): Promise<ContractListItem[]> => {
  const rows = await db
    .select({
      contract: Contracts,
      contractGroupName: ContractGroups.name,
    })
    .from(Contracts)
    .leftJoin(ContractGroups, eq(ContractGroups.uuid, Contracts.contractGroupUuid))
    .orderBy(desc(Contracts.createdAt));

  return rows.map((r) => ({ ...r.contract, contractGroupName: r.contractGroupName ?? null }));
};

export const getContractGroups = async (): Promise<ContractGroupOption[]> => {
  const rows = await db
    .select({ uuid: ContractGroups.uuid, name: ContractGroups.name })
    .from(ContractGroups)
    .orderBy(ContractGroups.name);
  return rows;
};

export const getCompaniesForSelect = async (): Promise<CompanyOption[]> => {
  const rows = await db
    .select({ uuid: Companies.uuid, searchCode1: Companies.searchCode1, companyName: Companies.companyName, roles: Companies.roles })
    .from(Companies)
    .orderBy(asc(Companies.companyName));
  return rows;
};

export const createContract = async (
  input: ContractInput,
  companyLinks: ContractCompanyLinkInput[] = [],
): Promise<ContractActionResult> => {
  const uuid = generateUuid();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(Contracts).values({ ...input, uuid });
      if (companyLinks.length > 0) {
        await tx.insert(ContractCompanyLinks).values(
          companyLinks.map((link) => ({ ...link, uuid: generateUuid(), contractUuid: uuid })),
        );
      }
    });
    return { success: true, contractUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create contract",
    };
  }
};
