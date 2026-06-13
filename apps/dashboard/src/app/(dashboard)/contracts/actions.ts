"use server";

import {
  db,
  ContractGroups,
  Contracts,
  type InsertContracts,
  type SelectContractGroups,
  type SelectContracts,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export type ContractInput = Omit<InsertContracts, "id" | "uuid" | "createdAt" | "updatedAt">;

export type ContractActionResult = {
  contractUuid?: string;
  error?: string;
  success?: boolean;
};

export type ContractListItem = SelectContracts & { contractGroupName: string | null };
export type ContractGroupOption = Pick<SelectContractGroups, "uuid" | "name">;

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

export const createContract = async (input: ContractInput): Promise<ContractActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(Contracts).values({ ...input, uuid });
    return { success: true, contractUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create contract",
    };
  }
};
