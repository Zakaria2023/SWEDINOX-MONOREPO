"use server";

import { db } from "@/db";
import {
  InsertWarehouseSubSections,
  WarehouseSubSections,
} from "@/db/schema/warehouse-sub-sections";
import { generateUuid } from "@/lib/helpers";
import { asc, desc } from "drizzle-orm";
import type { SelectWarehouseSubSections } from "@/db/schema/warehouse-sub-sections";

export type WarehouseSubSectionOption = Pick<
  SelectWarehouseSubSections,
  "uuid" | "name" | "warehouseUuid"
>;

export const getWarehouseSubSectionsForSelect =
  async (): Promise<WarehouseSubSectionOption[]> => {
    return db
      .select({
        uuid: WarehouseSubSections.uuid,
        name: WarehouseSubSections.name,
        warehouseUuid: WarehouseSubSections.warehouseUuid,
      })
      .from(WarehouseSubSections)
      .orderBy(asc(WarehouseSubSections.name));
  };

export type WarehouseSubSectionFields = Omit<
  InsertWarehouseSubSections,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type WarehouseSubSectionActionResult = {
  subSectionUuid?: string;
  error?: string;
  success?: boolean;
};

export const getWarehouseSubSections = async () => {
  try {
    return await db
      .select()
      .from(WarehouseSubSections)
      .orderBy(desc(WarehouseSubSections.createdAt));
  } catch {
    throw new Error("Failed to fetch warehouse sub sections");
  }
};

export const createWarehouseSubSection = async (
  fields: WarehouseSubSectionFields,
): Promise<WarehouseSubSectionActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(WarehouseSubSections).values({ ...fields, uuid });
    return { success: true, subSectionUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create warehouse sub section",
    };
  }
};
