"use server";

import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
import { Invoices } from "@/db/schema/invoices";
import { OrderItems } from "@/db/schema/order-items";
import { Products } from "@/db/schema/products";
import { Stock } from "@/db/schema/stock";
import { eq, sql } from "drizzle-orm";

export type RevenuePerProductRow = {
  productCode: string | null;
  productName: string | null;
  year: number | null;
  month: number | null;
  weightKg: number;
  sales: number;
  revenue: number;
  profit: number;
  profitMargin: number;
};

// Invoiced sales rolled up per product and invoice period. Cost comes from the
// stock lot's valuation price; profit/margin are derived.
export const getRevenuePerProduct = async (): Promise<
  RevenuePerProductRow[]
> => {
  try {
    const year = sql<number>`YEAR(${Invoices.invoiceDate})`;
    const month = sql<number>`MONTH(${Invoices.invoiceDate})`;

    const rows = await db
      .select({
        productCode: Products.productCode,
        productName: Products.name,
        year,
        month,
        weightKg: sql<string>`COALESCE(SUM(${OrderItems.kgPlanned}), 0)`,
        sales: sql<string>`COALESCE(SUM(${InvoiceItems.quantity}), 0)`,
        revenue: sql<string>`COALESCE(SUM(${OrderItems.amount}), 0)`,
        cost: sql<string>`COALESCE(SUM(${Stock.valuationPrice} * ${InvoiceItems.quantity}), 0)`,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .leftJoin(Stock, eq(OrderItems.stockUuid, Stock.uuid))
      .groupBy(Products.uuid, Products.productCode, Products.name, year, month);

    return rows.map((row) => {
      const revenue = Number(row.revenue);
      const profit = revenue - Number(row.cost);
      return {
        productCode: row.productCode,
        productName: row.productName,
        year: row.year != null ? Number(row.year) : null,
        month: row.month != null ? Number(row.month) : null,
        weightKg: Number(row.weightKg),
        sales: Number(row.sales),
        revenue,
        profit,
        profitMargin: revenue === 0 ? 0 : (profit / revenue) * 100,
      };
    });
  } catch {
    throw new Error("Failed to fetch revenue per product");
  }
};
