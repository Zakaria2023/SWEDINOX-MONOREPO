"use server";

import {
  db,
  ContractGroups,
  type InsertContractGroups,
  type SelectContractGroups,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { alias } from "drizzle-orm/mysql-core";
import { desc, eq } from "drizzle-orm";

export type ContractGroupItem = SelectContractGroups & { subgroupName: string | null };

export type ContractGroupInput = {
  name: string;
  description?: string;
  contractSubgroupUuid?: string;
  sequenceWithinSubgroup: number;
  quicklyChangeSequenceNumber?: string;
  isActive: boolean;
};

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
    await db.insert(ContractGroups).values({
      uuid: generateUuid(),
      name: input.name,
      description: input.description || null,
      contractSubgroupUuid: input.contractSubgroupUuid || null,
      sequenceWithinSubgroup: input.sequenceWithinSubgroup,
      quicklyChangeSequenceNumber: input.quicklyChangeSequenceNumber || null,
      isActive: input.isActive,
    });
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
    await db
      .update(ContractGroups)
      .set({
        name: input.name,
        description: input.description || null,
        contractSubgroupUuid: input.contractSubgroupUuid || null,
        sequenceWithinSubgroup: input.sequenceWithinSubgroup,
        quicklyChangeSequenceNumber: input.quicklyChangeSequenceNumber || null,
        isActive: input.isActive,
      })
      .where(eq(ContractGroups.uuid, uuid));
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
    await db.delete(ContractGroups).where(eq(ContractGroups.uuid, uuid));
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete group",
    };
  }
};
