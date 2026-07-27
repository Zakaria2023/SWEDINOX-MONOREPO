"use server";

import { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db } from "@/db";
import { Processings, SelectProcessings } from "@/db/schema/processings";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { processingValuesToColumns } from "./mappers";
import { processingRowSchema, ProcessingRowValues } from "./validation";

export type SaveProcessingPayload = {
  companyUuid: string;
  processingUuid: string | null;
  values: ProcessingRowValues;
};

export type DeleteProcessingPayload = {
  companyUuid: string;
  processingUuid: string;
};

const revalidateProcessingPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/processings`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getProcessingsForCompany = async (
  companyUuid: string,
): Promise<SelectProcessings[]> =>
  await db
    .select()
    .from(Processings)
    .where(eq(Processings.companyUuid, companyUuid))
    .orderBy(asc(Processings.id));

// Inserts a new processing row or updates an existing one by uuid. Updates
// write only the grid-editable columns.
export const saveProcessing = async (
  _prevState: CompanyActionResult,
  payload: SaveProcessingPayload,
): Promise<CompanyActionResult> => {
  const parsed = processingRowSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      error: "Invalid processing data — check the fields and try again",
    };
  }

  try {
    const columns = processingValuesToColumns(parsed.data);

    if (payload.processingUuid) {
      await db
        .update(Processings)
        .set(columns)
        .where(
          and(
            eq(Processings.uuid, payload.processingUuid),
            eq(Processings.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(Processings).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
      });
    }

    revalidateProcessingPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save processing") };
  }
};

export const deleteProcessing = async (
  _prevState: CompanyActionResult,
  payload: DeleteProcessingPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(Processings)
      .where(
        and(
          eq(Processings.uuid, payload.processingUuid),
          eq(Processings.companyUuid, payload.companyUuid),
        ),
      );

    revalidateProcessingPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete processing") };
  }
};
