"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import {
  InsertPurchaseQuotes,
  PurchaseQuotes,
  SelectPurchaseQuotes,
} from "@/db/schema/purchase-quotes";
import { generateUuid } from "@/lib/helpers";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { revalidatePath } from "next/cache";

export type PurchaseQuoteFields = Omit<
  InsertPurchaseQuotes,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type PurchaseQuoteActionResult = {
  purchaseQuoteUuid?: string;
  error?: string;
  success?: boolean;
};

export type PurchaseQuoteListItem = SelectPurchaseQuotes & {
  supplierName: SelectCompanies["companyName"] | null;
  agentName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export const getPurchaseQuotes = async (): Promise<PurchaseQuoteListItem[]> => {
  const suppliers = alias(Companies, "suppliers");
  const agents = alias(Companies, "agents");
  try {
    return await db
      .select({
        ...getTableColumns(PurchaseQuotes),
        supplierName: suppliers.companyName,
        agentName: agents.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(PurchaseQuotes)
      .leftJoin(suppliers, eq(PurchaseQuotes.supplierUuid, suppliers.uuid))
      .leftJoin(agents, eq(PurchaseQuotes.agentUuid, agents.uuid))
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
    await db.insert(PurchaseQuotes).values({ ...fields, uuid });
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
