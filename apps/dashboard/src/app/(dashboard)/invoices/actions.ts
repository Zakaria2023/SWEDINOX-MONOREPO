"use server";

import {
  Companies,
  db,
  InsertInvoices,
  InsertInvoiceSurcharges,
  Invoices,
  InvoiceSurcharges,
  SelectInvoices,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc, eq } from "drizzle-orm";

export type InvoiceActionResult = {
  invoiceUuid?: string;
  error?: string;
  success?: boolean;
};

export type InvoiceFields = Omit<
  InsertInvoices,
  | "id"
  | "uuid"
  | "invoiceAmountExclVat"
  | "invoiceAmountInclVat"
  | "creditRestriction"
  | "invoiceTotal"
  | "outstanding"
  | "createdAt"
  | "updatedAt"
>;

export type InvoiceSurchargeInput = Omit<
  InsertInvoiceSurcharges,
  "id" | "uuid" | "invoiceUuid" | "createdAt" | "updatedAt"
>;

export type InvoiceWithCompany = SelectInvoices & {
  companyName: string | null;
  companyCode: number | null;
};

export const getInvoices = async (): Promise<InvoiceWithCompany[]> => {
  const invoices = await db
    .select()
    .from(Invoices)
    .orderBy(desc(Invoices.createdAt));

  if (invoices.length === 0) return [];

  const companies = await db
    .select({
      uuid: Companies.uuid,
      id: Companies.id,
      companyName: Companies.companyName,
    })
    .from(Companies);

  const companyMap = new Map(companies.map((c) => [c.uuid, c]));

  return invoices.map((inv) => {
    const company = inv.companyUuid
      ? companyMap.get(inv.companyUuid)
      : undefined;
    return {
      ...inv,
      companyName: company?.companyName ?? null,
      companyCode: company?.id ?? null,
    };
  });
};

export const getInvoicesByCompanyUuid = async (
  companyUuid: string,
): Promise<SelectInvoices[]> =>
  db
    .select()
    .from(Invoices)
    .where(eq(Invoices.companyUuid, companyUuid))
    .orderBy(desc(Invoices.createdAt));

export const createInvoice = async (
  fields: InvoiceFields,
  surcharges: InvoiceSurchargeInput[] = [],
): Promise<InvoiceActionResult> => {
  const uuid = generateUuid();
  const reverseChargeScenarios = [
    "domestic_purchase_vat_shifted",
    "purchase_within_eu_with_reverse_charge",
    "purchase_outside_eu_with_reverse_charge",
    "sales_within_eu_with_reverse_charge",
    "sales_outside_eu_with_reverse_charge",
  ];
  const exclVat = surcharges.reduce(
    (sum, s) => sum + parseFloat(s.surcharge ?? "0"),
    0,
  );
  const vatRate =
    fields.vatScenario && !reverseChargeScenarios.includes(fields.vatScenario)
      ? 0.21
      : 0;
  const invoiceAmountInclVat = (exclVat * (1 + vatRate)).toFixed(2);
  const creditRestriction = "0.00";
  const invoiceTotal = invoiceAmountInclVat;
  const outstanding = invoiceTotal;
  try {
    await db.transaction(async (tx) => {
      await tx.insert(Invoices).values({
        ...fields,
        uuid,
        invoiceAmountExclVat: exclVat.toFixed(2),
        invoiceAmountInclVat,
        creditRestriction,
        invoiceTotal,
        outstanding,
      });
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
      error:
        error instanceof Error ? error.message : "Failed to create invoice",
    };
  }
};
