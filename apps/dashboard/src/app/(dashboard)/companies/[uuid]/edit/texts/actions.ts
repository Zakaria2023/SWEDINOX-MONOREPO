"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  textDialogSchema,
  TextDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { db } from "@/db";
import { TextCategories } from "@/db/schema/text-categories";
import { SelectTexts, Texts } from "@/db/schema/texts";
import { describeError, generateUuid } from "@/lib/helpers";
import { currentUser } from "@clerk/nextjs/server";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { textValuesToColumns } from "./mappers";

export type SaveTextPayload = {
  companyUuid: string;
  textUuid: string | null;
  values: TextDialogValues;
};

export type DeleteTextPayload = {
  companyUuid: string;
  textUuid: string;
};

const revalidateTextPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/texts`);
  revalidatePath(`/companies/${companyUuid}/edit`);
  revalidatePath(`/companies/${companyUuid}/edit/full`);
};

export const getTextsForCompany = async (
  companyUuid: string,
): Promise<SelectTexts[]> =>
  await db
    .select()
    .from(Texts)
    .where(eq(Texts.companyUuid, companyUuid))
    .orderBy(asc(Texts.id));

// Inserts a new text or updates an existing one by uuid. The title is
// resolved server-side from the selected category's name (falling back to an
// empty string), exactly like the legacy save handler. New texts record the
// current Clerk user as createdByUserId, matching createCompany/updateCompany;
// updates write only the dialog-editable columns.
export const saveCompanyText = async (
  _prevState: CompanyActionResult,
  payload: SaveTextPayload,
): Promise<CompanyActionResult> => {
  const parsed = textDialogSchema.safeParse(payload.values);
  if (!parsed.success) {
    return { error: "Invalid text data — check the fields and try again" };
  }

  try {
    const [category] = await db
      .select({ name: TextCategories.name })
      .from(TextCategories)
      .where(eq(TextCategories.uuid, parsed.data.textCategoryUuid))
      .limit(1);

    const columns = textValuesToColumns(parsed.data, category?.name ?? "");

    if (payload.textUuid) {
      await db
        .update(Texts)
        .set(columns)
        .where(
          and(
            eq(Texts.uuid, payload.textUuid),
            eq(Texts.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      const user = await currentUser();
      const userId = user?.id;

      if (!userId) {
        return { error: "User not authenticated" };
      }

      await db.insert(Texts).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
        createdByUserId: userId,
      });
    }

    revalidateTextPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save text") };
  }
};

export const deleteCompanyText = async (
  _prevState: CompanyActionResult,
  payload: DeleteTextPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(Texts)
      .where(
        and(
          eq(Texts.uuid, payload.textUuid),
          eq(Texts.companyUuid, payload.companyUuid),
        ),
      );

    revalidateTextPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete text") };
  }
};
