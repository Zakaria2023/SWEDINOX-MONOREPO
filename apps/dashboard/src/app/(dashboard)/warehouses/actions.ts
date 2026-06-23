"use server";

import { db } from "@/db";
import { InsertWarehouses, Warehouses } from "@/db/schema/warehouses";
import { WarehouseWorkOrders } from "@/db/schema/warehouse-work-orders";
import { generateUuid } from "@/lib/helpers";
import { asc, desc, eq, isNull } from "drizzle-orm";
import { SelectWarehouses } from "@/db/schema/warehouses";

export type WarehouseOption = Pick<
  SelectWarehouses,
  | "uuid"
  | "name"
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

export type WarehouseFields = Omit<
  InsertWarehouses,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type WarehouseActionResult = {
  warehouseUuid?: string;
  error?: string;
  success?: boolean;
};

/** Root-level warehouses only — for the warehouse adapt-from dropdown */
export const getWarehousesForSelect = async (): Promise<WarehouseOption[]> => {
  return db
    .select({
      uuid: Warehouses.uuid,
      name: Warehouses.name,
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
    .where(isNull(Warehouses.parentUuid))
    .orderBy(asc(Warehouses.name));
};

/** All items (root + children) — for the sub-section adapt-from dropdown */
export const getAllWarehouseItemsForSelect = async (): Promise<
  WarehouseItemOption[]
> => {
  return db
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
};

export const getWarehouses = async (): Promise<SelectWarehouses[]> => {
  try {
    return await db
      .select()
      .from(Warehouses)
      .where(isNull(Warehouses.parentUuid))
      .orderBy(desc(Warehouses.createdAt));
  } catch {
    throw new Error("Failed to fetch warehouses");
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
