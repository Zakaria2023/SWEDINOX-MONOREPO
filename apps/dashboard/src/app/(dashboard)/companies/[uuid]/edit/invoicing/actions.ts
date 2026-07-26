"use server";

import type { CompanyActionResult } from "@/app/(dashboard)/companies/actions";
import { db, SelectCompanies } from "@/db";
import { Companies, InsertCompanies } from "@/db/schema/companies";
import { describeError } from "@/lib/helpers";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { companyInvoicingSchema, CompanyInvoicingFormValues } from "./validation";

export type CompanyInvoicingData = Pick<
  SelectCompanies,
  | "uuid"
  | "companyName"
  | "invoicingMethod"
  | "collectiveInvoicing"
  | "invoicePackagingAtZeroPrice"
  | "printCommodityCode"
  | "invoiceFrequency"
  | "invoicePrintEnabled"
  | "invoicePrintCount"
  | "invoiceEmailEnabled"
  | "invoiceEmailTo"
  | "printEmailZeroValueInvoices"
  | "sendXmlWithInvoice"
>;

export type UpdateCompanyInvoicingPayload = CompanyInvoicingFormValues & {
  companyUuid: string;
};

export const getCompanyInvoicing = async (
  companyUuid: string,
): Promise<CompanyInvoicingData | null> => {
  const [company] = await db
    .select({
      uuid: Companies.uuid,
      companyName: Companies.companyName,
      invoicingMethod: Companies.invoicingMethod,
      collectiveInvoicing: Companies.collectiveInvoicing,
      invoicePackagingAtZeroPrice: Companies.invoicePackagingAtZeroPrice,
      printCommodityCode: Companies.printCommodityCode,
      invoiceFrequency: Companies.invoiceFrequency,
      invoicePrintEnabled: Companies.invoicePrintEnabled,
      invoicePrintCount: Companies.invoicePrintCount,
      invoiceEmailEnabled: Companies.invoiceEmailEnabled,
      invoiceEmailTo: Companies.invoiceEmailTo,
      printEmailZeroValueInvoices: Companies.printEmailZeroValueInvoices,
      sendXmlWithInvoice: Companies.sendXmlWithInvoice,
    })
    .from(Companies)
    .where(eq(Companies.uuid, companyUuid))
    .limit(1);

  return company ?? null;
};

// Updates only the invoicing columns this section owns — other sections'
// fields (and all child collections) are untouched, so concurrent edits
// elsewhere can't be clobbered. An empty input intentionally clears its
// column.
export const updateCompanyInvoicing = async (
  _prevState: CompanyActionResult,
  payload: UpdateCompanyInvoicingPayload,
): Promise<CompanyActionResult> => {
  const { companyUuid, ...values } = payload;
  const parsed = companyInvoicingSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "Invalid invoicing settings — check the fields and try again",
    };
  }

  try {
    await db
      .update(Companies)
      .set({
        invoicingMethod: (parsed.data.invoicingMethod ||
          null) as InsertCompanies["invoicingMethod"],
        collectiveInvoicing: parsed.data.collectiveInvoicing,
        invoicePackagingAtZeroPrice: parsed.data.invoicePackagingAtZeroPrice,
        printCommodityCode: parsed.data.printCommodityCode,
        invoiceFrequency: parsed.data.invoiceFrequency,
        invoicePrintEnabled: parsed.data.invoicePrintEnabled,
        invoicePrintCount: parsed.data.invoicePrintCount,
        invoiceEmailEnabled: parsed.data.invoiceEmailEnabled,
        invoiceEmailTo: parsed.data.invoiceEmailTo || null,
        printEmailZeroValueInvoices: parsed.data.printEmailZeroValueInvoices,
        sendXmlWithInvoice: parsed.data.sendXmlWithInvoice,
      })
      .where(eq(Companies.uuid, companyUuid));
  } catch (error) {
    return {
      error: describeError(error, "Failed to update invoicing settings"),
    };
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${companyUuid}`);
  revalidatePath(`/companies/${companyUuid}/edit`);
  revalidatePath(`/companies/${companyUuid}/edit/invoicing`);
  revalidatePath(`/companies/${companyUuid}/edit/full`);
  redirect(`/companies/${companyUuid}/edit`);
};
