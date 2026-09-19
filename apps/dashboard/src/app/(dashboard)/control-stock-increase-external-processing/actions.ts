"use server";

import { AnyMySqlColumn } from "drizzle-orm/mysql-core";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { RevenueGroups, SelectRevenueGroups } from "@/db/schema/revenue-groups";
import {
  SelectStockMovements,
  StockMovements,
} from "@/db/schema/stock-movements";
import { describeError } from "@/lib/helpers";

// The ledger account every row of this control list is booked to. It is a
// constant, not a lookup: all 483 rows of the 18-9-2026 export carry `3100`
// in both the number and the name column, and the list is defined as "what
// landed on 3100". See `docs/reference-system/external-processing.md`.
const STOCK_INCREASE_GL_ACCOUNT = "3100";
const STOCK_INCREASE_GL_ACCOUNT_NAME =
  "Inventory increase due to external processing";

// Both legs of the trip to the processor. The list is a control on the pair:
// showing only the return would hide what went out, and the whole point is to
// compare them.
const EXTERNAL_PROCESSING_REASONS = [
  "external_processing_issue",
  "external_processing_return",
] as const;

export type StockIncreaseExtProcessingRow = {
  key: string;
  productCode: SelectProducts["productCode"] | null;
  description: SelectProducts["name"] | null;
  companyCode: SelectCompanies["id"] | null;
  companyName: SelectCompanies["companyName"] | null;
  financialYear: number | null;
  financialPeriod: number | null;
  glAccountNumber: string;
  glAccountName: string;
  mutationDateTime: SelectStockMovements["createdAt"];
  /**
   * All three signed the same way: negative when the metal left for the
   * processor, positive when it came back. The reference signs them by the
   * movement's direction, so a column summed over the list is the net effect on
   * stock rather than a turnover figure.
   */
  mutationValueEur: number | null;
  mutationQty: number;
  stockUnit: SelectProducts["stockUnit"] | null;
  mutationKg: number | null;
  revenueGroupNumber: SelectRevenueGroups["number"] | null;
  revenueGroupName: SelectRevenueGroups["name"] | null;
  purchaseOrderUuid: SelectPurchaseOrders["uuid"] | null;
  purchaseOrderId: SelectPurchaseOrders["id"] | null;
};

/**
 * Finance's control list on metal sent out to be worked on by somebody else.
 *
 * Rewritten 19-9-2026 against the 483-row export, which corrected three things
 * this query had wrong:
 *
 *  - **It read the wrong reason.** It filtered `production_output`, which is
 *    our own machines, and so reported internal production as external
 *    processing. The two external-processing reasons are what the list watches.
 *  - **It joined the wrong document.** It joined sales orders; every one of the
 *    483 rows names a PURCHASE order (`IO4…`). The processing is bought, so the
 *    purchase order is what carries it — and it is also what names the
 *    processor, which the screen previously could not show at all.
 *  - **It showed only the inbound half.** 167 of the 483 rows are the metal
 *    leaving. A control list that hides the outbound leg cannot be reconciled.
 *
 * The euro and kilo figures are read from the movement rather than recomputed:
 * see the note on `StockMovements.quantityKg`.
 */
export const getStockIncreaseExternalProcessing = async (): Promise<
  StockIncreaseExtProcessingRow[]
> => {
  try {
    // Signed by direction, so the three measures agree with each other and a
    // column total is the net movement.
    const signed = (column: AnyMySqlColumn) =>
      sql<string>`CASE WHEN ${StockMovements.type} = 'out'
                       THEN -${column} ELSE ${column} END`;

    const rows = await db
      .select({
        key: StockMovements.uuid,
        productCode: Products.productCode,
        description: Products.name,
        companyCode: Companies.id,
        companyName: Companies.companyName,
        financialYear: sql<number>`YEAR(${StockMovements.createdAt})`,
        financialPeriod: sql<number>`MONTH(${StockMovements.createdAt})`,
        mutationDateTime: StockMovements.createdAt,
        mutationValueEur: signed(StockMovements.valueEur),
        mutationQty: signed(StockMovements.quantity),
        stockUnit: Products.stockUnit,
        mutationKg: signed(StockMovements.quantityKg),
        revenueGroupNumber: RevenueGroups.number,
        revenueGroupName: RevenueGroups.name,
        purchaseOrderUuid: PurchaseOrders.uuid,
        purchaseOrderId: PurchaseOrders.id,
      })
      .from(StockMovements)
      .leftJoin(Products, eq(StockMovements.productUuid, Products.uuid))
      .leftJoin(
        RevenueGroups,
        eq(Products.revenueGroupUuid, RevenueGroups.uuid),
      )
      .leftJoin(
        PurchaseOrders,
        eq(StockMovements.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      // No cancelled filter: this table records a reversal as its own opposite
      // movement, so both the original and its undo belong on a control list.
      .where(inArray(StockMovements.reason, EXTERNAL_PROCESSING_REASONS))
      .orderBy(desc(StockMovements.createdAt));

    return rows.map((row) => ({
      ...row,
      financialYear:
        row.financialYear === null ? null : Number(row.financialYear),
      financialPeriod:
        row.financialPeriod === null ? null : Number(row.financialPeriod),
      glAccountNumber: STOCK_INCREASE_GL_ACCOUNT,
      glAccountName: STOCK_INCREASE_GL_ACCOUNT_NAME,
      mutationValueEur:
        row.mutationValueEur === null ? null : Number(row.mutationValueEur),
      mutationQty: Number(row.mutationQty ?? 0),
      mutationKg: row.mutationKg === null ? null : Number(row.mutationKg),
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
