"use server";

import { db } from "@/db";
import {
  InsertWarehouses,
  SelectWarehouses,
  Warehouses,
} from "@/db/schema/warehouses";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
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

/** Locations as a picker needs them — identity only. */
export const getLocationsForSelect = async (): Promise<LocationOption[]> =>
  db
    .select({ uuid: Warehouses.uuid, name: Warehouses.name })
    .from(Warehouses)
    .where(
      and(isNotNull(Warehouses.parentUuid), eq(Warehouses.type, "location")),
    )
    .orderBy(asc(Warehouses.name));

export const getLocations = async (): Promise<SelectWarehouses[]> => {
  try {
    return await db
      .select()
      .from(Warehouses)
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
