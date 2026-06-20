"use server";

import { db } from "@/db";
import { InsertWarehouses, Warehouses } from "@/db/schema/warehouses";
import { generateUuid } from "@/lib/helpers";
import { asc, desc } from "drizzle-orm";
import type { SelectWarehouses } from "@/db/schema/warehouses";

export type WarehouseFields = Omit<
  InsertWarehouses,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type WarehouseActionResult = {
  warehouseUuid?: string;
  error?: string;
  success?: boolean;
};

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
>;

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
    })
    .from(Warehouses)
    .orderBy(asc(Warehouses.name));
};

export const getWarehouses = async () => {
  try {
    return await db
      .select()
      .from(Warehouses)
      .orderBy(desc(Warehouses.createdAt));
  } catch {
    throw new Error("Failed to fetch warehouses");
  }
};

export const createWarehouse = async (
  fields: WarehouseFields,
): Promise<WarehouseActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(Warehouses).values({ ...fields, uuid });
    return { success: true, warehouseUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create warehouse",
    };
  }
};
