"use server";

import { db } from "@/db";
import { InsertWarehouses, Warehouses } from "@/db/schema/warehouses";
import { generateUuid } from "@/lib/helpers";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import type { SelectWarehouses } from "@/db/schema/warehouses";

export type LocationFields = Omit<
  InsertWarehouses,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type LocationActionResult = {
  locationUuid?: string;
  error?: string;
  success?: boolean;
};

export const getLocations = async (): Promise<SelectWarehouses[]> => {
  try {
    return await db
      .select()
      .from(Warehouses)
      .where(and(isNotNull(Warehouses.parentUuid), eq(Warehouses.type, "location")))
      .orderBy(desc(Warehouses.createdAt));
  } catch {
    throw new Error("Failed to fetch locations");
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
