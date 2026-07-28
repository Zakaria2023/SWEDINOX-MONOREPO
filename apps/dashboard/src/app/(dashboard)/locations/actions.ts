"use server";

import { db } from "@/db";
import {
  InsertWarehouses,
  SelectWarehouses,
  Warehouses,
} from "@/db/schema/warehouses";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";

export type LocationFields = Omit<
  InsertWarehouses,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

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
