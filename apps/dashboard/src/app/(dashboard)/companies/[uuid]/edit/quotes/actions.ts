"use server";

import { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  quoteDialogSchema,
  QuoteDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { db } from "@/db";
import { Quotes, SelectQuotes } from "@/db/schema/quotes";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { quoteValuesToColumns } from "./mappers";

export type SaveQuotePayload = {
  companyUuid: string;
  quoteUuid: string | null;
  values: QuoteDialogValues;
};

export type DeleteQuotePayload = {
  companyUuid: string;
  quoteUuid: string;
};

const revalidateQuotePaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/quotes`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getQuotesForCompany = async (
  companyUuid: string,
): Promise<SelectQuotes[]> =>
  await db
    .select()
    .from(Quotes)
    .where(eq(Quotes.companyUuid, companyUuid))
    .orderBy(asc(Quotes.id));

// Inserts a new quote or updates an existing one by uuid. New rows get only
// the dialog values plus the generated uuid and owning company — every other
// column keeps its schema default, exactly like the legacy create flow.
// Updates write only the dialog-editable columns.
export const saveQuote = async (
  _prevState: CompanyActionResult,
  payload: SaveQuotePayload,
): Promise<CompanyActionResult> => {
  const parsed = quoteDialogSchema.safeParse(payload.values);
  if (!parsed.success) {
    return { error: "Invalid quote data — check the fields and try again" };
  }

  try {
    const columns = quoteValuesToColumns(parsed.data);

    if (payload.quoteUuid) {
      await db
        .update(Quotes)
        .set(columns)
        .where(
          and(
            eq(Quotes.uuid, payload.quoteUuid),
            eq(Quotes.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(Quotes).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
      });
    }

    revalidateQuotePaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save quote") };
  }
};

export const deleteQuote = async (
  _prevState: CompanyActionResult,
  payload: DeleteQuotePayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(Quotes)
      .where(
        and(
          eq(Quotes.uuid, payload.quoteUuid),
          eq(Quotes.companyUuid, payload.companyUuid),
        ),
      );

    revalidateQuotePaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete quote") };
  }
};
