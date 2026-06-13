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
import { desc, isNull } from "drizzle-orm";

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

export type LocationForTree = {
  uuid: string;
  name: string;
  adoptFrom: string | null;
};

export const getLocations = async (): Promise<LocationListItem[]> =>
  db.select().from(Locations).orderBy(desc(Locations.createdAt));

export const getLocationsForTree = async (): Promise<LocationForTree[]> =>
  db
    .select({ uuid: Locations.uuid, name: Locations.name, adoptFrom: Locations.adoptFrom })
    .from(Locations)
    .orderBy(Locations.name);

export const getRootLocations = async (): Promise<LocationForTree[]> =>
  db
    .select({ uuid: Locations.uuid, name: Locations.name, adoptFrom: Locations.adoptFrom })
    .from(Locations)
    .where(isNull(Locations.adoptFrom))
    .orderBy(Locations.name);

export const getLoadingLocations = async (): Promise<LoadingLocationOption[]> => {
  try {
    return await db
      .select({ uuid: LoadingLocations.uuid, name: LoadingLocations.name })
      .from(LoadingLocations)
      .orderBy(LoadingLocations.name);
  } catch {
    return [];
  }
};

export const getLocationsForSelect = async (): Promise<LocationSelectOption[]> =>
  db
    .select({ uuid: Locations.uuid, name: Locations.name })
    .from(Locations)
    .orderBy(Locations.name);

export const createLocation = async (
  input: LocationInput & { newLoadingLocationName?: string },
): Promise<LocationActionResult> => {
  const { newLoadingLocationName, ...locationInput } = input;
  const uuid = generateUuid();

  try {
    if (newLoadingLocationName?.trim()) {
      await db.transaction(async (tx) => {
        await tx.insert(LoadingLocations).values({
          uuid: uuid,
          name: newLoadingLocationName.trim(),
        });
        await tx.insert(Locations).values({
          ...locationInput,
          uuid: uuid,
          loadingLocationUuid: uuid,
        });
      });
    } else {
      await db.insert(Locations).values({
        ...locationInput,
        uuid: uuid,
      });
    }

    return { success: true, locationUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create location",
    };
  }
};
