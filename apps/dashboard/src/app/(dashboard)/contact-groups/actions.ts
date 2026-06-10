"use server";

import {
  db,
  ContactGroups,
  type InsertContactGroups,
  type SelectContactGroups,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export type ContactGroupItem = SelectContactGroups;

export type ContactGroupInput = {
  name: string;
  description?: string;
  isActive: boolean;
};

export type ContactGroupActionResult = {
  success?: boolean;
  error?: string;
};

export const getContactGroupsList = async (): Promise<ContactGroupItem[]> =>
  db.select().from(ContactGroups).orderBy(desc(ContactGroups.createdAt));

export const createContactGroup = async (
  input: ContactGroupInput,
): Promise<ContactGroupActionResult> => {
  try {
    await db.insert(ContactGroups).values({
      uuid: generateUuid(),
      name: input.name,
      description: input.description || null,
      isActive: input.isActive,
    });
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create group",
    };
  }
};

export const updateContactGroup = async (
  uuid: string,
  input: ContactGroupInput,
): Promise<ContactGroupActionResult> => {
  try {
    await db
      .update(ContactGroups)
      .set({
        name: input.name,
        description: input.description || null,
        isActive: input.isActive,
      })
      .where(eq(ContactGroups.uuid, uuid));
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update group",
    };
  }
};

export const deleteContactGroup = async (
  uuid: string,
): Promise<ContactGroupActionResult> => {
  try {
    await db.delete(ContactGroups).where(eq(ContactGroups.uuid, uuid));
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete group",
    };
  }
};
