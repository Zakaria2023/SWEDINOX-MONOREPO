"use server";

import {
  db,
  ContractGroups,
  InsertContractGroups,
  SelectContractGroups,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { alias } from "drizzle-orm/mysql-core";
import { desc, eq } from "drizzle-orm";

export type ContractGroupItem = SelectContractGroups & {
  subgroupName: string | null;
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
  const rows = await db
    .select({ group: ContractGroups, subgroupName: subgroup.name })
    .from(ContractGroups)
    .leftJoin(subgroup, eq(subgroup.uuid, ContractGroups.contractSubgroupUuid))
    .orderBy(desc(ContractGroups.createdAt));
  return rows.map((r) => ({
    ...r.group,
    subgroupName: r.subgroupName ?? null,
  }));
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
