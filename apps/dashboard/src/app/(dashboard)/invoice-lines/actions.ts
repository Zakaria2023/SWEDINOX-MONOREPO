"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns } from "drizzle-orm";

// The money and weight columns come from the invoice line itself, which
// snapshots them at invoicing — reaching back to the order line would report
// whatever it says today rather than what was billed.
export type InvoiceLineItem = SelectInvoiceItems & {
  invoiceId: SelectInvoices["id"] | null;
  invoiceDate: SelectInvoices["invoiceDate"] | null;
  customerName: SelectCompanies["companyName"] | null;
  vatNumber: SelectCompanies["vatNumber"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  lineNumber: SelectOrderItems["lineNumber"] | null;
};

export const getInvoiceLines = async (): Promise<InvoiceLineItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(InvoiceItems),
        invoiceId: Invoices.id,
        invoiceDate: Invoices.invoiceDate,
        customerName: Companies.companyName,
        vatNumber: Companies.vatNumber,
        productCode: Products.productCode,
        productName: Products.name,
        lineNumber: OrderItems.lineNumber,
      })
      .from(InvoiceItems)
      .leftJoin(Invoices, eq(InvoiceItems.invoiceUuid, Invoices.uuid))
      .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
      .leftJoin(OrderItems, eq(InvoiceItems.orderItemUuid, OrderItems.uuid))
      .leftJoin(Products, eq(InvoiceItems.productUuid, Products.uuid))
      .orderBy(desc(Invoices.invoiceDate));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch invoice lines"));
  }
};
