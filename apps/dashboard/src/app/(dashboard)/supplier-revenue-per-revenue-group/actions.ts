"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { Products } from "@/db/schema/products";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { Stock } from "@/db/schema/stock";
import { eq, sql } from "drizzle-orm";

export type SupplierRevenuePerGroupRow = {
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  year: number | null;
  month: number | null;
  weightKg: number;
  revenue: number;
  avgPricePerKg: number;
};

// Purchase turnover per revenue group and invoice period — the supplier-side
// counterpart of the sales revenue-per-revenue-group report. Revenue is the
// purchased value (stock valuation × quantity); weight is quantity in kg.
export const getSupplierRevenuePerRevenueGroup = async (): Promise<
  SupplierRevenuePerGroupRow[]
> => {
  try {
    const year = sql<number>`YEAR(${PurchaseInvoices.invoiceDate})`;
    const month = sql<number>`MONTH(${PurchaseInvoices.invoiceDate})`;

    const rows = await db
      .select({
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        year,
        month,
        weightKg: sql<string>`COALESCE(SUM(${PurchaseInvoiceItems.quantity}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${Stock.valuationPrice} * ${PurchaseInvoiceItems.quantity}), 0)`,
      })
      .from(PurchaseInvoiceItems)
      .innerJoin(
        PurchaseInvoices,
        eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .innerJoin(Products, eq(PurchaseInvoiceItems.productUuid, Products.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .leftJoin(Stock, eq(PurchaseInvoiceItems.stockUuid, Stock.uuid))
      .groupBy(
        RevenueGroups.uuid,
        RevenueGroups.number,
        RevenueGroups.name,
        year,
        month,
      )
      .orderBy(RevenueGroups.number);

    return rows.map((row) => {
      const weightKg = Number(row.weightKg);
      const revenue = Number(row.revenue);
      return {
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        year: row.year != null ? Number(row.year) : null,
        month: row.month != null ? Number(row.month) : null,
        weightKg,
        revenue,
        avgPricePerKg: weightKg === 0 ? 0 : revenue / weightKg,
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch supplier revenue per revenue group"));
  }
};
