"use server";

import { db } from "@/db";
import { Products, SelectProducts } from "@/db/schema/products";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { Stock } from "@/db/schema/stock";
import { describeError } from "@/lib/helpers";
import { asc, eq, gt, sql } from "drizzle-orm";

export type StockRevaluationFspRow = {
  key: string;
  productCode: SelectProducts["productCode"];
  description: SelectProducts["name"];
  startingDate: SelectProducts["priceDate"];
  financialYear: number | null;
  financialPeriod: number | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  priceUnit: SelectProducts["priceUnit"];
  technicalStock: number;
  technicalStockValue: number;
  stockUnit: SelectProducts["stockUnit"];
  fsp: SelectProducts["fixedSalesPrice"];
};

// Control list for stock revaluation driven by fixed-sales-price (FSP) changes.
// The revaluation amount and preceding FSP need an FSP change history, which
// isn't stored, so those (and the GL account) columns have no source yet — this
// lists products currently carrying an FSP with their on-hand technical stock
// valued at that FSP.
export const getStockRevaluationFsp = async (): Promise<
  StockRevaluationFspRow[]
> => {
  try {
    const productRows = await db
      .select({
        key: Products.uuid,
        productCode: Products.productCode,
        description: Products.name,
        startingDate: Products.priceDate,
        priceUnit: Products.priceUnit,
        stockUnit: Products.stockUnit,
        fsp: Products.fixedSalesPrice,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
      })
      .from(Products)
      .leftJoin(RevenueGroups, eq(Products.revenueGroupUuid, RevenueGroups.uuid))
      .where(gt(Products.fixedSalesPrice, "0"))
      .orderBy(asc(Products.productCode));

    const stockRows = await db
      .select({
        productUuid: Stock.productUuid,
        total: sql<string>`COALESCE(SUM(${Stock.quantity}), 0)`,
      })
      .from(Stock)
      .groupBy(Stock.productUuid);

    const stockByProduct = new Map(
      stockRows.map((row) => [row.productUuid, Number(row.total)]),
    );

    return productRows.map((row) => {
      const technicalStock = stockByProduct.get(row.key) ?? 0;
      const fsp = Number(row.fsp ?? 0);
      return {
        key: row.key,
        productCode: row.productCode,
        description: row.description,
        startingDate: row.startingDate,
        financialYear: row.startingDate
          ? Number(row.startingDate.slice(0, 4))
          : null,
        financialPeriod: row.startingDate
          ? Number(row.startingDate.slice(5, 7))
          : null,
        revenueGroupNumber: row.revenueGroupNumber,
        revenueGroupName: row.revenueGroupName,
        priceUnit: row.priceUnit,
        technicalStock,
        technicalStockValue: technicalStock * fsp,
        stockUnit: row.stockUnit,
        fsp: row.fsp,
      };
    });
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch stock revaluation (FSP changes)"),
    );
  }
};
