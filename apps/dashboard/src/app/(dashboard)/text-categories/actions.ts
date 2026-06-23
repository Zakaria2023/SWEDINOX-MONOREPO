"use server";

import {
  db,
  TextCategories,
  InsertTextCategories,
  SelectTextCategories,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

export type TextCategoryOption = Pick<
  SelectTextCategories,
  | "uuid"
  | "parentUuid"
  | "name"
  | "sequenceNumber"
  | "isActive"
  | "usageCategoriesJson"
>;

export type TextCategoryListItem = SelectTextCategories & {
  parentName: string | null;
};

export type TextCategoryInput = Omit<
  InsertTextCategories,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type TextCategoryActionResult = {
  error?: string;
  success?: boolean;
  textCategoryUuid?: string;
};

export const getTextCategoriesForSelect = async (): Promise<
  TextCategoryOption[]
> =>
  db
    .select({
      uuid: TextCategories.uuid,
      parentUuid: TextCategories.parentUuid,
      name: TextCategories.name,
      sequenceNumber: TextCategories.sequenceNumber,
      isActive: TextCategories.isActive,
      usageCategoriesJson: TextCategories.usageCategoriesJson,
    })
    .from(TextCategories)
    .orderBy(TextCategories.sequenceNumber, TextCategories.name);

export const getTextCategories = async (): Promise<TextCategoryListItem[]> => {
  const ParentCategory = alias(TextCategories, "parent_category");

  const rows = await db
    .select({
      category: TextCategories,
      parentName: ParentCategory.name,
    })
    .from(TextCategories)
    .leftJoin(
      ParentCategory,
      eq(ParentCategory.uuid, TextCategories.parentUuid),
    )
    .orderBy(desc(TextCategories.createdAt));

  return rows.map((row) => ({
    ...row.category,
    parentName: row.parentName ?? null,
  }));
};

export const createTextCategory = async (
  input: TextCategoryInput,
): Promise<TextCategoryActionResult> => {
  const uuid = generateUuid();

  try {
    await db.insert(TextCategories).values({ ...input, uuid });
    return { success: true, textCategoryUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create text category",
    };
  }
};
