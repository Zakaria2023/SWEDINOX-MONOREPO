"use server";

import { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db } from "@/db";
import {
  SelectTransporterCosts,
  TransporterCosts,
} from "@/db/schema/transporter-costs";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { transporterCostValuesToColumns } from "./mappers";
import {
  transporterCostRowSchema,
  TransporterCostRowValues,
} from "./validation";

export type SaveTransporterCostPayload = {
  companyUuid: string;
  transporterCostUuid: string | null;
  values: TransporterCostRowValues;
};

export type DeleteTransporterCostPayload = {
  companyUuid: string;
  transporterCostUuid: string;
};

const revalidateTransporterCostPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/transporter-costs`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getTransporterCostsForCompany = async (
  companyUuid: string,
): Promise<SelectTransporterCosts[]> =>
  await db
    .select()
    .from(TransporterCosts)
    .where(eq(TransporterCosts.companyUuid, companyUuid))
    .orderBy(asc(TransporterCosts.id));

// Inserts a new transporter cost row or updates an existing one by uuid.
// Updates write only the grid-editable columns.
export const saveTransporterCost = async (
  _prevState: CompanyActionResult,
  payload: SaveTransporterCostPayload,
): Promise<CompanyActionResult> => {
  const parsed = transporterCostRowSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      error: "Invalid transporter cost data — check the fields and try again",
    };
  }

  try {
    const columns = transporterCostValuesToColumns(parsed.data);

    if (payload.transporterCostUuid) {
      await db
        .update(TransporterCosts)
        .set(columns)
        .where(
          and(
            eq(TransporterCosts.uuid, payload.transporterCostUuid),
            eq(TransporterCosts.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(TransporterCosts).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
      });
    }

    revalidateTransporterCostPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save transporter cost") };
  }
};

export const deleteTransporterCost = async (
  _prevState: CompanyActionResult,
  payload: DeleteTransporterCostPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(TransporterCosts)
      .where(
        and(
          eq(TransporterCosts.uuid, payload.transporterCostUuid),
          eq(TransporterCosts.companyUuid, payload.companyUuid),
        ),
      );

    revalidateTransporterCostPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete transporter cost") };
  }
};
