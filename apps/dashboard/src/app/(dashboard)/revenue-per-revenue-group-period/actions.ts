"use server";

import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { Products } from "@/db/schema/products";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import {
  describeError,
  profitMarginPercent,
  resolveOrderTypeLabel,
} from "@/lib/helpers";
import { eq, sql } from "drizzle-orm";

// The period sibling of the monthly revenue-per-revenue-group report. Same
// figures, broken down by invoice period *and* order type, so a month that
// looks flat overall can still show that consignment collapsed while stock
// sales grew.
export type RevenueGroupPeriodTotals = {
  period: string;
  orderType: string;
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  salesKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
};

export const getRevenuePerRevenueGroupPeriod = async (): Promise<
  RevenueGroupPeriodTotals[]
> => {
  try {
    const rows = await db
      .select({
        period: sql<string>`DATE_FORMAT(${Invoices.invoiceDate}, '%Y-%m')`,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        isPickup: Orders.isPickup,
        isIncidental: Orders.isIncidental,
        isConsignment: Orders.isConsignment,
        isInternalProduction: Orders.isInternalProduction,
        isCustomerMaterial: Orders.isCustomerMaterial,
        // From the invoice line's snapshot, not the order line's live figures —
        // what a past period earned must not move when an order is re-priced.
        // The order is still joined, but only to classify the order type.
        salesKg: sql<string>`COALESCE(SUM(${InvoiceItems.weightKg}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${InvoiceItems.amount}), 0)`,
        cost: sql<string>`COALESCE(SUM(${InvoiceItems.costAmount}), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .groupBy(
        sql`DATE_FORMAT(${Invoices.invoiceDate}, '%Y-%m')`,
        RevenueGroups.uuid,
        RevenueGroups.number,
        RevenueGroups.name,
        Orders.isPickup,
        Orders.isIncidental,
        Orders.isConsignment,
        Orders.isInternalProduction,
        Orders.isCustomerMaterial,
      );

    return rows
      .map((row) => {
        const revenue = Number(row.revenue);
        const profit = revenue - Number(row.cost);
        return {
          period: row.period ?? "—",
          orderType: resolveOrderTypeLabel({
            isPickup: row.isPickup,
            isIncidental: row.isIncidental,
            isConsignment: row.isConsignment,
            isInternalProduction: row.isInternalProduction,
            isCustomerMaterial: row.isCustomerMaterial,
          }),
          revenueGroupNumber: row.revenueGroupNumber,
          revenueGroupName: row.revenueGroupName,
          salesKg: Number(row.salesKg),
          revenue,
          profit,
          profitMargin: profitMarginPercent(revenue, profit),
        };
      })
      .sort(
        (a, b) =>
          b.period.localeCompare(a.period) ||
          a.orderType.localeCompare(b.orderType) ||
          (a.revenueGroupNumber ?? 0) - (b.revenueGroupNumber ?? 0),
      );
  } catch (error) {
    throw new Error(
      describeError(
        error,
        "Failed to fetch revenue per revenue group per period",
      ),
    );
  }
};
