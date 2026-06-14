"use server";

import {
  db,
  ContractGroups,
  Contracts,
  type InsertContractGroups,
  type SelectContractGroups,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { alias } from "drizzle-orm/mysql-core";
import { count, desc, eq } from "drizzle-orm";

export type ContractGroupItem = SelectContractGroups & { subgroupName: string | null };

export type ContractGroupInput = Omit<InsertContractGroups, "id" | "uuid" | "createdAt" | "updatedAt">;

export type ContractGroupActionResult = {
  success?: boolean;
  error?: string;
};

export const getContractGroupsList = async (): Promise<ContractGroupItem[]> => {
  const Subgroup = alias(ContractGroups, "subgroup");
  const rows = await db
    .select({ group: ContractGroups, subgroupName: Subgroup.name })
    .from(ContractGroups)
    .leftJoin(Subgroup, eq(Subgroup.uuid, ContractGroups.contractSubgroupUuid))
    .orderBy(desc(ContractGroups.createdAt));
  return rows.map((r) => ({ ...r.group, subgroupName: r.subgroupName ?? null }));
};

export const createContractGroup = async (
  input: ContractGroupInput,
): Promise<ContractGroupActionResult> => {
  try {
    await db.insert(ContractGroups).values({ ...input, uuid: generateUuid() });
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create group",
    };
  }
};

export const updateContractGroup = async (
  uuid: string,
  input: ContractGroupInput,
): Promise<ContractGroupActionResult> => {
  try {
    await db.update(ContractGroups).set(input).where(eq(ContractGroups.uuid, uuid));
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update group",
    };
  }
};

export const deleteContractGroup = async (
  uuid: string,
): Promise<ContractGroupActionResult> => {
  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(Contracts)
      .where(eq(Contracts.contractGroupUuid, uuid));

    if (total > 0) {
      return { error: "Cannot delete a contract group that has contracts assigned to it." };
    }

    await db.delete(ContractGroups).where(eq(ContractGroups.uuid, uuid));
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete group",
    };
  }
};
