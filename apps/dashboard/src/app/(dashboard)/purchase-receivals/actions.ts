"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import { Batches, SelectBatches } from "@/db/schema/batches";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type PurchaseReceivalItem = SelectPurchaseLineReceivals & {
  supplierName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["searchCode1"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
};

export type PurchaseReceivalDetail = PurchaseReceivalItem & {
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
  /** The batch registered against this receipt, if one has been. */
  batch: PurchaseReceivalBatchRow | null;
};

export type PurchaseReceivalBatchRow = Pick<
  SelectBatches,
  "uuid" | "internalCharge" | "charge" | "receiptDate" | "stockUuid"
>;

export const getPurchaseReceivals = async (): Promise<
  PurchaseReceivalItem[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(PurchaseLineReceivals),
        supplierName: Companies.companyName,
        supplierCode: Companies.searchCode1,
        productCode: Products.productCode,
        productName: Products.name,
      })
      .from(PurchaseLineReceivals)
      .leftJoin(
        Companies,
        eq(PurchaseLineReceivals.companyUuid, Companies.uuid),
      )
      .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .orderBy(desc(PurchaseLineReceivals.receiptDate));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase receivals"));
  }
};

/**
 * One goods receipt with its supplier, product, purchase order and the batch
 * registered against it.
 *
 * A receipt that has not been turned into a batch yet has none — the batch is
 * registered by a separate step on /batches, so its absence is a normal state
 * rather than missing data.
 */
export const getPurchaseReceivalDetail = async (
  uuid: string,
): Promise<PurchaseReceivalDetail | null> => {
  try {
    const [receival] = await db
      .select({
        ...getTableColumns(PurchaseLineReceivals),
        supplierName: Companies.companyName,
        supplierCode: Companies.searchCode1,
        productCode: Products.productCode,
        productName: Products.name,
        purchaseOrderId: PurchaseOrders.id,
      })
      .from(PurchaseLineReceivals)
      .leftJoin(
        Companies,
        eq(PurchaseLineReceivals.companyUuid, Companies.uuid),
      )
      .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseLineReceivals.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .where(eq(PurchaseLineReceivals.uuid, uuid))
      .limit(1);

    if (!receival) {
      return null;
    }

    const [batch] = await db
      .select({
        uuid: Batches.uuid,
        internalCharge: Batches.internalCharge,
        charge: Batches.charge,
        receiptDate: Batches.receiptDate,
        stockUuid: Batches.stockUuid,
      })
      .from(Batches)
      .where(eq(Batches.purchaseLineReceivalUuid, uuid))
      .limit(1);

    return { ...receival, batch: batch ?? null };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase receival"));
  }
};
