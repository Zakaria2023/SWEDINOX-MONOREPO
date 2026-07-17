"use server";

import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { OrderItems } from "@/db/schema/order-items";
import { Products } from "@/db/schema/products";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { Stock } from "@/db/schema/stock";
import { eq, sql } from "drizzle-orm";

export type RevenueGroupTotals = {
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  salesKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
};

// Revenue rolled up per revenue group from invoiced order lines. Cost comes
// from the stock lot's valuation price; profit/margin are derived.
export const getRevenuePerRevenueGroup = async (): Promise<
  RevenueGroupTotals[]
> => {
  try {
    const rows = await db
      .select({
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        salesKg: sql<string>`COALESCE(SUM(${OrderItems.kgPlanned}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${OrderItems.amount}), 0)`,
        cost: sql<string>`COALESCE(SUM(${Stock.valuationPrice} * ${OrderItems.quantity}), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .leftJoin(
        RevenueGroups,
        eq(Products.revenueGroupUuid, RevenueGroups.uuid),
      )
      .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
      .groupBy(RevenueGroups.uuid, RevenueGroups.number, RevenueGroups.name);

    return rows.map((row) => {
      const revenue = Number(row.revenue);
      const profit = revenue - Number(row.cost);
      return {
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        salesKg: Number(row.salesKg),
        revenue,
        profit,
        profitMargin: revenue === 0 ? 0 : (profit / revenue) * 100,
      };
    });
  } catch {
    throw new Error("Failed to fetch revenue per revenue group");
  }
};
