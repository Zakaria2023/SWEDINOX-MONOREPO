"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  counterOrderDialogSchema,
  CounterOrderDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { db } from "@/db";
import {
  CounterOrders,
  SelectCounterOrders,
} from "@/db/schema/counter-orders";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { counterOrderValuesToColumns } from "./mappers";

export type SaveCounterOrderPayload = {
  companyUuid: string;
  counterOrderUuid: string | null;
  values: CounterOrderDialogValues;
};

export type DeleteCounterOrderPayload = {
  companyUuid: string;
  counterOrderUuid: string;
};

const revalidateCounterOrderPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/counter-orders`);
  revalidatePath(`/companies/${companyUuid}/edit`);
  revalidatePath(`/companies/${companyUuid}/edit/full`);
};

export const getCounterOrdersForCompany = async (
  companyUuid: string,
): Promise<SelectCounterOrders[]> =>
  await db
    .select()
    .from(CounterOrders)
    .where(eq(CounterOrders.companyUuid, companyUuid))
    .orderBy(asc(CounterOrders.id));

// Inserts a new counter order or updates an existing one by uuid. New rows get
// only the dialog values plus the generated uuid and owning company — every
// other column keeps its schema default, exactly like the legacy create flow.
// Updates write only the dialog-editable columns.
export const saveCounterOrder = async (
  _prevState: CompanyActionResult,
  payload: SaveCounterOrderPayload,
): Promise<CompanyActionResult> => {
  const parsed = counterOrderDialogSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      error: "Invalid counter order data — check the fields and try again",
    };
  }

  try {
    const columns = counterOrderValuesToColumns(parsed.data);

    if (payload.counterOrderUuid) {
      await db
        .update(CounterOrders)
        .set(columns)
        .where(
          and(
            eq(CounterOrders.uuid, payload.counterOrderUuid),
            eq(CounterOrders.companyUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(CounterOrders).values({
        ...columns,
        uuid: generateUuid(),
        companyUuid: payload.companyUuid,
      });
    }

    revalidateCounterOrderPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save counter order") };
  }
};

export const deleteCounterOrder = async (
  _prevState: CompanyActionResult,
  payload: DeleteCounterOrderPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(CounterOrders)
      .where(
        and(
          eq(CounterOrders.uuid, payload.counterOrderUuid),
          eq(CounterOrders.companyUuid, payload.companyUuid),
        ),
      );

    revalidateCounterOrderPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete counter order") };
  }
};
