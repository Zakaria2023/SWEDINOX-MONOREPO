"use server";

import { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  returnOrderDialogSchema,
  ReturnOrderDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { db } from "@/db";
import { ReturnOrders, SelectReturnOrders } from "@/db/schema/return-orders";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { returnOrderValuesToColumns } from "./mappers";

export type SaveReturnOrderPayload = {
  companyUuid: string;
  returnOrderUuid: string | null;
  values: ReturnOrderDialogValues;
};

export type DeleteReturnOrderPayload = {
  companyUuid: string;
  returnOrderUuid: string;
};

const revalidateReturnOrderPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/return-orders`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

export const getReturnOrdersForCompany = async (
  companyUuid: string,
): Promise<SelectReturnOrders[]> =>
  await db
    .select()
    .from(ReturnOrders)
    .where(eq(ReturnOrders.companyUuid, companyUuid))
    .orderBy(asc(ReturnOrders.id));

// Inserts a new return order or updates an existing one by uuid. New rows get
// only the dialog values plus the generated uuid and owning company — every
// other column keeps its schema default, exactly like the legacy create flow.
// Updates write only the dialog-editable columns.
export const saveReturnOrder = async (
  _prevState: CompanyActionResult,
  payload: SaveReturnOrderPayload,
): Promise<CompanyActionResult> => {
  const parsed = returnOrderDialogSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      error: "Invalid return order data — check the fields and try again",
    };
  }

  try {
    const columns = returnOrderValuesToColumns(parsed.data);

    if (payload.returnOrderUuid) {
      await db
        .update(ReturnOrders)
        .set(columns)
        .where(
          and(
            eq(ReturnOrders.uuid, payload.returnOrderUuid),
            eq(ReturnOrders.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(ReturnOrders).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
      });
    }

    revalidateReturnOrderPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save return order") };
  }
};

export const deleteReturnOrder = async (
  _prevState: CompanyActionResult,
  payload: DeleteReturnOrderPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(ReturnOrders)
      .where(
        and(
          eq(ReturnOrders.uuid, payload.returnOrderUuid),
          eq(ReturnOrders.companyUuid, payload.companyUuid),
        ),
      );

    revalidateReturnOrderPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete return order") };
  }
};
