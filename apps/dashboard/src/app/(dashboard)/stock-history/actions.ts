"use server";

import { db } from "@/db";
import { Stock } from "@/db/schema/stock";
import { Products } from "@/db/schema/products";
import { RevenueGroups } from "@/db/schema/revenue-groups";
import { eq, sql } from "drizzle-orm";

export type StockHistoryRow = {
  revenueGroupNumber: number | null;
  revenueGroupName: string | null;
  productCode: string | null;
  productName: string | null;
  length: string | null;
  stockKg: number;
  stockQty: number;
  stockEuro: number;
  pricePerUnit: number;
};

// Current stock valuation per product (with its revenue group). The ERP report
// takes a reference date; this shows current stock — a date parameter is a
// follow-up.
export const getStockHistory = async (): Promise<StockHistoryRow[]> => {
  try {
    const rows = await db
      .select({
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        productCode: Products.productCode,
        productName: Products.name,
        length: Products.length,
        stockKg: sql<string>`COALESCE(SUM(${Stock.quantityKg}), 0)`,
        stockQty: sql<string>`COALESCE(SUM(${Stock.quantity}), 0)`,
        stockEuro: sql<string>`COALESCE(SUM(${Stock.valuationEuro}), 0)`,
      })
      .from(Stock)
      .innerJoin(Products, eq(Stock.productUuid, Products.uuid))
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .groupBy(
        RevenueGroups.number,
        RevenueGroups.name,
        Products.uuid,
        Products.productCode,
        Products.name,
        Products.length,
      );

    return rows.map((row) => {
      const stockQty = Number(row.stockQty);
      const stockEuro = Number(row.stockEuro);
      return {
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        productCode: row.productCode,
        productName: row.productName,
        length: row.length,
        stockKg: Number(row.stockKg),
        stockQty,
        stockEuro,
        pricePerUnit: stockQty === 0 ? 0 : stockEuro / stockQty,
      };
    });
  } catch {
    throw new Error("Failed to fetch stock history");
  }
};
