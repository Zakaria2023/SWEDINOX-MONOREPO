"use server";

import { db } from "@/db";
import {
  PickStatistics,
  SelectPickStatistics,
} from "@/db/schema/pick-statistics";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type PickStatisticListItem = SelectPickStatistics & {
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  stockProduct: SelectProducts["stockProduct"] | null;
  avgQtyPerPick: number; // quantityPicked / picks — computed
  avgKgPerPick: number; // kgPicked / picks — computed
};

export const getPickStatistics = async (): Promise<PickStatisticListItem[]> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(PickStatistics),
        productCode: Products.productCode,
        productName: Products.name,
        stockProduct: Products.stockProduct,
      })
      .from(PickStatistics)
      .leftJoin(Products, eq(PickStatistics.productUuid, Products.uuid))
      .orderBy(
        desc(PickStatistics.year),
        desc(PickStatistics.month),
        Products.productCode,
      );

    return rows.map((row) => ({
      ...row,
      avgQtyPerPick: row.picks > 0 ? Number(row.quantityPicked) / row.picks : 0,
      avgKgPerPick: row.picks > 0 ? Number(row.kgPicked) / row.picks : 0,
    }));
  } catch {
    throw new Error("Failed to fetch pick statistics");
  }
};
