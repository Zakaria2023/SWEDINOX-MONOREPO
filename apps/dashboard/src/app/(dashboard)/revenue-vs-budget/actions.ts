"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Products } from "@/db/schema/products";
import {
  RevenueGroups,
  SelectRevenueGroups,
} from "@/db/schema/revenue-groups";
import { RevenueBudgets } from "@/db/schema/revenue-budgets";
import { Invoices } from "@/db/schema/invoices";
import { RevenueVsBudgetView } from "@/lib/enums";
import { and, eq, sql } from "drizzle-orm";

export type RevenueVsBudgetFilter = {
  year: number;
  /** 1–12, or null for the whole year. */
  month: number | null;
  view: RevenueVsBudgetView;
};

export type RevenueVsBudgetRow = {
  key: string;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  /** Set on the month view only. */
  month: number | null;
  weight: number;
  weightBudget: number;
  revenue: number;
  revenueBudget: number;
  profit: number;
  profitBudget: number;
  profitMargin: number;
  profitMarginBudget: number;
  avgSalesPrice: number;
  avgSalesPriceBudget: number;
};

type Bucket = Omit<
  RevenueVsBudgetRow,
  "profitMargin" | "profitMarginBudget" | "avgSalesPrice" | "avgSalesPriceBudget"
>;

/**
 * Invoiced sales against the budget for a year, or one month of it.
 *
 * The budget is held per revenue group per month, split by order type, with
 * profit as a percentage per type (see `RevenueBudgets`). Its profit amount is
 * therefore revenue × percentage for each type, summed — not a percentage of
 * the total, which would weigh a low-margin cross-dock euro like a stock one.
 *
 * Two views, as in the reference: per revenue group, or per month with the
 * group columns dropped.
 */
export const getRevenueVsBudget = async ({
  year,
  month,
  view,
}: RevenueVsBudgetFilter): Promise<RevenueVsBudgetRow[]> => {
  try {
    const invoiceMonth = sql<number>`MONTH(${Invoices.invoiceDate})`;
    const byMonth = view === "month";

    const actuals = await db
      .select({
        revenueGroupUuid: RevenueGroups.uuid,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        month: byMonth ? invoiceMonth : sql<number | null>`NULL`,
        // The invoice line's own snapshot — see revenue-per-revenue-group.
        weight: sql<string>`COALESCE(SUM(${InvoiceItems.weightKg}), 0)`,
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
      .where(
        and(
          eq(Invoices.cancelled, false),
          sql`YEAR(${Invoices.invoiceDate}) = ${year}`,
          month === null ? undefined : sql`${invoiceMonth} = ${month}`,
        ),
      )
      .groupBy(
        ...(byMonth
          ? [invoiceMonth]
          : [RevenueGroups.uuid, RevenueGroups.number, RevenueGroups.name]),
      );

    const budgets = await db
      .select({
        revenueGroupUuid: RevenueGroups.uuid,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        month: byMonth ? RevenueBudgets.month : sql<number | null>`NULL`,
        weightBudget: sql<string>`COALESCE(SUM(${RevenueBudgets.weightStock} + ${RevenueBudgets.weightCrossDock} + ${RevenueBudgets.weightFactory}), 0)`,
        revenueBudget: sql<string>`COALESCE(SUM(${RevenueBudgets.revenueStock} + ${RevenueBudgets.revenueCrossDock} + ${RevenueBudgets.revenueFactory}), 0)`,
        profitBudget: sql<string>`COALESCE(SUM(
          ${RevenueBudgets.revenueStock} * ${RevenueBudgets.profitPercentageStock} / 100 +
          ${RevenueBudgets.revenueCrossDock} * ${RevenueBudgets.profitPercentageCrossDock} / 100 +
          ${RevenueBudgets.revenueFactory} * ${RevenueBudgets.profitPercentageFactory} / 100
        ), 0)`,
      })
      .from(RevenueBudgets)
      .leftJoin(
        RevenueGroups,
        eq(RevenueBudgets.revenueGroupUuid, RevenueGroups.uuid),
      )
      .where(
        and(
          eq(RevenueBudgets.year, year),
          month === null ? undefined : eq(RevenueBudgets.month, month),
        ),
      )
      .groupBy(
        ...(byMonth
          ? [RevenueBudgets.month]
          : [RevenueGroups.uuid, RevenueGroups.number, RevenueGroups.name]),
      );

    const buckets = new Map<string, Bucket>();

    const ensure = (row: {
      revenueGroupUuid: string | null;
      revenueGroupNumber: SelectRevenueGroups["number"] | null;
      revenueGroupName: SelectRevenueGroups["name"] | null;
      month: number | null;
    }): Bucket => {
      const monthNumber = row.month === null ? null : Number(row.month);
      const key = byMonth
        ? `month-${monthNumber ?? "none"}`
        : `group-${row.revenueGroupUuid ?? "none"}`;
      const existing = buckets.get(key);
      if (existing) {
        return existing;
      }
      const bucket: Bucket = {
        key,
        revenueGroupNumber: byMonth ? null : row.revenueGroupNumber,
        revenueGroupName: byMonth ? null : row.revenueGroupName,
        month: byMonth ? monthNumber : null,
        weight: 0,
        weightBudget: 0,
        revenue: 0,
        revenueBudget: 0,
        profit: 0,
        profitBudget: 0,
      };
      buckets.set(key, bucket);
      return bucket;
    };

    for (const row of actuals) {
      const bucket = ensure(row);
      bucket.weight += Number(row.weight);
      bucket.revenue += Number(row.revenue);
      bucket.profit += Number(row.revenue) - Number(row.cost);
    }

    for (const row of budgets) {
      const bucket = ensure(row);
      bucket.weightBudget += Number(row.weightBudget);
      bucket.revenueBudget += Number(row.revenueBudget);
      bucket.profitBudget += Number(row.profitBudget);
    }

    return [...buckets.values()]
      .sort((a, b) =>
        byMonth
          ? (a.month ?? 0) - (b.month ?? 0)
          : (a.revenueGroupNumber ?? Number.MAX_SAFE_INTEGER) -
            (b.revenueGroupNumber ?? Number.MAX_SAFE_INTEGER),
      )
      .map((bucket) => ({
        ...bucket,
        profitMargin:
          bucket.revenue === 0 ? 0 : (bucket.profit / bucket.revenue) * 100,
        profitMarginBudget:
          bucket.revenueBudget === 0
            ? 0
            : (bucket.profitBudget / bucket.revenueBudget) * 100,
        avgSalesPrice: bucket.weight === 0 ? 0 : bucket.revenue / bucket.weight,
        avgSalesPriceBudget:
          bucket.weightBudget === 0
            ? 0
            : bucket.revenueBudget / bucket.weightBudget,
      }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch revenue vs budget"));
  }
};
