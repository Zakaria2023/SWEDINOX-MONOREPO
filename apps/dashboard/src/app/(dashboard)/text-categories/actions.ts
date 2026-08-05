"use server";

import {
  db,
  TextCategories,
  Texts,
  InsertTextCategories,
  SelectTextCategories,
  SelectTexts,
} from "@/db";
import { describeError, generateUuid } from "@/lib/helpers";
import { desc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

export type TextCategoryChildRow = Pick<
  SelectTextCategories,
  "uuid" | "name" | "sequenceNumber" | "isActive"
>;

export type TextCategoryTextRow = Pick<
  SelectTexts,
  "uuid" | "title" | "sequenceNumber" | "isActive"
>;

export type TextCategoryDetail = TextCategoryListItem & {
  children: TextCategoryChildRow[];
  texts: TextCategoryTextRow[];
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

/**
 * One text category with its parent, its sub-categories and the text blocks
 * filed under it — the whole of what the category is and what it holds.
 */
export const getTextCategoryDetail = async (
  uuid: string,
): Promise<TextCategoryDetail | null> => {
  const ParentCategory = alias(TextCategories, "parent_category");

  const [row] = await db
    .select({
      category: TextCategories,
      parentName: ParentCategory.name,
    })
    .from(TextCategories)
    .leftJoin(ParentCategory, eq(ParentCategory.uuid, TextCategories.parentUuid))
    .where(eq(TextCategories.uuid, uuid))
    .limit(1);

  if (!row) {
    return null;
  }

  const [children, texts] = await Promise.all([
    db
      .select({
        uuid: TextCategories.uuid,
        name: TextCategories.name,
        sequenceNumber: TextCategories.sequenceNumber,
        isActive: TextCategories.isActive,
      })
      .from(TextCategories)
      .where(eq(TextCategories.parentUuid, uuid))
      .orderBy(TextCategories.sequenceNumber, TextCategories.name),
    db
      .select({
        uuid: Texts.uuid,
        title: Texts.title,
        sequenceNumber: Texts.sequenceNumber,
        isActive: Texts.isActive,
      })
      .from(Texts)
      .where(eq(Texts.textCategoryUuid, uuid))
      .orderBy(Texts.sequenceNumber, Texts.title),
  ]);

  return {
    ...row.category,
    parentName: row.parentName ?? null,
    children,
    texts,
  };
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

export const getTextCategoryForEdit = async (
  uuid: string,
): Promise<SelectTextCategories | null> => {
  const [category] = await db
    .select()
    .from(TextCategories)
    .where(eq(TextCategories.uuid, uuid))
    .limit(1);

  return category ?? null;
};

export const updateTextCategory = async (
  uuid: string,
  input: TextCategoryInput,
): Promise<TextCategoryActionResult> => {
  // Parenting a category to itself would orphan the whole branch, so it is
  // rejected here as well as hidden from the dropdown.
  if (input.parentUuid === uuid) {
    return { error: "A category cannot be its own parent" };
  }

  try {
    await db
      .update(TextCategories)
      .set(input)
      .where(eq(TextCategories.uuid, uuid));
  } catch (error) {
    return { error: describeError(error, "Failed to update text category") };
  }

  revalidatePath("/text-categories");
  redirect("/text-categories");
};
