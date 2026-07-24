"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Products } from "@/db/schema/products";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { Stock } from "@/db/schema/stock";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import { and, eq, sql } from "drizzle-orm";

export type PeriodFilter = { year?: number; month?: number };

export type PurchasesAndSalesRow = {
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  year: number | null;
  month: number | null;
  purchaseKg: number;
  purchaseRevenue: number;
  weight: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  avgSalesPricePerKg: number;
};

type Bucket = PurchasesAndSalesRow;

const keyOf = (
  rgNumber: number | null,
  rgName: string | null,
  year: number | null,
  month: number | null,
) => `${rgNumber ?? ""}|${rgName ?? ""}|${year ?? ""}|${month ?? ""}`;

// Combines the sales side (invoiced revenue/weight/profit) and the purchase
// side (purchased kg/cost) per revenue group and period.
export const getPurchasesAndSalesPerRevenueGroup = async (
  filter: PeriodFilter = {},
): Promise<PurchasesAndSalesRow[]> => {
  try {
    const salesYear = sql<number>`YEAR(${Invoices.invoiceDate})`;
    const salesMonth = sql<number>`MONTH(${Invoices.invoiceDate})`;

    const salesRows = await db
      .select({
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        year: salesYear,
        month: salesMonth,
        weight: sql<string>`COALESCE(SUM(${OrderItems.kgPlanned}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${OrderItems.amount}), 0)`,
        cost: sql<string>`COALESCE(SUM(${Stock.valuationPrice} * ${InvoiceItems.quantity}), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
      .where(
        and(
          filter.year ? eq(salesYear, filter.year) : undefined,
          filter.month ? eq(salesMonth, filter.month) : undefined,
        ),
      )
      .groupBy(RevenueGroups.uuid, RevenueGroups.number, RevenueGroups.name, salesYear, salesMonth);

    const purchaseYear = sql<number>`YEAR(${PurchaseInvoices.invoiceDate})`;
    const purchaseMonth = sql<number>`MONTH(${PurchaseInvoices.invoiceDate})`;

    const purchaseRows = await db
      .select({
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        year: purchaseYear,
        month: purchaseMonth,
        purchaseKg: sql<string>`COALESCE(SUM(${PurchaseInvoiceItems.quantity}), 0)`,
        purchaseRevenue: sql<string>`COALESCE(SUM(${Stock.valuationPrice} * ${PurchaseInvoiceItems.quantity}), 0)`,
      })
      .from(PurchaseInvoiceItems)
      .innerJoin(
        PurchaseInvoices,
        eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      .innerJoin(Products, eq(PurchaseInvoiceItems.productUuid, Products.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .leftJoin(Stock, eq(PurchaseInvoiceItems.stockUuid, Stock.uuid))
      .where(
        and(
          filter.year ? eq(purchaseYear, filter.year) : undefined,
          filter.month ? eq(purchaseMonth, filter.month) : undefined,
        ),
      )
      .groupBy(RevenueGroups.uuid, RevenueGroups.number, RevenueGroups.name, purchaseYear, purchaseMonth);

    const buckets = new Map<string, Bucket>();

    const ensure = (
      rgNumber: number | null,
      rgName: string | null,
      year: number | null,
      month: number | null,
    ): Bucket => {
      const key = keyOf(rgNumber, rgName, year, month);
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          revenueGroupNumber: rgNumber,
          revenueGroupName: rgName,
          year,
          month,
          purchaseKg: 0,
          purchaseRevenue: 0,
          weight: 0,
          revenue: 0,
          profit: 0,
          profitMargin: 0,
          avgSalesPricePerKg: 0,
        };
        buckets.set(key, bucket);
      }
      return bucket;
    };

    for (const row of salesRows) {
      const year = row.year != null ? Number(row.year) : null;
      const month = row.month != null ? Number(row.month) : null;
      const bucket = ensure(row.revenueGroupNumber, row.revenueGroupName, year, month);
      bucket.weight += Number(row.weight);
      bucket.revenue += Number(row.revenue);
      bucket.profit += Number(row.revenue) - Number(row.cost);
    }

    for (const row of purchaseRows) {
      const year = row.year != null ? Number(row.year) : null;
      const month = row.month != null ? Number(row.month) : null;
      const bucket = ensure(row.revenueGroupNumber, row.revenueGroupName, year, month);
      bucket.purchaseKg += Number(row.purchaseKg);
      bucket.purchaseRevenue += Number(row.purchaseRevenue);
    }

    return [...buckets.values()].map((bucket) => ({
      ...bucket,
      profitMargin: bucket.revenue === 0 ? 0 : (bucket.profit / bucket.revenue) * 100,
      avgSalesPricePerKg: bucket.weight === 0 ? 0 : bucket.revenue / bucket.weight,
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchases and sales per revenue group"));
  }
};
