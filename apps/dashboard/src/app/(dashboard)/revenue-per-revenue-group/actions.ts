"use server";

import { describeError, revenueGroupKindFromName } from "@/lib/helpers";
import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { Products } from "@/db/schema/products";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { RevenueGroupKind } from "@/lib/enums";
import { eq, sql } from "drizzle-orm";

export type RevenueGroupTotals = {
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  // What the group is — traded material, processing, a freight recharge, an
  // allowance or an adjustment. A margin only means something on the material
  // rows, so the report has to say which those are.
  kind: RevenueGroupKind;
  countsTowardMaterialMargin: boolean;
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
      const kind = revenueGroupKindFromName(row.revenueGroupName);
      return {
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        kind,
        countsTowardMaterialMargin: kind === "material",
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
