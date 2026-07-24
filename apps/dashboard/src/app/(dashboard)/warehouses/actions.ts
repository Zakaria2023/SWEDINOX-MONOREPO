"use server";

import { db } from "@/db";
import { WarehouseWorkOrders } from "@/db/schema/warehouse-work-orders";
import {
  InsertWarehouses,
  SelectWarehouses,
  Warehouses,
} from "@/db/schema/warehouses";
import { describeError, generateUuid } from "@/lib/helpers";
import { asc, desc, eq, isNull } from "drizzle-orm";

export type WarehouseOption = Pick<SelectWarehouses, "uuid" | "name">;

export type WarehouseItemOption = Pick<
  SelectWarehouses,
  | "uuid"
  | "name"
  | "parentUuid"
  | "locationType"
  | "loadingLocation"
  | "blocked"
  | "blockReason"
  | "blockedForOptimization"
  | "limitedDimensions"
  | "minLength"
  | "maxLength"
  | "maxWidth"
  | "maxWeight"
  | "productTypes"
>;

export type WarehouseAdaptData = Pick<
  SelectWarehouses,
  | "locationType"
  | "loadingLocation"
  | "address"
  | "blocked"
  | "blockReason"
  | "blockedForOptimization"
  | "limitedDimensions"
  | "minLength"
  | "maxLength"
  | "maxWidth"
  | "maxWeight"
  | "productTypes"
  | "loadLocations"
>;

export type WarehouseFields = Omit<
  InsertWarehouses,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type WarehouseActionResult = {
  warehouseUuid?: string;
  error?: string;
  success?: boolean;
};

export type WarehouseLocationOption = Pick<SelectWarehouses, "uuid" | "name">;

export type MachineStockLocationOption = Pick<
  SelectWarehouses,
  "uuid" | "name"
>;

/** Warehouses of type "location" — for the pick-up default location dropdown */
export const getWarehouseLocationsForSelect = async (): Promise<
  WarehouseLocationOption[]
> =>
  db
    .select({ uuid: Warehouses.uuid, name: Warehouses.name })
    .from(Warehouses)
    .where(eq(Warehouses.type, "location"))
    .orderBy(asc(Warehouses.name));

export const getMachineStockLocationsForSelect = async (): Promise<
  MachineStockLocationOption[]
> =>
  db
    .select({ uuid: Warehouses.uuid, name: Warehouses.name })
    .from(Warehouses)
    .where(eq(Warehouses.type, "location"))
    .orderBy(asc(Warehouses.name));

/** Root-level warehouses only — for the warehouse adapt-from dropdown */
export const getWarehousesForSelect = async (): Promise<WarehouseOption[]> =>
  db
    .select({ uuid: Warehouses.uuid, name: Warehouses.name })
    .from(Warehouses)
    .where(isNull(Warehouses.parentUuid))
    .orderBy(asc(Warehouses.name));

/** All items (root + children) — for the sub-section adapt-from dropdown */
export const getAllWarehouseItemsForSelect = async (): Promise<
  WarehouseItemOption[]
> =>
  db
    .select({
      uuid: Warehouses.uuid,
      name: Warehouses.name,
      parentUuid: Warehouses.parentUuid,
      locationType: Warehouses.locationType,
      loadingLocation: Warehouses.loadingLocation,
      blocked: Warehouses.blocked,
      blockReason: Warehouses.blockReason,
      blockedForOptimization: Warehouses.blockedForOptimization,
      limitedDimensions: Warehouses.limitedDimensions,
      minLength: Warehouses.minLength,
      maxLength: Warehouses.maxLength,
      maxWidth: Warehouses.maxWidth,
      maxWeight: Warehouses.maxWeight,
      productTypes: Warehouses.productTypes,
    })
    .from(Warehouses)
    .orderBy(asc(Warehouses.name));

/** Fetch full settings for a single warehouse — used by the Adapt From feature */
export const getWarehouseByUuid = async (
  uuid: string,
): Promise<WarehouseAdaptData | null> => {
  const [row] = await db
    .select({
      locationType: Warehouses.locationType,
      loadingLocation: Warehouses.loadingLocation,
      address: Warehouses.address,
      blocked: Warehouses.blocked,
      blockReason: Warehouses.blockReason,
      blockedForOptimization: Warehouses.blockedForOptimization,
      limitedDimensions: Warehouses.limitedDimensions,
      minLength: Warehouses.minLength,
      maxLength: Warehouses.maxLength,
      maxWidth: Warehouses.maxWidth,
      maxWeight: Warehouses.maxWeight,
      productTypes: Warehouses.productTypes,
      loadLocations: Warehouses.loadLocations,
    })
    .from(Warehouses)
    .where(eq(Warehouses.uuid, uuid))
    .limit(1);
  return row ?? null;
};

export const getWarehouses = async (): Promise<SelectWarehouses[]> => {
  try {
    return await db
      .select()
      .from(Warehouses)
      .where(isNull(Warehouses.parentUuid))
      .orderBy(desc(Warehouses.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch warehouses"));
  }
};

export const updateWarehouseDocuments = async (
  warehouseUuid: string,
  documents: Array<{ id: string; fileName: string }>,
): Promise<void> => {
  await db
    .update(Warehouses)
    .set({ documents })
    .where(eq(Warehouses.uuid, warehouseUuid));
};

export const createWarehouse = async (
  fields: WarehouseFields,
): Promise<WarehouseActionResult> => {
  const uuid = generateUuid();
  const workOrderUuid = generateUuid();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(Warehouses).values({ ...fields, uuid });
      await tx.insert(WarehouseWorkOrders).values({
        uuid: workOrderUuid,
        warehouseUuid: uuid,
      });
    });
    return { success: true, warehouseUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create warehouse",
    };
  }
};
