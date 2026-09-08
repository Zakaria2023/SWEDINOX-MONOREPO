"use server";

import { describeError, materialStillToInvoice } from "@/lib/helpers";
import { db } from "@/db";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { desc, eq } from "drizzle-orm";

export type ReceiptRow = {
  uuid: SelectPurchaseLineReceivals["uuid"];
  companyCode: SelectCompanies["searchCode1"] | null;
  companyName: SelectCompanies["companyName"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  purchaseOrderCode: SelectPurchaseLineReceivals["purchaseOrderCode"];
  lineNumber: SelectPurchaseLineReceivals["lineNumber"];
  receiptStatus: SelectPurchaseLineReceivals["receiptStatus"];
  receiptDate: SelectPurchaseLineReceivals["receiptDate"];
  unit: SelectPurchaseLineReceivals["unit"];
  qty: number;
  kg: number;
  /**
   * Value of goods that are here but that nobody has billed us for yet — the
   * reference's "Material still to be invoiced", and the accrual behind
   * Finance's "Purchase invoices to be received".
   */
  materialStillToInvoice: number;
};

/**
 * Goods received, one row per reception.
 *
 * The grain matters and the reference settles it: its own export shows purchase
 * order 400908 line 30 four separate times with four different weights, so a
 * receipt is not rolled up per day, per line or per order — it is one lorry's
 * worth of one line, and the same 151-row export of the Purchase receivals
 * screen shows the very same rows. The two screens are one table seen twice.
 *
 * The price the accrual is struck at comes from the purchase order line rather
 * than from any copy kept here, so a re-priced line cannot leave a receipt
 * quietly valuing itself at yesterday's figure.
 */
export const getReceipts = async (): Promise<ReceiptRow[]> => {
  try {
    const rows = await db
      .select({
        uuid: PurchaseLineReceivals.uuid,
        companyCode: Companies.searchCode1,
        companyName: Companies.companyName,
        productCode: Products.productCode,
        productName: Products.name,
        purchaseOrderCode: PurchaseLineReceivals.purchaseOrderCode,
        lineNumber: PurchaseLineReceivals.lineNumber,
        receiptStatus: PurchaseLineReceivals.receiptStatus,
        receiptDate: PurchaseLineReceivals.receiptDate,
        unit: PurchaseLineReceivals.unit,
        qty: PurchaseLineReceivals.receivedQty,
        kg: PurchaseLineReceivals.kgActual,
        netPrice: PurchaseOrderItems.netPrice,
        priceUnit: PurchaseOrderItems.priceUnit,
      })
      .from(PurchaseLineReceivals)
      .leftJoin(
        Companies,
        eq(PurchaseLineReceivals.companyUuid, Companies.uuid),
      )
      .leftJoin(Products, eq(PurchaseLineReceivals.productUuid, Products.uuid))
      .leftJoin(
        PurchaseOrderItems,
        eq(
          PurchaseLineReceivals.purchaseOrderItemUuid,
          PurchaseOrderItems.uuid,
        ),
      )
      .orderBy(desc(PurchaseLineReceivals.receiptDate));

    return rows.map((row) => {
      const kg = Number(row.kg ?? 0);
      return {
        uuid: row.uuid,
        companyCode: row.companyCode,
        companyName: row.companyName,
        productCode: row.productCode,
        productName: row.productName,
        purchaseOrderCode: row.purchaseOrderCode,
        lineNumber: row.lineNumber,
        receiptStatus: row.receiptStatus,
        receiptDate: row.receiptDate,
        unit: row.unit,
        qty: Number(row.qty ?? 0),
        kg,
        materialStillToInvoice: materialStillToInvoice({
          status: row.receiptStatus,
          kgReceived: kg,
          pricePerUnit: Number(row.netPrice ?? 0),
          priceUnit: row.priceUnit,
        }),
      };
    });
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch receipts"));
  }
};
