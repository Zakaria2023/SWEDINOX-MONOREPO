"use server";

import { db } from "@/db";
import { InvoiceItems } from "@/db/schema/invoice-items";
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
  invoiceAmount: SelectOrderItems["amount"];
  weightKg: SelectOrderItems["kgPlanned"];
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
        invoiceAmount: OrderItems.amount,
        weightKg: OrderItems.kgPlanned,
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
