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
import { and, desc, eq, sql } from "drizzle-orm";

export type StockIncreaseExtProcessingRow = {
  key: string;
  productCode: SelectProducts["productCode"] | null;
  description: SelectProducts["name"] | null;
  stockUnit: SelectProducts["stockUnit"] | null;
  mutationDateTime: SelectStockMovements["createdAt"];
  financialYear: number | null;
  financialPeriod: number | null;
  mutationQty: SelectStockMovements["quantity"];
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  orderId: SelectOrders["id"] | null;
};

// Control list of stock increases booked from processing output. External vs.
// internal processing isn't distinguished in the stock ledger, and stock
// movements carry no processor company or GL account, so the Company and GLA
// columns have no source yet — production-output "in" movements are the closest
// truthful source for a stock increase due to (external) processing.
export const getStockIncreaseExternalProcessing = async (): Promise<
  StockIncreaseExtProcessingRow[]
> => {
  try {
    const rows = await db
      .select({
        key: StockMovements.uuid,
        productCode: Products.productCode,
        description: Products.name,
        stockUnit: Products.stockUnit,
        mutationDateTime: StockMovements.createdAt,
        financialYear: sql<number>`YEAR(${StockMovements.createdAt})`,
        financialPeriod: sql<number>`MONTH(${StockMovements.createdAt})`,
        mutationQty: StockMovements.quantity,
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
      .where(
        and(
          eq(StockMovements.type, "in"),
          eq(StockMovements.reason, "production_output"),
        ),
      )
      .orderBy(desc(StockMovements.createdAt));

    return rows.map((row) => ({
      ...row,
      financialYear:
        row.financialYear === null ? null : Number(row.financialYear),
      financialPeriod:
        row.financialPeriod === null ? null : Number(row.financialPeriod),
    }));
  } catch (error) {
    throw new Error(
      describeError(
        error,
        "Failed to fetch stock increase due to external processing",
      ),
    );
  }
};
