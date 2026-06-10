"use server";

import {
  db,
  LoadingLocations,
  Locations,
  type InsertLocations,
  type SelectLocations,
  type SelectLoadingLocations,
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

export type LoadingLocationOption = Pick<SelectLoadingLocations, "uuid" | "name">;

export type LocationSelectOption = {
  uuid: string;
  name: string;
};

export const getLocations = async (): Promise<LocationListItem[]> =>
  db.select().from(Locations).orderBy(desc(Locations.createdAt));

export const getLoadingLocations = async (): Promise<LoadingLocationOption[]> =>
  db
    .select({ uuid: LoadingLocations.uuid, name: LoadingLocations.name })
    .from(LoadingLocations)
    .orderBy(LoadingLocations.name);

export const getLocationsForSelect = async (): Promise<LocationSelectOption[]> =>
  db
    .select({ uuid: Locations.uuid, name: Locations.name })
    .from(Locations)
    .orderBy(Locations.name);

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
