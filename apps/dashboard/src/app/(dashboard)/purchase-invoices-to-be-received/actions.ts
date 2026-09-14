"use server";
import { describeError } from "@/lib/helpers";

import { Companies, SelectCompanies } from "@/db/schema/companies";
import { SelectCompanyAddresses } from "@/db/schema/company-addresses";
import { db } from "@/db";
import { companyAddressFor } from "@/lib/server/company-addresses";
import { PurchaseInvoiceItems } from "@/db/schema/purchase-invoice-items";
import {
  PurchaseLineReceivals,
  SelectPurchaseLineReceivals,
} from "@/db/schema/purchase-line-receivals";
import {
  PurchaseOrders,
  SelectPurchaseOrders,
} from "@/db/schema/purchase-orders";
import { Stock } from "@/db/schema/stock";
import { and, asc, eq, isNotNull, max, notInArray, sql } from "drizzle-orm";

export type PurchaseInvoiceToReceiveRow = {
  purchaseOrderUuid: SelectPurchaseOrders["uuid"];
  reference: SelectPurchaseOrders["reference"];
  supplierName: SelectCompanies["companyName"] | null;
  companyCode: SelectCompanies["id"] | null;
  city: SelectCompanyAddresses["city"] | null;
  orderDate: SelectPurchaseOrders["orderDate"];
  paymentTerms: SelectPurchaseOrders["paymentTerms"];
  scheduledDeliveryDate: SelectPurchaseOrders["deliveryDate"];
  actualDeliveryDate: SelectPurchaseLineReceivals["receiptDate"] | null;
  amount: number;
};

// Purchase orders whose goods have been received (a receival exists) but for
// which no supplier invoice has landed yet — the invoices we are still waiting
// to receive. "Invoiced" is detected via the stock lots those invoices booked.
export const getPurchaseInvoicesToBeReceived = async (): Promise<
  PurchaseInvoiceToReceiveRow[]
> => {
  try {
    // Purchase orders already covered by a received supplier invoice.
    const invoicedRows = await db
      .selectDistinct({ purchaseOrderUuid: Stock.purchaseOrderUuid })
      .from(PurchaseInvoiceItems)
      .innerJoin(Stock, eq(PurchaseInvoiceItems.stockUuid, Stock.uuid))
      .where(isNotNull(Stock.purchaseOrderUuid));

    const invoicedPoUuids = invoicedRows
      .map((row) => row.purchaseOrderUuid)
      .filter((uuid): uuid is string => uuid !== null);

    // Actual delivery = latest receipt date booked against the order.
    const receivals = db
      .select({
        purchaseOrderUuid: PurchaseLineReceivals.purchaseOrderUuid,
        actualDeliveryDate: max(PurchaseLineReceivals.receiptDate).as(
          "actual_delivery_date",
        ),
      })
      .from(PurchaseLineReceivals)
      .where(isNotNull(PurchaseLineReceivals.purchaseOrderUuid))
      .groupBy(PurchaseLineReceivals.purchaseOrderUuid)
      .as("receivals");

    // The supplier's city is its visiting address.
    const visiting = companyAddressFor("visit", "visiting_address");

    const rows = await db
      .select({
        purchaseOrderUuid: PurchaseOrders.uuid,
        reference: PurchaseOrders.reference,
        supplierName: Companies.companyName,
        companyCode: Companies.id,
        city: visiting.city,
        orderDate: PurchaseOrders.orderDate,
        paymentTerms: PurchaseOrders.paymentTerms,
        scheduledDeliveryDate: PurchaseOrders.deliveryDate,
        actualDeliveryDate: receivals.actualDeliveryDate,
        amount: PurchaseOrders.amount,
      })
      .from(PurchaseOrders)
      .innerJoin(Companies, eq(PurchaseOrders.supplierUuid, Companies.uuid))
      .innerJoin(
        receivals,
        eq(receivals.purchaseOrderUuid, PurchaseOrders.uuid),
      )
      .leftJoin(visiting, eq(Companies.uuid, visiting.companyUuid))
      .where(
        and(
          sql`${PurchaseOrders.status} <> 'cancelled'`,
          invoicedPoUuids.length > 0
            ? notInArray(PurchaseOrders.uuid, invoicedPoUuids)
            : undefined,
        ),
      )
      .orderBy(asc(Companies.companyName), asc(PurchaseOrders.orderDate));

    return rows.map((row) => ({
      purchaseOrderUuid: row.purchaseOrderUuid,
      reference: row.reference,
      supplierName: row.supplierName,
      companyCode: row.companyCode,
      city: row.city ?? null,
      orderDate: row.orderDate,
      paymentTerms: row.paymentTerms,
      scheduledDeliveryDate: row.scheduledDeliveryDate,
      actualDeliveryDate: row.actualDeliveryDate ?? null,
      amount: Number(row.amount),
    }));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch purchase invoices to be received"));
  }
};
