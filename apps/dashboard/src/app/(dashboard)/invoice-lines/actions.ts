"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import { InvoiceItems, SelectInvoiceItems } from "@/db/schema/invoice-items";
import { Invoices, SelectInvoices } from "@/db/schema/invoices";
import { OrderItems, SelectOrderItems } from "@/db/schema/order-items";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Products, SelectProducts } from "@/db/schema/products";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type InvoiceLineItem = SelectInvoiceItems & {
  invoiceId: SelectInvoices["id"] | null;
  invoiceDate: SelectInvoices["invoiceDate"] | null;
  customerName: SelectCompanies["companyName"] | null;
  vatNumber: SelectCompanies["vatNumber"] | null;
  productCode: SelectProducts["productCode"] | null;
  productName: SelectProducts["name"] | null;
  lineNumber: SelectOrderItems["lineNumber"] | null;
  weightKg: SelectOrderItems["kgPlanned"] | null;
  amount: SelectOrderItems["amount"] | null;
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
        weightKg: OrderItems.kgPlanned,
        amount: OrderItems.amount,
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
