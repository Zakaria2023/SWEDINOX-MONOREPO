"use server";

import {
  Companies,
  Contacts,
  db,
  InsertPurchaseInvoices,
  InsertPurchaseInvoiceSurcharges,
  PurchaseInvoices,
  PurchaseInvoiceSurcharges,
  SelectCompanies,
  SelectContacts,
  SelectPurchaseInvoices,
} from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { redirect } from "next/navigation";

export type PurchaseInvoiceActionResult = {
  purchaseInvoiceUuid?: string;
  error?: string;
  success?: boolean;
};

export type PurchaseInvoiceFields = Omit<
  InsertPurchaseInvoices,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type PurchaseInvoiceSurchargeInput = Omit<
  InsertPurchaseInvoiceSurcharges,
  "id" | "uuid" | "purchaseInvoiceUuid" | "createdAt" | "updatedAt"
>;

export type PurchaseInvoiceListItem = SelectPurchaseInvoices & {
  companyName: SelectCompanies["companyName"] | null;
  supplierCode: SelectCompanies["searchCode1"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export const getPurchaseInvoices = async (): Promise<
  PurchaseInvoiceListItem[]
> =>
  db
    .select({
      ...getTableColumns(PurchaseInvoices),
      companyName: Companies.companyName,
      supplierCode: Companies.searchCode1,
      contactFirstName: Contacts.firstName,
      contactLastName: Contacts.lastName,
    })
    .from(PurchaseInvoices)
    .leftJoin(Companies, eq(PurchaseInvoices.companyUuid, Companies.uuid))
    .leftJoin(
      Contacts,
      eq(PurchaseInvoices.invoiceSentByContactUuid, Contacts.uuid),
    )
    .orderBy(desc(PurchaseInvoices.createdAt));

export const createPurchaseInvoice = async (
  fields: PurchaseInvoiceFields,
  surcharges: PurchaseInvoiceSurchargeInput[] = [],
): Promise<PurchaseInvoiceActionResult> => {
  const uuid = generateUuid();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(PurchaseInvoices).values({ ...fields, uuid });

      if (surcharges.length > 0) {
        await tx.insert(PurchaseInvoiceSurcharges).values(
          surcharges.map((surcharge) => ({
            ...surcharge,
            uuid: generateUuid(),
            purchaseInvoiceUuid: uuid,
          })),
        );
      }
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase invoice",
    };
  }

  redirect("/purchase-invoices");
};
