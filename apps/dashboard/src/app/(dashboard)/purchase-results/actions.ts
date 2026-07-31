"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { PurchaseLineReceivals } from "@/db/schema/purchase-line-receivals";
import { Products } from "@/db/schema/products";
import { ProductGroups } from "@/db/schema/product-groups";
import { lastPurchasePriceSql } from "@/lib/server/purchase-pricing";
import { eq, sql } from "drizzle-orm";

export type PurchaseResultRow = {
  mainGroup: string | null;
  productCode: string | null;
  productName: string | null;
  year: number | null;
  month: number | null;
  purchaseValue: number;
  replacementValue: number;
  differenceEuro: number;
  differencePercent: number;
};

// What was actually paid for received goods vs. what replacing them would cost
// today. Replacing them costs the last price a supplier invoiced the article at
// — the product carries no replacement price of its own.
export const getPurchaseResults = async (): Promise<PurchaseResultRow[]> => {
  try {
    const year = sql<number>`YEAR(${PurchaseLineReceivals.receiptDate})`;
    const month = sql<number>`MONTH(${PurchaseLineReceivals.receiptDate})`;

    const rows = await db
      .select({
        mainGroup: ProductGroups.name,
        productCode: Products.productCode,
        productName: Products.name,
        year,
        month,
        purchaseValue: sql<string>`COALESCE(SUM(${PurchaseLineReceivals.lineAmount}), 0)`,
        replacementValue: sql<string>`COALESCE(SUM(${lastPurchasePriceSql(Products.uuid)} * ${PurchaseLineReceivals.receivedQty}), 0)`,
      })
      .from(PurchaseLineReceivals)
      .innerJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .leftJoin(
        ProductGroups,
        eq(Products.productGroupUuid, ProductGroups.uuid),
      )
      .groupBy(
        ProductGroups.name,
        Products.uuid,
        Products.productCode,
        Products.name,
        year,
        month,
      );

    return rows.map((row) => {
      const purchaseValue = Number(row.purchaseValue);
      const replacementValue = Number(row.replacementValue);
      const differenceEuro = purchaseValue - replacementValue;
      return {
        mainGroup: row.mainGroup,
        productCode: row.productCode,
        productName: row.productName,
        year: row.year != null ? Number(row.year) : null,
        month: row.month != null ? Number(row.month) : null,
        purchaseValue,
        replacementValue,
        differenceEuro,
        differencePercent:
          replacementValue === 0
            ? 0
            : (differenceEuro / replacementValue) * 100,
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase results"));
  }
};
