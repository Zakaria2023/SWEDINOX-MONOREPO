"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import {
  ProductionCapacity,
  SelectProductionCapacity,
} from "@/db/schema/production-capacity";
import { Machines, SelectMachines } from "@/db/schema/machines";
import { asc, desc, eq, getTableColumns } from "drizzle-orm";

export type ProductionCapacityListItem = SelectProductionCapacity & {
  machineCode: SelectMachines["code"] | null;
  machineName: SelectMachines["name"] | null;
  machineType: SelectMachines["production"] | null;
};

export const getProductionCapacity = async (): Promise<
  ProductionCapacityListItem[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(ProductionCapacity),
        machineCode: Machines.code,
        machineName: Machines.name,
        machineType: Machines.production,
      })
      .from(ProductionCapacity)
      .leftJoin(Machines, eq(ProductionCapacity.machineUuid, Machines.uuid))
      .orderBy(desc(ProductionCapacity.capacityDate), asc(Machines.code));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch production capacity"));
  }
};
