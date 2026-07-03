"use server";

import {
  Companies,
  db,
  InsertInvoices,
  InsertInvoiceSurcharges,
  Invoices,
  InvoiceSurcharges,
  SelectCompanies,
  SelectInvoices,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { count, desc, eq, getTableColumns, sum } from "drizzle-orm";

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
  companyName: SelectCompanies["companyName"] | null;
  companyCode: SelectCompanies["id"] | null;
};

export type InvoiceStats = { count: number; revenue: number };

export const getInvoices = async (): Promise<InvoiceWithCompany[]> => {
  const rows = await db
    .select({
      ...getTableColumns(Invoices),
      companyName: Companies.companyName,
      companyCode: Companies.id,
    })
    .from(Invoices)
    .leftJoin(Companies, eq(Invoices.companyUuid, Companies.uuid))
    .orderBy(desc(Invoices.createdAt));

  return rows.map((row) => ({
    ...row,
    companyName: row.companyName ?? null,
    companyCode: row.companyCode ?? null,
  }));
};

export const getInvoicesByCompanyUuid = async (
  companyUuid: string,
): Promise<SelectInvoices[]> =>
  db
    .select()
    .from(Invoices)
    .where(eq(Invoices.companyUuid, companyUuid))
    .orderBy(desc(Invoices.createdAt));

export const getInvoiceStatsByCompany = async (): Promise<
  Map<string, InvoiceStats>
> => {
  const rows = await db
    .select({
      companyUuid: Invoices.companyUuid,
      value: count(),
      revenue: sum(Invoices.invoiceAmountInclVat),
    })
    .from(Invoices)
    .groupBy(Invoices.companyUuid);
  const map = new Map<string, InvoiceStats>();
  for (const row of rows) {
    if (row.companyUuid) {
      map.set(row.companyUuid, {
        count: row.value,
        revenue: row.revenue ? parseFloat(row.revenue) : 0,
      });
    }
  }
  return map;
};

export const createInvoice = async (
  fields: InvoiceFields,
  surcharges: InvoiceSurchargeInput[] = [],
): Promise<InvoiceActionResult> => {
  const uuid = generateUuid();
  const exclVat = surcharges.reduce(
    (sum, s) => sum + parseFloat(s.amount ?? "0"),
    0,
  );
  const invoiceAmountInclVat = (exclVat * 1.21).toFixed(2);
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
