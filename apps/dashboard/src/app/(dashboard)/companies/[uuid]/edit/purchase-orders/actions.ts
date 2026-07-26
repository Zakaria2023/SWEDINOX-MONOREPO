"use server";

import { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import {
  purchaseOrderDialogSchema,
  PurchaseOrderDialogValues,
} from "@/app/(dashboard)/companies/validation";
import { db } from "@/db";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { describeError, generateUuid } from "@/lib/helpers";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { purchaseOrderValuesToColumns } from "./mappers";

export type SavePurchaseOrderPayload = {
  companyUuid: string;
  purchaseOrderUuid: string | null;
  values: PurchaseOrderDialogValues;
};

export type DeletePurchaseOrderPayload = {
  companyUuid: string;
  purchaseOrderUuid: string;
};

const revalidatePurchaseOrderPaths = (companyUuid: string) => {
  revalidatePath(`/companies/${companyUuid}/edit/purchase-orders`);
  revalidatePath(`/companies/${companyUuid}/edit`);
};

// The company is the supplier on its purchase orders, so the owner column is
// supplierUuid — not companyUuid like the other child collections.
export const getPurchaseOrdersForCompany = async (
  companyUuid: string,
): Promise<SelectPurchaseOrders[]> =>
  await db
    .select()
    .from(PurchaseOrders)
    .where(eq(PurchaseOrders.supplierUuid, companyUuid))
    .orderBy(asc(PurchaseOrders.id));

// Inserts a new purchase order or updates an existing one by uuid. Inserts set
// only uuid + supplierUuid on top of the dialog columns — the same server-side
// defaults the legacy create/update sync applied. Updates write only the
// dialog-editable columns.
export const saveCompanyPurchaseOrder = async (
  _prevState: CompanyActionResult,
  payload: SavePurchaseOrderPayload,
): Promise<CompanyActionResult> => {
  const parsed = purchaseOrderDialogSchema.safeParse(payload.values);
  if (!parsed.success) {
    return {
      error: "Invalid purchase order data — check the fields and try again",
    };
  }

  try {
    const columns = purchaseOrderValuesToColumns(parsed.data);

    if (payload.purchaseOrderUuid) {
      await db
        .update(PurchaseOrders)
        .set(columns)
        .where(
          and(
            eq(PurchaseOrders.uuid, payload.purchaseOrderUuid),
            eq(PurchaseOrders.supplierUuid, payload.companyUuid),
          ),
        );
    } else {
      await db.insert(PurchaseOrders).values({
        ...columns,
        uuid: generateUuid(),
        supplierUuid: payload.companyUuid,
      });
    }

    revalidatePurchaseOrderPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to save purchase order") };
  }
};

// Deletes directly, exactly like the legacy sync did — rows referenced by
// order items or receivals fail on the FK constraint and surface via
// describeError instead of a pre-check.
export const deleteCompanyPurchaseOrder = async (
  _prevState: CompanyActionResult,
  payload: DeletePurchaseOrderPayload,
): Promise<CompanyActionResult> => {
  try {
    await db
      .delete(PurchaseOrders)
      .where(
        and(
          eq(PurchaseOrders.uuid, payload.purchaseOrderUuid),
          eq(PurchaseOrders.supplierUuid, payload.companyUuid),
        ),
      );

    revalidatePurchaseOrderPaths(payload.companyUuid);
    return { success: true };
  } catch (error) {
    return { error: describeError(error, "Failed to delete purchase order") };
  }
};
