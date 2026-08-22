"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Machines, SelectMachines } from "@/db/schema/machines";
import {
  SelectWarehouseWorkOrders,
  WarehouseWorkOrders,
} from "@/db/schema/warehouse-work-orders";
import {
  InsertWarehouses,
  SelectWarehouses,
  Warehouses,
} from "@/db/schema/warehouses";
import { describeError, generateUuid } from "@/lib/helpers";
import { checkPrintSetup } from "@/app/(dashboard)/warehouses/print-setup";
import { asc, desc, eq, getTableColumns, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

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

export type WarehouseChildRow = Pick<
  SelectWarehouses,
  "uuid" | "name" | "type" | "locationType" | "blocked" | "pickingSequence"
>;

export type WarehouseMachineRow = Pick<
  SelectMachines,
  "uuid" | "code" | "name" | "production" | "outOfBusiness"
>;

export type WarehouseDetail = SelectWarehouses & {
  parentName: SelectWarehouses["name"] | null;
  transportByCompanyName: SelectCompanies["companyName"] | null;
  pickupDefaultLocationName: SelectWarehouses["name"] | null;
  children: WarehouseChildRow[];
  machines: WarehouseMachineRow[];
  workOrders: SelectWarehouseWorkOrders[];
};

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

/**
 * One warehouse row with everything recorded on it, plus what sits under it.
 *
 * `Warehouses` is one table holding three things the sidebar lists separately —
 * root warehouses, their sub-sections, and locations — so this one query serves
 * the detail screen for all three. Which it is reads off `type` and whether it
 * has a parent, rather than from the route it was reached by.
 */
export const getWarehouseDetail = async (
  uuid: string,
): Promise<WarehouseDetail | null> => {
  const ParentWarehouse = alias(Warehouses, "parent_warehouse");
  const PickupLocation = alias(Warehouses, "pickup_location");

  const [warehouse] = await db
    .select({
      ...getTableColumns(Warehouses),
      parentName: ParentWarehouse.name,
      transportByCompanyName: Companies.companyName,
      pickupDefaultLocationName: PickupLocation.name,
    })
    .from(Warehouses)
    .leftJoin(ParentWarehouse, eq(ParentWarehouse.uuid, Warehouses.parentUuid))
    .leftJoin(Companies, eq(Companies.uuid, Warehouses.transportByCompanyUuid))
    .leftJoin(
      PickupLocation,
      eq(PickupLocation.uuid, Warehouses.pickupDefaultLocationUuid),
    )
    .where(eq(Warehouses.uuid, uuid))
    .limit(1);

  if (!warehouse) {
    return null;
  }

  const [children, machines, workOrders] = await Promise.all([
    db
      .select({
        uuid: Warehouses.uuid,
        name: Warehouses.name,
        type: Warehouses.type,
        locationType: Warehouses.locationType,
        blocked: Warehouses.blocked,
        pickingSequence: Warehouses.pickingSequence,
      })
      .from(Warehouses)
      .where(eq(Warehouses.parentUuid, uuid))
      .orderBy(asc(Warehouses.pickingSequence), asc(Warehouses.name)),
    db
      .select({
        uuid: Machines.uuid,
        code: Machines.code,
        name: Machines.name,
        production: Machines.production,
        outOfBusiness: Machines.outOfBusiness,
      })
      .from(Machines)
      .where(eq(Machines.stockLocationUuid, uuid))
      .orderBy(asc(Machines.code)),
    db
      .select()
      .from(WarehouseWorkOrders)
      .where(eq(WarehouseWorkOrders.warehouseUuid, uuid))
      .orderBy(desc(WarehouseWorkOrders.createdAt)),
  ]);

  return { ...warehouse, children, machines, workOrders };
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

  // A slip sent to a device that cannot produce it, or a paper tray on a device
  // with no trays, only shows up as a bad print run on the floor.
  const printProblem = checkPrintSetup(fields);
  if (printProblem) {
    return { error: printProblem };
  }

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
