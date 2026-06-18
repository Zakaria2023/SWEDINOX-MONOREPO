"use server";

import {
  db,
  Invoices,
  InsertInvoices,
  SelectInvoices,
  InvoiceSurcharges,
  InsertInvoiceSurcharges,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export type InvoiceFields = Omit<
  InsertInvoices,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type InvoiceSurchargeInput = Omit<
  InsertInvoiceSurcharges,
  "id" | "uuid" | "invoiceUuid" | "createdAt" | "updatedAt"
>;

export type InvoiceListItem = Pick<
  SelectInvoices,
  | "uuid"
  | "invoiceNumber"
  | "invoiceDate"
  | "invoiceAmountExclVat"
  | "invoiceAmountInclVat"
  | "invoiceTotal"
  | "outstanding"
  | "paymentTerms"
  | "printed"
  | "mailed"
>;

export const getInvoicesByCompanyUuid = async (
  companyUuid: string,
): Promise<InvoiceListItem[]> => {
  return db
    .select({
      uuid: Invoices.uuid,
      invoiceNumber: Invoices.invoiceNumber,
      invoiceDate: Invoices.invoiceDate,
      invoiceAmountExclVat: Invoices.invoiceAmountExclVat,
      invoiceAmountInclVat: Invoices.invoiceAmountInclVat,
      invoiceTotal: Invoices.invoiceTotal,
      outstanding: Invoices.outstanding,
      paymentTerms: Invoices.paymentTerms,
      printed: Invoices.printed,
      mailed: Invoices.mailed,
    })
    .from(Invoices)
    .where(eq(Invoices.companyUuid, companyUuid))
    .orderBy(desc(Invoices.createdAt));
};

export type InvoiceActionResult = {
  invoiceUuid?: string;
  error?: string;
  success?: boolean;
};

export const createInvoice = async (
  fields: InvoiceFields,
  surcharges: InvoiceSurchargeInput[] = [],
): Promise<InvoiceActionResult> => {
  const uuid = generateUuid();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(Invoices).values({ ...fields, uuid });
      for (const surcharge of surcharges) {
        await tx.insert(InvoiceSurcharges).values({
          ...surcharge,
          uuid: generateUuid(),
          invoiceUuid: uuid,
        });
      }
    });
    return { success: true, invoiceUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create invoice",
    };
  }
};
