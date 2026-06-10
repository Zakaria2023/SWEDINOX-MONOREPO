"use server";

import {
  db,
  Locations,
  type InsertLocations,
  type SelectLocations,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc } from "drizzle-orm";

export type LocationInput = Omit<
  InsertLocations,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type LocationActionResult = {
  error?: string;
  locationUuid?: string;
  success?: boolean;
};

export type LocationListItem = SelectLocations;

export const getLocations = async (): Promise<LocationListItem[]> =>
  db.select().from(Locations).orderBy(desc(Locations.createdAt));

export const createLocation = async (
  input: LocationInput,
): Promise<LocationActionResult> => {
  const locationUuid = generateUuid();

  try {
    await db.insert(Locations).values({
      ...input,
      uuid: locationUuid,
    });

    return { success: true, locationUuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create location",
    };
  }
};
