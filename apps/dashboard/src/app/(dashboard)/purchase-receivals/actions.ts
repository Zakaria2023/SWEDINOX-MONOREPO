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
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { desc, eq, getTableColumns, sql } from "drizzle-orm";

export type PurchaseReceivalItem = Omit<
  SelectPurchaseLineReceivals,
  "priceQuantity" | "lineAmount"
> & {
  supplierName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["searchCode1"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  /** The order this receival's line belongs to, for the header figures. */
  purchaseOrderDate: SelectPurchaseOrders["orderDate"] | null;
  /** The line's whole weight in the unit its price is struck in. */
  priceQuantity: number;
  /** Net price x weight, in the price's own unit. */
  lineAmount: number;
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

// Only four figures belong to a receival: the weight planned and the weight
// that arrived, the date it arrived, and its own status. Everything else on
// the row — quantities, amounts, options, the purchaser — belongs to the
// purchase line and merely repeats down its receivals, which is why they are
// read from the line here rather than from the copies held on the receival.
//
// Proved on a 151-row export: 151 receivals over 107 lines, and those four
// columns are the only ones that differ between the rows of one line.
//
// priceQuantity and lineAmount are recomputed from the line below, so the
// receival's own stored copies are dropped here rather than shadowed.
const {
  priceQuantity: _storedPriceQuantity,
  lineAmount: _storedLineAmount,
  ...receivalColumns
} = getTableColumns(PurchaseLineReceivals);

const lineLevelColumns = {
  lineNumber: sql<
    SelectPurchaseLineReceivals["lineNumber"]
  >`COALESCE(${PurchaseOrderItems.lineNumber}, ${PurchaseLineReceivals.lineNumber})`,
  unit: sql<
    SelectPurchaseLineReceivals["unit"]
  >`COALESCE(${PurchaseOrderItems.unit}, ${PurchaseLineReceivals.unit})`,
  qtyPlanned: sql<
    SelectPurchaseLineReceivals["qtyPlanned"]
  >`COALESCE(${PurchaseOrderItems.qtyPlanned}, ${PurchaseLineReceivals.qtyPlanned})`,
  qtyActual: sql<
    SelectPurchaseLineReceivals["qtyActual"]
  >`COALESCE(${PurchaseOrderItems.qtyReceived}, ${PurchaseLineReceivals.qtyActual})`,
  options: sql<
    SelectPurchaseLineReceivals["options"]
  >`COALESCE(${PurchaseOrderItems.options}, ${PurchaseLineReceivals.options})`,
  lengthMm: sql<
    SelectPurchaseLineReceivals["lengthMm"]
  >`COALESCE(${PurchaseOrderItems.lengthMm}, ${PurchaseLineReceivals.lengthMm})`,
  purchaser: sql<
    SelectPurchaseLineReceivals["purchaser"]
  >`COALESCE(${PurchaseOrderItems.purchaser}, ${PurchaseLineReceivals.purchaser})`,
  // The reference prints the actual arrival date once there is one and the
  // planned date until then — the two agree on 146 of 151 rows and the five
  // that differ are all rows where the goods turned up on a different day.
  receiptDate: sql<
    SelectPurchaseLineReceivals["receiptDate"]
  >`COALESCE(${PurchaseLineReceivals.deliveryDateActual}, ${PurchaseLineReceivals.deliveryDatePlanned}, ${PurchaseLineReceivals.receiptDate})`,
  // The line's weight expressed in the unit its price is struck in: a tonne
  // price divides by a thousand, a kilo price does not.
  priceQuantity: sql<number>`
    CASE WHEN UPPER(COALESCE(${PurchaseOrderItems.priceUnit}, 'TN')) = 'KG'
      THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
      ELSE COALESCE(${PurchaseOrderItems.kgPurchased}, 0) / 1000
    END`.mapWith(Number),
  lineAmount: sql<number>`
    COALESCE(${PurchaseOrderItems.netPrice}, 0) *
    CASE WHEN UPPER(COALESCE(${PurchaseOrderItems.priceUnit}, 'TN')) = 'KG'
      THEN COALESCE(${PurchaseOrderItems.kgPurchased}, 0)
      ELSE COALESCE(${PurchaseOrderItems.kgPurchased}, 0) / 1000
    END`.mapWith(Number),
};

export const getPurchaseReceivals = async (): Promise<
  PurchaseReceivalItem[]
> => {
  try {
    return await db
      .select({
        ...receivalColumns,
        ...lineLevelColumns,
        supplierName: Companies.companyName,
        supplierCode: Companies.searchCode1,
        productCode: Products.productCode,
        productName: Products.name,
        purchaseOrderDate: PurchaseOrders.orderDate,
      })
      .from(PurchaseLineReceivals)
      .leftJoin(
        PurchaseOrderItems,
        eq(
          PurchaseLineReceivals.purchaseOrderItemUuid,
          PurchaseOrderItems.uuid,
        ),
      )
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseLineReceivals.purchaseOrderUuid, PurchaseOrders.uuid),
      )
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
        ...receivalColumns,
        ...lineLevelColumns,
        supplierName: Companies.companyName,
        supplierCode: Companies.searchCode1,
        productCode: Products.productCode,
        productName: Products.name,
        purchaseOrderDate: PurchaseOrders.orderDate,
        purchaseOrderId: PurchaseOrders.id,
      })
      .from(PurchaseLineReceivals)
      .leftJoin(
        PurchaseOrderItems,
        eq(
          PurchaseLineReceivals.purchaseOrderItemUuid,
          PurchaseOrderItems.uuid,
        ),
      )
      .leftJoin(
        PurchaseOrders,
        eq(PurchaseLineReceivals.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(
        Companies,
        eq(PurchaseLineReceivals.companyUuid, Companies.uuid),
      )
      .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
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
