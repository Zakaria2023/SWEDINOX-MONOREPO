"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { OrderItems } from "@/db/schema/order-items";
import { Products } from "@/db/schema/products";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { RevenueBudgets } from "@/db/schema/revenue-budgets";
import { Invoices } from "@/db/schema/invoices";
import { Stock } from "@/db/schema/stock";
import { eq, sql } from "drizzle-orm";

export type RevenueVsBudgetRow = {
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
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

type Bucket = {
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  weight: number;
  weightBudget: number;
  revenue: number;
  revenueBudget: number;
  profit: number;
  profitBudget: number;
};

// Actual invoiced sales vs the budget figures, per revenue group.
export const getRevenueVsBudget = async (): Promise<RevenueVsBudgetRow[]> => {
  try {
    const actuals = await db
      .select({
        revenueGroupUuid: RevenueGroups.uuid,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
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
      .groupBy(RevenueGroups.uuid, RevenueGroups.number, RevenueGroups.name);

    const budgets = await db
      .select({
        revenueGroupUuid: RevenueGroups.uuid,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        weightBudget: sql<string>`COALESCE(SUM(${RevenueBudgets.weightBudget}), 0)`,
        revenueBudget: sql<string>`COALESCE(SUM(${RevenueBudgets.revenueBudget}), 0)`,
        profitBudget: sql<string>`COALESCE(SUM(${RevenueBudgets.profitBudget}), 0)`,
      })
      .from(RevenueBudgets)
      .leftJoin(
        RevenueGroups,
        eq(RevenueBudgets.revenueGroupUuid, RevenueGroups.uuid),
      )
      .groupBy(RevenueGroups.uuid, RevenueGroups.number, RevenueGroups.name);

    const buckets = new Map<string, Bucket>();

    const ensure = (
      uuid: string | null,
      rgNumber: number | null,
      rgName: string | null,
    ): Bucket => {
      const key = uuid ?? "none";
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = {
          revenueGroupNumber: rgNumber,
          revenueGroupName: rgName,
          weight: 0,
          weightBudget: 0,
          revenue: 0,
          revenueBudget: 0,
          profit: 0,
          profitBudget: 0,
        };
        buckets.set(key, bucket);
      }
      return bucket;
    };

    for (const row of actuals) {
      const bucket = ensure(
        row.revenueGroupUuid,
        row.revenueGroupNumber,
        row.revenueGroupName,
      );
      bucket.weight += Number(row.weight);
      bucket.revenue += Number(row.revenue);
      bucket.profit += Number(row.revenue) - Number(row.cost);
    }

    for (const row of budgets) {
      const bucket = ensure(
        row.revenueGroupUuid,
        row.revenueGroupNumber,
        row.revenueGroupName,
      );
      bucket.weightBudget += Number(row.weightBudget);
      bucket.revenueBudget += Number(row.revenueBudget);
      bucket.profitBudget += Number(row.profitBudget);
    }

    return [...buckets.values()].map((bucket) => ({
      ...bucket,
      profitMargin: bucket.revenue === 0 ? 0 : (bucket.profit / bucket.revenue) * 100,
      profitMarginBudget:
        bucket.revenueBudget === 0
          ? 0
          : (bucket.profitBudget / bucket.revenueBudget) * 100,
      avgSalesPrice: bucket.weight === 0 ? 0 : bucket.revenue / bucket.weight,
      avgSalesPriceBudget:
        bucket.weightBudget === 0 ? 0 : bucket.revenueBudget / bucket.weightBudget,
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch revenue vs budget"));
  }
};
