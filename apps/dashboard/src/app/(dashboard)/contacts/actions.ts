"use server";

import {
  db,
  Companies,
  CompanyAddresses,
  ContactCategories,
  ContactCategoryLinks,
  Contacts,
  Locations,
  type InsertContacts,
  type SelectContactCategories,
  type SelectContacts,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export type ContactInput = Omit<
  InsertContacts,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type ContactActionResult = {
  contactUuid?: string;
  error?: string;
  success?: boolean;
};

export type ContactListItem = SelectContacts;
export type ContactCategoryOption = Pick<SelectContactCategories, "uuid" | "name">;

export type AddressOption = {
  uuid: string;
  companyName: string;
  streetAndNo: string | null;
  city: string | null;
};

export type LocationOption = {
  uuid: string;
  name: string;
};

export const getContacts = async (): Promise<ContactListItem[]> =>
  db.select().from(Contacts).orderBy(desc(Contacts.createdAt));

export const getContactCategories = async (): Promise<ContactCategoryOption[]> =>
  db
    .select({ uuid: ContactCategories.uuid, name: ContactCategories.name })
    .from(ContactCategories)
    .where(eq(ContactCategories.isActive, true))
    .orderBy(ContactCategories.name);

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

export const getLocationsForSelect = async (): Promise<LocationOption[]> =>
  db
    .select({ uuid: Locations.uuid, name: Locations.name })
    .from(Locations)
    .orderBy(Locations.name);

export const createContact = async (
  input: ContactInput,
  categoryUuids: string[] = [],
): Promise<ContactActionResult> => {
  const contactUuid = generateUuid();

  try {
    await db.transaction(async (tx) => {
      await tx.insert(Contacts).values({ ...input, uuid: contactUuid });

      for (const categoryUuid of categoryUuids) {
        await tx.insert(ContactCategoryLinks).values({
          contactUuid,
          contactCategoryUuid: categoryUuid,
        });
      }
    });

    return { success: true, contactUuid };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create contact",
    };
  }
};
