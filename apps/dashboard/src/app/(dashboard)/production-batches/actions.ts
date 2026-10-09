"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  ProductionBatches,
  SelectProductionBatches,
} from "@/db/schema/production-batches";
import { Machines, SelectMachines } from "@/db/schema/machines";
import { SelectWarehouses, Warehouses } from "@/db/schema/warehouses";
import {
  dateRangeFilter,
  runPaged,
  tableWhere,
} from "@/lib/server/table-query";
import { Paged, TableQuery } from "@/lib/table-query";
import { count, desc, eq, getTableColumns } from "drizzle-orm";

const BATCH_SEARCH = [
  ProductionBatches.code,
  Machines.name,
  Warehouses.name,
] as const;

const BATCH_FILTERS = {
  createdOn: dateRangeFilter(ProductionBatches.createdOn),
};

export type ProductionBatchListItem = SelectProductionBatches & {
  machineName: SelectMachines["name"] | null;
  toLocationName: SelectWarehouses["name"] | null;
};

export type ProductionBatchDetail = ProductionBatchListItem & {
  machineCode: SelectMachines["code"] | null;
  machineProduction: SelectMachines["production"] | null;
};

export const getProductionBatches = async (
  query: TableQuery,
): Promise<Paged<ProductionBatchListItem>> => {
  try {
    const where = tableWhere({
      query,
      search: BATCH_SEARCH,
      filters: BATCH_FILTERS,
    });
    return await runPaged(query, {
      rows: (limit, offset) =>
        db
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
          .where(where)
          .orderBy(desc(ProductionBatches.createdAt), desc(ProductionBatches.id))
          .limit(limit)
          .offset(offset),
      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(ProductionBatches)
          .leftJoin(Machines, eq(ProductionBatches.machineUuid, Machines.uuid))
          .leftJoin(
            Warehouses,
            eq(ProductionBatches.toLocationUuid, Warehouses.uuid),
          )
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
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
