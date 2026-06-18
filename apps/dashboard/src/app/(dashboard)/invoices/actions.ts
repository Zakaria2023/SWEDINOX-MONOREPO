"use server";

import {
  db,
  Invoices,
  InsertInvoices,
  InvoiceSurcharges,
  InsertInvoiceSurcharges,
} from "@/db";
import { generateUuid } from "@/lib/helpers";

export type InvoiceFields = Omit<
  InsertInvoices,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type InvoiceSurchargeInput = Omit<
  InsertInvoiceSurcharges,
  "id" | "uuid" | "invoiceUuid" | "createdAt" | "updatedAt"
>;

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
