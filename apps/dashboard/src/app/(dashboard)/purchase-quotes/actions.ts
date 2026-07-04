"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  InsertPurchaseQuotes,
  PurchaseQuotes,
  SelectPurchaseQuotes,
} from "@/db/schema/purchase-quotes";
import { resolveCompanyType } from "@/app/(dashboard)/companies/actions";
import { generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type PurchaseQuoteFields = Omit<
  InsertPurchaseQuotes,
  "id" | "uuid" | "companyType" | "createdAt" | "updatedAt"
>;

export type PurchaseQuoteActionResult = {
  purchaseQuoteUuid?: string;
  error?: string;
  success?: boolean;
};

export type PurchaseQuoteListItem = SelectPurchaseQuotes & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export const getPurchaseQuotes = async (): Promise<PurchaseQuoteListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(PurchaseQuotes),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(PurchaseQuotes)
      .leftJoin(Companies, eq(PurchaseQuotes.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(PurchaseQuotes.contactUuid, Contacts.uuid))
      .orderBy(desc(PurchaseQuotes.createdAt));
  } catch {
    throw new Error("Failed to fetch purchase quotes");
  }
};

export const createPurchaseQuote = async (
  fields: PurchaseQuoteFields,
): Promise<PurchaseQuoteActionResult> => {
  const uuid = generateUuid();
  try {
    const companyType = await resolveCompanyType(fields.companyUuid);
    await db.insert(PurchaseQuotes).values({ ...fields, companyType, uuid });
    revalidatePath("/purchase-quotes");
    return { success: true, purchaseQuoteUuid: uuid };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create purchase quote",
    };
  }
};
