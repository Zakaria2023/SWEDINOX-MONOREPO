"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  ProductionBatches,
  SelectProductionBatches,
} from "@/db/schema/production-batches";
import { Machines, SelectMachines } from "@/db/schema/machines";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type ProductionBatchListItem = SelectProductionBatches & {
  machineName: SelectMachines["name"] | null;
  toLocationName: SelectWarehouses["name"] | null;
};

export type ProductionBatchDetail = ProductionBatchListItem & {
  machineCode: SelectMachines["code"] | null;
  machineProduction: SelectMachines["production"] | null;
};

export const getProductionBatches = async (): Promise<
  ProductionBatchListItem[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(ProductionBatches),
        machineName: Machines.name,
        toLocationName: Warehouses.name,
      })
      .from(ProductionBatches)
      .leftJoin(Machines, eq(ProductionBatches.machineUuid, Machines.uuid))
      .leftJoin(
        Warehouses,
        eq(ProductionBatches.toLocationUuid, Warehouses.uuid),
      )
      .orderBy(desc(ProductionBatches.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch production batches"));
  }
};

/**
 * One production batch with the machine it ran on and the stock location it was
 * destined for.
 */
export const getProductionBatchDetail = async (
  uuid: string,
): Promise<ProductionBatchDetail | null> => {
  const [row] = await db
    .select({
      ...getTableColumns(ProductionBatches),
      machineName: Machines.name,
      machineCode: Machines.code,
      machineProduction: Machines.production,
      toLocationName: Warehouses.name,
    })
    .from(ProductionBatches)
    .leftJoin(Machines, eq(ProductionBatches.machineUuid, Machines.uuid))
    .leftJoin(Warehouses, eq(ProductionBatches.toLocationUuid, Warehouses.uuid))
    .where(eq(ProductionBatches.uuid, uuid))
    .limit(1);

  return row ?? null;
};
