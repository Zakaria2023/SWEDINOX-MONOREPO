"use server";

import {
  db,
  ContactGroups,
  type InsertContactGroups,
  type SelectContactGroups,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { alias } from "drizzle-orm/mysql-core";
import { desc, eq } from "drizzle-orm";

export type ContactGroupItem = SelectContactGroups & { subgroupName: string | null };

export type ContactGroupInput = {
  name: string;
  description?: string;
  contractSubgroupUuid?: string;
  sequenceWithinSubgroup: number;
  quicklyChangeSequenceNumber?: string;
  isActive: boolean;
};

export type ContactGroupActionResult = {
  success?: boolean;
  error?: string;
};

export const getContactGroupsList = async (): Promise<ContactGroupItem[]> => {
  const Subgroup = alias(ContactGroups, "subgroup");
  const rows = await db
    .select({ group: ContactGroups, subgroupName: Subgroup.name })
    .from(ContactGroups)
    .leftJoin(Subgroup, eq(Subgroup.uuid, ContactGroups.contractSubgroupUuid))
    .orderBy(desc(ContactGroups.createdAt));
  return rows.map((r) => ({ ...r.group, subgroupName: r.subgroupName ?? null }));
};

export const createContactGroup = async (
  input: ContactGroupInput,
): Promise<ContactGroupActionResult> => {
  try {
    await db.insert(ContactGroups).values({
      uuid: generateUuid(),
      name: input.name,
      description: input.description || null,
      contractSubgroupUuid: input.contractSubgroupUuid || null,
      sequenceWithinSubgroup: input.sequenceWithinSubgroup,
      quicklyChangeSequenceNumber: input.quicklyChangeSequenceNumber || null,
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
        contractSubgroupUuid: input.contractSubgroupUuid || null,
        sequenceWithinSubgroup: input.sequenceWithinSubgroup,
        quicklyChangeSequenceNumber: input.quicklyChangeSequenceNumber || null,
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
