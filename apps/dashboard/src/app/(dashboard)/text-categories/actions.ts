"use server";

import {
  db,
  TextCategories,
  InsertTextCategories,
  SelectTextCategories,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { ne } from "drizzle-orm";

export type TextCategoryOption = Pick<
  SelectTextCategories,
  | "uuid"
  | "parentUuid"
  | "name"
  | "sequenceNumber"
  | "isActive"
  | "usageCategoriesJson"
>;

export type TextCategoryInput = Omit<
  InsertTextCategories,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type TextCategoryActionResult = {
  error?: string;
  success?: boolean;
  textCategoryUuid?: string;
};

// `excludeUuid` is passed when editing a category: a category can't be offered
// as its own parent, which would detach the branch from the tree.
export const getTextCategoriesForSelect = async (
  excludeUuid?: string,
): Promise<TextCategoryOption[]> => {
  const base = db
    .select({
      uuid: TextCategories.uuid,
      parentUuid: TextCategories.parentUuid,
      name: TextCategories.name,
      sequenceNumber: TextCategories.sequenceNumber,
      isActive: TextCategories.isActive,
      usageCategoriesJson: TextCategories.usageCategoriesJson,
    })
    .from(TextCategories);

  return (
    excludeUuid ? base.where(ne(TextCategories.uuid, excludeUuid)) : base
  ).orderBy(TextCategories.sequenceNumber, TextCategories.name);
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
