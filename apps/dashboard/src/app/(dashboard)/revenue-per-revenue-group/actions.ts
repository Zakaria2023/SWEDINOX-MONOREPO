"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { Products } from "@/db/schema/products";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { eq, sql } from "drizzle-orm";

export type RevenueGroupTotals = {
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  salesKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
};

// Revenue rolled up per revenue group from invoiced lines. Revenue, weight and
// cost all come from the invoice line's own snapshot, taken when the invoice
// was raised — reading them back off the order line would report whatever it
// says today rather than what was actually billed.
export const getRevenuePerRevenueGroup = async (): Promise<
  RevenueGroupTotals[]
> => {
  try {
    const rows = await db
      .select({
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        salesKg: sql<string>`COALESCE(SUM(${InvoiceItems.weightKg}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${InvoiceItems.amount}), 0)`,
        cost: sql<string>`COALESCE(SUM(${InvoiceItems.costAmount}), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .leftJoin(
        RevenueGroups,
        eq(Products.revenueGroupUuid, RevenueGroups.uuid),
      )
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
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch revenue per revenue group"),
    );
  }
};
