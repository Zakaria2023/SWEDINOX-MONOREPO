"use server";

import {
  db,
  TextCategories,
  Texts,
  type InsertTexts,
  type SelectTexts,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export type TextInput = Omit<
  InsertTexts,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type TextActionResult = {
  error?: string;
  success?: boolean;
  textUuid?: string;
};

export type TextListItem = SelectTexts & {
  textCategoryName: string | null;
};

export const getTexts = async (): Promise<TextListItem[]> => {
  const rows = await db
    .select({
      text: Texts,
      textCategoryName: TextCategories.name,
    })
    .from(Texts)
    .leftJoin(TextCategories, eq(TextCategories.uuid, Texts.textCategoryUuid))
    .orderBy(desc(Texts.createdAt));

  return rows.map((row) => ({
    ...row.text,
    textCategoryName: row.textCategoryName ?? null,
  }));
};

export const createText = async (
  input: TextInput,
): Promise<TextActionResult> => {
  const uuid = generateUuid();

  try {
    await db.insert(Texts).values({ ...input, uuid });
    return { success: true, textUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create text",
    };
  }
};
