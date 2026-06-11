"use server";

import {
  db,
  ContactGroups,
  Contacts,
  type InsertContacts,
  type SelectContactGroups,
  type SelectContacts,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export type ContactInput = Omit<InsertContacts, "id" | "uuid" | "createdAt" | "updatedAt">;

export type ContactActionResult = {
  contactUuid?: string;
  error?: string;
  success?: boolean;
};

export type ContactListItem = SelectContacts & { contactGroupName: string | null };
export type ContactGroupOption = Pick<SelectContactGroups, "uuid" | "name">;

export const getContacts = async (): Promise<ContactListItem[]> => {
  const rows = await db
    .select({
      contact: Contacts,
      contactGroupName: ContactGroups.name,
    })
    .from(Contacts)
    .leftJoin(ContactGroups, eq(ContactGroups.uuid, Contacts.contactGroupUuid))
    .orderBy(desc(Contacts.createdAt));

  return rows.map((r) => ({ ...r.contact, contactGroupName: r.contactGroupName ?? null }));
};

export const getContactGroups = async (): Promise<ContactGroupOption[]> => {
  const rows = await db
    .select({ uuid: ContactGroups.uuid, name: ContactGroups.name })
    .from(ContactGroups)
    .orderBy(ContactGroups.name);
  return rows;
};

export const createContact = async (input: ContactInput): Promise<ContactActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(Contacts).values({ ...input, uuid });
    return { success: true, contactUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create contact",
    };
  }
};
