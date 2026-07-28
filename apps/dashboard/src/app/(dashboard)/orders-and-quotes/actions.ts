"use server";

import { db } from "@/db";
import { Companies } from "@/db/schema/companies";
import { OrderItems } from "@/db/schema/order-items";
import { Orders } from "@/db/schema/orders";
import { QuoteItems } from "@/db/schema/quote-items";
import { Quotes } from "@/db/schema/quotes";
import { describeError, profitMarginPercent, resolveOrderTypeLabel } from "@/lib/helpers";
import { desc, eq, sql } from "drizzle-orm";

// One row of the combined sales overview. Orders and quotes are different
// tables with different lifecycles, so they are queried separately and merged
// here rather than forced into a SQL UNION — a union would have to null-pad
// half its columns for whichever side it came from anyway.
export type OrderOrQuoteRow = {
  uuid: string;
  kind: "order" | "quote";
  documentNumber: number;
  href: string;
  createdAt: Date;
  deliveryDate: string | null;
  lineCount: number;
  status: string | null;
  orderType: string;
  customerName: string | null;
  reference: string | null;
  weightKg: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  seller: string | null;
  convertedFromTo: string | null;
  quoteDate: string | null;
  decisionDate: string | null;
  validUntil: string | null;
  expirationReason: string | null;
};

const asDateString = (value: Date | string | null): string | null => {
  if (!value) {
    return null;
  }
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
};

export const getOrdersAndQuotes = async (): Promise<OrderOrQuoteRow[]> => {
  try {
    const [orderRows, quoteRows] = await Promise.all([
      db
        .select({
          uuid: Orders.uuid,
          id: Orders.id,
          createdAt: Orders.createdAt,
          deliveryDate: Orders.deliveryDate,
          status: Orders.status,
          customerRef: Orders.customerRef,
          seller: Orders.seller,
          companyName: Companies.companyName,
          isPickup: Orders.isPickup,
          isIncidental: Orders.isIncidental,
          isConsignment: Orders.isConsignment,
          isInternalProduction: Orders.isInternalProduction,
          isCustomerMaterial: Orders.isCustomerMaterial,
          lineCount: sql<string>`COUNT(${OrderItems.uuid})`,
          weightKg: sql<string>`COALESCE(SUM(${OrderItems.kgPlanned}), 0)`,
          revenue: sql<string>`COALESCE(SUM(${OrderItems.amount}), 0)`,
        })
        .from(Orders)
        .leftJoin(Companies, eq(Orders.companyUuid, Companies.uuid))
        .leftJoin(OrderItems, eq(OrderItems.orderUuid, Orders.uuid))
        .groupBy(Orders.uuid)
        .orderBy(desc(Orders.createdAt)),

      db
        .select({
          uuid: Quotes.uuid,
          id: Quotes.id,
          createdAt: Quotes.createdAt,
          deliveryDate: Quotes.deliveryDate,
          customerRef: Quotes.customerRef,
          seller: Quotes.seller,
          quoteDate: Quotes.quoteDate,
          decisionDate: Quotes.decisionDate,
          validUntil: Quotes.validUntil,
          expired: Quotes.expired,
          companyName: Companies.companyName,
          isPickup: Quotes.isPickup,
          isIncidental: Quotes.isIncidental,
          isConsignment: Quotes.isConsignment,
          isInternalProduction: Quotes.isInternalProduction,
          isCustomerMaterial: Quotes.isCustomerMaterial,
          // The quote header already stores its rolled-up summary, so revenue
          // and profit come straight off it rather than being re-aggregated.
          revenue: Quotes.totalExclVat,
          materialsProfit: Quotes.materialsProfit,
          weightKg: Quotes.totalWeightKg,
          lineCount: sql<string>`COUNT(${QuoteItems.uuid})`,
          convertedCount: sql<string>`COUNT(${QuoteItems.convertedToOrderUuid})`,
        })
        .from(Quotes)
        .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
        .leftJoin(QuoteItems, eq(QuoteItems.quoteUuid, Quotes.uuid))
        .groupBy(Quotes.uuid)
        .orderBy(desc(Quotes.createdAt)),
    ]);

    const orders: OrderOrQuoteRow[] = orderRows.map((row) => {
      const revenue = Number(row.revenue);
      return {
        uuid: row.uuid,
        kind: "order",
        documentNumber: row.id,
        href: `/orders/${row.uuid}`,
        createdAt: row.createdAt,
        deliveryDate: asDateString(row.deliveryDate),
        lineCount: Number(row.lineCount),
        status: row.status,
        orderType: resolveOrderTypeLabel({
          isPickup: row.isPickup ?? false,
          isIncidental: row.isIncidental ?? false,
          isConsignment: row.isConsignment ?? false,
          isInternalProduction: row.isInternalProduction ?? false,
          isCustomerMaterial: row.isCustomerMaterial ?? false,
        }),
        customerName: row.companyName,
        reference: row.customerRef,
        weightKg: Number(row.weightKg),
        revenue,
        // An order's cost sits on its stock lots rather than its lines, so no
        // profit is claimed here: a zero would read as "made nothing", which is
        // a different and wrong statement.
        profit: 0,
        profitMargin: 0,
        seller: row.seller,
        convertedFromTo: null,
        quoteDate: null,
        decisionDate: null,
        validUntil: null,
        expirationReason: null,
      };
    });

    const quotes: OrderOrQuoteRow[] = quoteRows.map((row) => {
      const revenue = Number(row.revenue ?? 0);
      const profit = Number(row.materialsProfit ?? 0);
      const converted = Number(row.convertedCount);

      return {
        uuid: row.uuid,
        kind: "quote",
        documentNumber: row.id,
        href: `/quotes/${row.uuid}`,
        createdAt: row.createdAt,
        deliveryDate: asDateString(row.deliveryDate),
        lineCount: Number(row.lineCount),
        status: row.expired ? "expired" : "open",
        orderType: resolveOrderTypeLabel({
          isPickup: row.isPickup ?? false,
          isIncidental: row.isIncidental ?? false,
          isConsignment: row.isConsignment ?? false,
          isInternalProduction: row.isInternalProduction ?? false,
          isCustomerMaterial: row.isCustomerMaterial ?? false,
        }),
        customerName: row.companyName,
        reference: row.customerRef,
        weightKg: Number(row.weightKg ?? 0),
        revenue,
        profit,
        profitMargin: profitMarginPercent(revenue, profit),
        seller: row.seller,
        convertedFromTo:
          converted > 0 ? `Converted to order (${converted} lines)` : null,
        quoteDate: asDateString(row.quoteDate),
        decisionDate: asDateString(row.decisionDate),
        validUntil: asDateString(row.validUntil),
        expirationReason: row.expired ? "Expired" : null,
      };
    });

    return [...orders, ...quotes].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch orders and quotes"));
  }
};
