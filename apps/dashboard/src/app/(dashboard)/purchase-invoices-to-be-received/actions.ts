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
import { PurchaseInvoices } from "@/db/schema/purchase-invoices";
import { PurchaseOrderItems } from "@/db/schema/purchase-order-items";
import { and, desc, eq, isNotNull, max, notInArray, sql } from "drizzle-orm";

export type PurchaseInvoiceToReceiveRow = {
  purchaseOrderUuid: SelectPurchaseOrders["uuid"];
  // The order's own number. The `Purchase order` column used to show
  // `reference`, which is the **supplier's** reference and is empty on almost
  // every order, so no row named the document it was about.
  purchaseOrderId: SelectPurchaseOrders["id"];
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
    // 🔴 Purchase orders already covered by a supplier invoice, read off the
    // **invoice line's own link to the purchase line**.
    //
    // This used to go `PurchaseInvoiceItems -> Stock -> purchaseOrderUuid`,
    // which was a leftover from when booking an invoice created the stock lot.
    // It does not any more — the reference proved goods are booked in by the
    // unloading work order and no invoice appears anywhere in that chain — so
    // `stockUuid` is empty on every invoice raised now, and an order that had
    // been invoiced would never leave this queue.
    const invoicedRows = await db
      .selectDistinct({
        purchaseOrderUuid: PurchaseOrderItems.purchaseOrderUuid,
      })
      .from(PurchaseInvoiceItems)
      .innerJoin(
        PurchaseOrderItems,
        eq(PurchaseInvoiceItems.purchaseOrderItemUuid, PurchaseOrderItems.uuid),
      )
      .innerJoin(
        PurchaseInvoices,
        eq(PurchaseInvoiceItems.purchaseInvoiceUuid, PurchaseInvoices.uuid),
      )
      // A cancelled invoice bills nothing, so its order is owed one again.
      .where(eq(PurchaseInvoices.cancelled, false));

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
        purchaseOrderId: PurchaseOrders.id,
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
      // Newest first. Sorting alphabetically by company buried a just-received
      // order hundreds of rows down, on a screen with no search box.
      .orderBy(desc(PurchaseOrders.id));

    return rows.map((row) => ({
      purchaseOrderUuid: row.purchaseOrderUuid,
      purchaseOrderId: row.purchaseOrderId,
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
