"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import { Products, SelectProducts } from "@/db/schema/products";
import { ProductGroups, SelectProductGroups } from "@/db/schema/product-groups";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";

export type PurchaseResultRow = {
  /** The receipt this row is: one row per receival, so it has an identity. */
  uuid: SelectPurchaseLineReceivals["uuid"];
  /** The root of the product hierarchy. */
  mainGroup: SelectProductGroups["name"] | null;
  /** The level directly above the product. */
  subgroup: SelectProductGroups["name"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  receiptDate: SelectPurchaseLineReceivals["receiptDate"];
  /** Derived from the receipt date, not stored — the reference groups by them. */
  year: number | null;
  month: number | null;
  /** What this receipt cost: its share of the line at the line's own price. */
  purchaseValue: number;
};

/**
 * What each goods receipt cost, one row per receipt.
 *
 * **Not aggregated.** The reference's own 1,800-row export covers only 466
 * (subgroup, receipt date) pairs — `Cold-rolled plate 304` on 2025-03-10 alone
 * produces 29 rows carrying 29 different values. A line received in two goes
 * appears twice, and each row is that instalment's own cost.
 *
 * `Year` and `Month` are derived from the receipt date rather than stored:
 * they agree with it on all 1,800 rows, and exist only so the grid can be
 * grouped by them.
 *
 * ## The three columns that are not here
 *
 * `Replacement value` is **zero on every one of the 1,800 rows**, which makes
 * `Purchase -/- replacement value (€)` and `(%)` dead with it — the percentage
 * cannot even be reconstructed, because there is nothing to divide by. Either
 * the business does not maintain replacement prices or this screen never
 * receives them. Building three columns that can only ever show zero would be
 * copying a fault rather than a feature, so they are left out until somebody
 * says they are wanted.
 */
export const getPurchaseResults = async (): Promise<PurchaseResultRow[]> => {
  try {
    // The hierarchy is one self-referencing tree and the screen shows two of
    // its levels: the root, and the one directly above the product. Level two
    // is skipped, exactly as it is on Sold products.
    const Parent = alias(ProductGroups, "group_parent");
    const Grandparent = alias(ProductGroups, "group_grandparent");
    const Root = alias(ProductGroups, "group_root");

    const receiptDate = sql<
      SelectPurchaseLineReceivals["receiptDate"]
    >`COALESCE(${PurchaseLineReceivals.deliveryDateActual}, ${PurchaseLineReceivals.deliveryDatePlanned}, ${PurchaseLineReceivals.receiptDate})`;

    const rows = await db
      .select({
        uuid: PurchaseLineReceivals.uuid,
        mainGroup: sql<
          SelectProductGroups["name"] | null
        >`COALESCE(${Root.name}, ${Grandparent.name}, ${Parent.name}, ${ProductGroups.name})`,
        subgroup: ProductGroups.name,
        productCode: Products.productCode,
        productName: Products.name,
        receiptDate,
        year: sql<number | null>`YEAR(${receiptDate})`.mapWith(Number),
        month: sql<number | null>`MONTH(${receiptDate})`.mapWith(Number),
        // This instalment's share of the line, at the line's own price. The
        // line's weight buys the whole line; this receipt only brought part of
        // it, so it only cost that part.
        purchaseValue: sql<number>`
          COALESCE(${PurchaseOrderItems.netPrice}, 0) *
          CASE WHEN UPPER(COALESCE(${PurchaseOrderItems.priceUnit}, 'TN')) = 'KG'
            THEN COALESCE(${PurchaseLineReceivals.kgPlanned}, 0)
            ELSE COALESCE(${PurchaseLineReceivals.kgPlanned}, 0) / 1000
          END`.mapWith(Number),
      })
      .from(PurchaseLineReceivals)
      .innerJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrderItems,
        eq(
          PurchaseLineReceivals.purchaseOrderItemUuid,
          PurchaseOrderItems.uuid,
        ),
      )
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .leftJoin(Parent, eq(ProductGroups.parentUuid, Parent.uuid))
      .leftJoin(Grandparent, eq(Parent.parentUuid, Grandparent.uuid))
      .leftJoin(Root, eq(Grandparent.parentUuid, Root.uuid))
      .orderBy(desc(receiptDate), Products.productCode);

    return rows;
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase results"));
  }
};
