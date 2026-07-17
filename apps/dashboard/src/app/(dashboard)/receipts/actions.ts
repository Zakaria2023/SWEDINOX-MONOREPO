"use server";

import { db } from "@/db";
import { PurchaseLineReceivals } from "@/db/schema/purchase-line-receivals";
import { Companies } from "@/db/schema/companies";
import { Products } from "@/db/schema/products";
import { eq, sql } from "drizzle-orm";

export type ReceiptRow = {
  companyCode: string | null;
  companyName: string | null;
  productCode: string | null;
  productName: string | null;
  purchaseOrderCode: string | null;
  receiptStatus: string | null;
  receiptDate: string | null;
  qty: number;
  kg: number;
  // Ordered but not yet received.
  materialStillToReceive: number;
};

// Goods received, rolled up per receipt date / supplier / product ("Ontvangsten
// per dag"). `materialStillToReceive` is planned minus received.
export const getReceipts = async (): Promise<ReceiptRow[]> => {
  try {
    const rows = await db
      .select({
        companyCode: Companies.searchCode1,
        companyName: Companies.companyName,
        productCode: Products.productCode,
        productName: Products.name,
        purchaseOrderCode: PurchaseLineReceivals.purchaseOrderCode,
        receiptStatus: PurchaseLineReceivals.receiptStatus,
        receiptDate: PurchaseLineReceivals.receiptDate,
        qty: sql<string>`COALESCE(SUM(${PurchaseLineReceivals.receivedQty}), 0)`,
        kg: sql<string>`COALESCE(SUM(${PurchaseLineReceivals.kgActual}), 0)`,
        planned: sql<string>`COALESCE(SUM(${PurchaseLineReceivals.qtyPlanned}), 0)`,
      })
      .from(PurchaseLineReceivals)
      .leftJoin(Companies, eq(PurchaseLineReceivals.companyUuid, Companies.uuid))
      .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .groupBy(
        PurchaseLineReceivals.receiptDate,
        PurchaseLineReceivals.purchaseOrderCode,
        PurchaseLineReceivals.receiptStatus,
        Companies.searchCode1,
        Companies.companyName,
        Products.productCode,
        Products.name,
      );

    return rows.map((row) => {
      const qty = Number(row.qty);
      return {
        companyCode: row.companyCode,
        companyName: row.companyName,
        productCode: row.productCode,
        productName: row.productName,
        purchaseOrderCode: row.purchaseOrderCode,
        receiptStatus: row.receiptStatus,
        receiptDate: row.receiptDate,
        qty,
        kg: Number(row.kg),
        materialStillToReceive: Math.max(0, Number(row.planned) - qty),
      };
    });
  } catch {
    throw new Error("Failed to fetch receipts");
  }
};
