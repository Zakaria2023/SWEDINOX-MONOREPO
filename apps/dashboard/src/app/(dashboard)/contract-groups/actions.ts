"use server";

import {
  db,
  ContractGroups,
  InsertContractGroups,
  SelectContractGroups,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { alias } from "drizzle-orm/mysql-core";
import { desc, eq, getTableColumns } from "drizzle-orm";

// The reference's `Contractgroups` grid reads `Contract group · Main group ·
// Main seq. · Subgroup · Sub seq.` — two levels above the group. Here a group
// points at its subgroup, and the subgroup at its main group, so both are one
// join away.
export type ContractGroupItem = SelectContractGroups & {
  subgroupName: SelectContractGroups["name"] | null;
  mainGroupName: SelectContractGroups["name"] | null;
  mainGroupSequence: SelectContractGroups["sequenceWithinSubgroup"] | null;
};
export type ContractGroupOption = Pick<SelectContractGroups, "uuid" | "name">;

export type ContractGroupInput = Omit<
  InsertContractGroups,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type ContractGroupActionResult = {
  success?: boolean;
  error?: string;
};

export const getContractGroups = async (): Promise<ContractGroupOption[]> =>
  db
    .select({ uuid: ContractGroups.uuid, name: ContractGroups.name })
    .from(ContractGroups)
    .orderBy(ContractGroups.name);

export const getContractGroupsList = async (): Promise<ContractGroupItem[]> => {
  const subgroup = alias(ContractGroups, "subgroup");
  const mainGroup = alias(ContractGroups, "main_group");
  return db
    .select({
      ...getTableColumns(ContractGroups),
      subgroupName: subgroup.name,
      mainGroupName: mainGroup.name,
      mainGroupSequence: subgroup.sequenceWithinSubgroup,
    })
    .from(ContractGroups)
    .leftJoin(subgroup, eq(subgroup.uuid, ContractGroups.contractSubgroupUuid))
    .leftJoin(mainGroup, eq(mainGroup.uuid, subgroup.contractSubgroupUuid))
    .orderBy(desc(ContractGroups.createdAt));
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
