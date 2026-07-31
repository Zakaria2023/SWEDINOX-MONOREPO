"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  ImportedPurchaseInvoices,
  SelectImportedPurchaseInvoices,
} from "@/db/schema/integrations";
import { describeError } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type ImportedPurchaseInvoiceRow = SelectImportedPurchaseInvoices & {
  supplierName: SelectCompanies["companyName"] | null;
};

// The inbound message log for electronically delivered supplier invoices.
// Newest first, and messages needing a human come first within that: a failed
// import is the whole reason anyone opens this screen.
export const getImportedPurchaseInvoices = async (): Promise<
  ImportedPurchaseInvoiceRow[]
> => {
  try {
    return await db
      .select({
        ...getTableColumns(ImportedPurchaseInvoices),
        supplierName: Companies.companyName,
      })
      .from(ImportedPurchaseInvoices)
      .leftJoin(
        Companies,
        eq(ImportedPurchaseInvoices.supplierUuid, Companies.uuid),
      )
      .orderBy(
        desc(ImportedPurchaseInvoices.userInteractionRequired),
        desc(ImportedPurchaseInvoices.createdAt),
      );
  } catch (error) {
    throw new Error(
      describeError(error, "Failed to fetch imported purchase invoices"),
    );
  }
};
