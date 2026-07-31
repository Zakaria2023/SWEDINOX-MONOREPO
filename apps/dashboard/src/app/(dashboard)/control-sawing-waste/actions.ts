"use server";

import { db } from "@/db";
import {
  SelectStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import { Products, SelectProducts } from "@/db/schema/products";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { describeError } from "@/lib/helpers";
import { desc, eq, inArray } from "drizzle-orm";

export type SawingWasteRow = {
  key: string;
  productCode: SelectProducts["productCode"] | null;
  description: SelectProducts["name"] | null;
  stockUnit: SelectProducts["stockUnit"] | null;
  mutationDateTime: SelectStockMovements["createdAt"];
  financialYear: number | null;
  financialPeriod: number | null;
  mutationQty: SelectStockMovements["quantity"];
  mutationReason: SelectStockMovements["reason"];
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  orderId: SelectOrders["id"] | null;
};

// Control list of stock written off as sawing waste.
//
// Production now records what a run lost to kerf and trim under its own reason,
// so the real thing is reportable: `sawing_waste`, attributed to the lot it was
// cut from. Hand write-offs stay in the list — a bar ruined at the saw is waste
// however it was booked, and dropping them would make the list look better than
// the shop floor is.
//
// Processor company, workorder link, kg and GL account still have no source.
export const getSawingWaste = async (): Promise<SawingWasteRow[]> => {
  try {
    const rows = await db
      .select({
        key: StockMovements.uuid,
        productCode: Products.productCode,
        description: Products.name,
        stockUnit: Products.stockUnit,
        mutationDateTime: StockMovements.createdAt,
        mutationQty: StockMovements.quantity,
        mutationReason: StockMovements.reason,
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        orderId: Orders.id,
      })
      .from(StockMovements)
      .leftJoin(Products, eq(StockMovements.productUuid, Products.uuid))
      .leftJoin(
        RevenueGroups,
        eq(Products.revenueGroupUuid, RevenueGroups.uuid),
      )
      .leftJoin(Orders, eq(StockMovements.orderUuid, Orders.uuid))
      .where(inArray(StockMovements.reason, ["sawing_waste", "damaged"]))
      .orderBy(desc(StockMovements.createdAt));

    return rows.map((row) => ({
      ...row,
      financialYear: row.mutationDateTime
        ? new Date(row.mutationDateTime).getFullYear()
        : null,
      financialPeriod: row.mutationDateTime
        ? new Date(row.mutationDateTime).getMonth() + 1
        : null,
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch sawing waste"));
  }
};
