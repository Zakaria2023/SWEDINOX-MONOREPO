"use server";

import { db } from "@/db";
import {
  InsertWarehouses,
  SelectWarehouses,
  Warehouses,
} from "@/db/schema/warehouses";
import { Products, SelectProducts } from "@/db/schema/products";
import { ProductPreferredLocations } from "@/db/schema/product-details";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, desc, eq, getTableColumns, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type LocationFields = Omit<
  InsertWarehouses,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

// Editing never moves a location, so the parent stays out of the payload.
export type LocationEditFields = Omit<LocationFields, "parentUuid" | "type">;

export type LocationEditItem = SelectWarehouses & {
  parentName: SelectWarehouses["name"] | null;
};

export type LocationActionResult = {
  locationUuid?: string;
  error?: string;
  success?: boolean;
};

export type LocationOption = Pick<SelectWarehouses, "uuid" | "name">;

/**
 * One row of `Locations` — the reference's 11 columns (1 940 locations,
 * exports/locations.tsv) on top of the location's own settings.
 */
export type LocationListItem = SelectWarehouses & {
  subsectionName: SelectWarehouses["name"] | null;
  warehouseName: SelectWarehouses["name"] | null;
  // Computed from the products that prefer this location: one product names
  // itself, several read `Multiple products` as the reference's `Meerdere
  // artikelen` does.
  preferredCount: number;
  preferredProductCode: SelectProducts["productCode"] | null;
  preferredProductName: SelectProducts["name"] | null;
  preferredLength: SelectProducts["length"] | null;
  preferredWidth: SelectProducts["widthDiameter"] | null;
  restockLocationName: SelectWarehouses["name"] | null;
};

/** Locations as a picker needs them — identity only. */
export const getLocationsForSelect = async (): Promise<LocationOption[]> =>
  db
    .select({ uuid: Warehouses.uuid, name: Warehouses.name })
    .from(Warehouses)
    .where(
      and(isNotNull(Warehouses.parentUuid), eq(Warehouses.type, "location")),
    )
    .orderBy(asc(Warehouses.name));

export const getLocations = async (): Promise<LocationListItem[]> => {
  const Subsection = alias(Warehouses, "subsection");
  const Warehouse = alias(Warehouses, "warehouse");
  const Restock = alias(Warehouses, "restock");
  // The first product to prefer the location stands for it.
  const firstPreference = sql`(
    SELECT ${ProductPreferredLocations.uuid} FROM ${ProductPreferredLocations}
    WHERE ${ProductPreferredLocations.locationUuid} = ${Warehouses.uuid}
    ORDER BY ${ProductPreferredLocations.preference}, ${ProductPreferredLocations.id}
    LIMIT 1
  )`;
  try {
    return await db
      .select({
        ...getTableColumns(Warehouses),
        subsectionName: Subsection.name,
        warehouseName: sql<
          string | null
        >`COALESCE(${Warehouse.name}, ${Subsection.name})`,
        preferredCount: sql<number>`(
          SELECT COUNT(*) FROM ${ProductPreferredLocations}
          WHERE ${ProductPreferredLocations.locationUuid} = ${Warehouses.uuid}
        )`.mapWith(Number),
        preferredProductCode: Products.productCode,
        preferredProductName: Products.name,
        preferredLength: Products.length,
        preferredWidth: Products.widthDiameter,
        restockLocationName: Restock.name,
      })
      .from(Warehouses)
      .leftJoin(Subsection, eq(Warehouses.parentUuid, Subsection.uuid))
      .leftJoin(Warehouse, eq(Subsection.parentUuid, Warehouse.uuid))
      .leftJoin(
        ProductPreferredLocations,
        eq(ProductPreferredLocations.uuid, firstPreference),
      )
      .leftJoin(Products, eq(ProductPreferredLocations.productUuid, Products.uuid))
      .leftJoin(
        Restock,
        eq(ProductPreferredLocations.restockLocationUuid, Restock.uuid),
      )
      .where(
        and(isNotNull(Warehouses.parentUuid), eq(Warehouses.type, "location")),
      )
      .orderBy(desc(Warehouses.createdAt));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch locations"));
  }
};

export const getLocationForEdit = async (
  uuid: string,
): Promise<LocationEditItem | null> => {
  const Parent = alias(Warehouses, "parent_warehouse");

  try {
    const [row] = await db
      .select({ location: Warehouses, parentName: Parent.name })
      .from(Warehouses)
      .leftJoin(Parent, eq(Parent.uuid, Warehouses.parentUuid))
      .where(eq(Warehouses.uuid, uuid))
      .limit(1);

    if (!row) {
      return null;
    }

    return { ...row.location, parentName: row.parentName ?? null };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch the location"));
  }
};

export const updateLocation = async (
  uuid: string,
  fields: LocationEditFields,
): Promise<LocationActionResult> => {
  try {
    await db.update(Warehouses).set(fields).where(eq(Warehouses.uuid, uuid));
  } catch (error) {
    return { error: describeError(error, "Failed to update location") };
  }

  revalidatePath("/locations");
  redirect("/locations");
};

export const createLocation = async (
  fields: LocationFields,
): Promise<LocationActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(Warehouses).values({ ...fields, uuid, type: "location" });
    return { success: true, locationUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create location",
    };
  }
};
