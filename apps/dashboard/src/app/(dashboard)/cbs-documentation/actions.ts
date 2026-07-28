"use server";

import { db } from "@/db";
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Orders, SelectOrders } from "@/db/schema/orders";
import { describeError } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export type CbsDocumentationRow = {
  key: string;
  invoiceDate: SelectInvoices["invoiceDate"];
  invoiceId: SelectInvoices["id"];
  invoiceAmount: SelectInvoiceItems["amount"];
  weightKg: SelectInvoiceItems["weightKg"];
  companyName: SelectCompanies["companyName"] | null;
  partnerId: SelectCompanies["vatNumber"] | null;
  orderType: SelectOrders["orderCategory"];
  orderCode: SelectOrders["id"];
  orderLineNr: SelectOrderItems["lineNumber"];
};

// CBS / Intrastat documentation export — one row per invoiced goods line, with
// its invoice, customer and originating order line. The CBS-specific codes
// (rubric, Intrastat commodity code, origin, container, statistical value,
// transaction/transport codes) aren't captured in this system yet, so those
// columns have no source.
export const getCbsDocumentation = async (): Promise<CbsDocumentationRow[]> => {
  try {
    return await db
      .select({
        key: InvoiceItems.uuid,
        invoiceDate: Invoices.invoiceDate,
        invoiceId: Invoices.id,
        // Declared value and weight come from the invoice line itself — a
        // statutory return must state what was invoiced, not what the order
        // happens to say now. The order stays joined for its identifiers.
        invoiceAmount: InvoiceItems.amount,
        weightKg: InvoiceItems.weightKg,
        companyName: Companies.companyName,
        partnerId: Companies.vatNumber,
        orderType: Orders.orderCategory,
        orderCode: Orders.id,
        orderLineNr: OrderItems.lineNumber,
      })
      .from(InvoiceItems)
      .innerJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .innerJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .innerJoin(Orders, eq(OrderItems.orderUuid, Orders.uuid))
      .orderBy(desc(Invoices.invoiceDate), desc(Invoices.id));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch CBS documentation"));
  }
};
