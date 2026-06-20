"use server";

import { db } from "@/db";
import { InsertWarehouses, Warehouses } from "@/db/schema/warehouses";
import { generateUuid } from "@/lib/helpers";
import { desc, isNotNull } from "drizzle-orm";
import type { SelectWarehouses } from "@/db/schema/warehouses";

export type WarehouseSubSectionFields = Omit<
  InsertWarehouses,
  "id" | "uuid" | "createdAt" | "updatedAt"
> & { parentUuid: string };

export type WarehouseSubSectionActionResult = {
  subSectionUuid?: string;
  error?: string;
  success?: boolean;
};

export const getWarehouseSubSections = async (): Promise<SelectWarehouses[]> => {
  try {
    return await db
      .select()
      .from(Warehouses)
      .where(isNotNull(Warehouses.parentUuid))
      .orderBy(desc(Warehouses.createdAt));
  } catch {
    throw new Error("Failed to fetch warehouse sub sections");
  }
};

export const createWarehouseSubSection = async (
  fields: WarehouseSubSectionFields,
): Promise<WarehouseSubSectionActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(Warehouses).values({ ...fields, uuid });
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
