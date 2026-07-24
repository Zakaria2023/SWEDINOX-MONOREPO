"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { PurchaseOrders, SelectPurchaseOrders } from "@/db/schema/purchase-orders";
import { PurchaseQuotes } from "@/db/schema/purchase-quotes";
import { eq } from "drizzle-orm";

export type PurchaseOrderQuoteRow = {
  kind: "Order" | "Quote";
  id: number | null;
  createdAt: string | null;
  purchaser: string | null;
  status: SelectPurchaseOrders["status"] | null;
  reference: string | null;
  supplierName: SelectCompanies["companyName"] | null;
  weightKg: number;
  revenue: number;
};

// Purchase orders and purchase quotes in one list. Each side is queried
// separately (they carry their own header totals) and merged by creation date.
export const getPurchaseOrdersAndQuotes = async (): Promise<
  PurchaseOrderQuoteRow[]
> => {
  try {
    const orderRows = await db
      .select({
        id: PurchaseOrders.id,
        createdAt: PurchaseOrders.createdAt,
        purchaser: PurchaseOrders.purchaser,
        status: PurchaseOrders.status,
        reference: PurchaseOrders.ourReference,
        supplierName: Companies.companyName,
        weightKg: PurchaseOrders.weightKg,
        revenue: PurchaseOrders.amount,
      })
      .from(PurchaseOrders)
      .leftJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid));

    const quoteRows = await db
      .select({
        id: PurchaseQuotes.id,
        createdAt: PurchaseQuotes.createdAt,
        purchaser: PurchaseQuotes.purchaser,
        reference: PurchaseQuotes.ourReference,
        supplierName: Companies.companyName,
        weightKg: PurchaseQuotes.totalWeightKg,
        revenue: PurchaseQuotes.totalExclVat,
      })
      .from(PurchaseQuotes)
      .leftJoin(Companies, eq(PurchaseQuotes.companyUuid, Companies.uuid));

    const orders: PurchaseOrderQuoteRow[] = orderRows.map((row) => ({
      kind: "Order",
      id: row.id,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      purchaser: row.purchaser,
      status: row.status,
      reference: row.reference,
      supplierName: row.supplierName,
      weightKg: Number(row.weightKg ?? 0),
      revenue: Number(row.revenue ?? 0),
    }));

    const quotes: PurchaseOrderQuoteRow[] = quoteRows.map((row) => ({
      kind: "Quote",
      id: row.id,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      purchaser: row.purchaser,
      status: null,
      reference: row.reference,
      supplierName: row.supplierName,
      weightKg: Number(row.weightKg ?? 0),
      revenue: Number(row.revenue ?? 0),
    }));

    return [...orders, ...quotes].sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
    );
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase orders and quotes"));
  }
};
