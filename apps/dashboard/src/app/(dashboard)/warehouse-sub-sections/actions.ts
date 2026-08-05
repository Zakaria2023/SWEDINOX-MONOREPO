"use server";

import { db } from "@/db";
import {
  InsertWarehouses,
  SelectWarehouses,
  Warehouses,
} from "@/db/schema/warehouses";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type WarehouseSubSectionFields = Omit<
  InsertWarehouses,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

// Editing never moves a sub section, so the parent stays out of the payload.
export type WarehouseSubSectionEditFields = Omit<
  WarehouseSubSectionFields,
  "parentUuid" | "type"
>;

export type WarehouseSubSectionEditItem = SelectWarehouses & {
  parentName: SelectWarehouses["name"] | null;
};

export type WarehouseSubSectionActionResult = {
  subSectionUuid?: string;
  error?: string;
  success?: boolean;
};

export const getWarehouseSubSections = async (): Promise<
  SelectWarehouses[]
> => {
  try {
    return await db
      .select()
      .from(Warehouses)
      .where(
        and(isNotNull(Warehouses.parentUuid), eq(Warehouses.type, "warehouse")),
      )
      .orderBy(desc(Warehouses.createdAt));
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch warehouse sub sections"),
    );
  }
};

export const getWarehouseSubSectionForEdit = async (
  uuid: string,
): Promise<WarehouseSubSectionEditItem | null> => {
  const Parent = alias(Warehouses, "parent_warehouse");

  try {
    const [row] = await db
      .select({ subSection: Warehouses, parentName: Parent.name })
      .from(Warehouses)
      .leftJoin(Parent, eq(Parent.uuid, Warehouses.parentUuid))
      .where(eq(Warehouses.uuid, uuid))
      .limit(1);

    if (!row) {
      return null;
    }

    return { ...row.subSection, parentName: row.parentName ?? null };
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch the warehouse sub section"),
    );
  }
};

export const updateWarehouseSubSection = async (
  uuid: string,
  fields: WarehouseSubSectionEditFields,
): Promise<WarehouseSubSectionActionResult> => {
  try {
    await db.update(Warehouses).set(fields).where(eq(Warehouses.uuid, uuid));
  } catch (error) {
    return {
      error: describeError(error, "Failed to update warehouse sub section"),
    };
  }

  revalidatePath("/warehouse-sub-sections");
  redirect("/warehouse-sub-sections");
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
