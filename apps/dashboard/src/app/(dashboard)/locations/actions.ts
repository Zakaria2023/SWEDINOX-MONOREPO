"use server";

import {
  db,
  Companies,
  CompanyAddresses,
  LoadingLocations,
  Locations,
  type InsertLocations,
  type SelectLocations,
  type SelectLoadingLocations,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

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

export type AddressOption = {
  uuid: string;
  companyName: string;
  streetAndNo: string | null;
  city: string | null;
};

export const getLocations = async (): Promise<LocationListItem[]> =>
  db.select().from(Locations).orderBy(desc(Locations.createdAt));

export const getLoadingLocations = async (): Promise<LoadingLocationOption[]> =>
  db
    .select({ uuid: LoadingLocations.uuid, name: LoadingLocations.name })
    .from(LoadingLocations)
    .orderBy(LoadingLocations.name);

export const getAddressesForSelect = async (): Promise<AddressOption[]> => {
  const rows = await db
    .select({
      uuid: CompanyAddresses.uuid,
      companyName: Companies.companyName,
      streetAndNo: CompanyAddresses.streetAndNo,
      city: CompanyAddresses.city,
    })
    .from(CompanyAddresses)
    .innerJoin(Companies, eq(Companies.uuid, CompanyAddresses.companyUuid))
    .orderBy(Companies.companyName);
  return rows;
};

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
