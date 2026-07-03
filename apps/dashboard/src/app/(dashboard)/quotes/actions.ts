"use server";

import { db } from "@/db";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { Contacts, SelectContacts } from "@/db/schema/contacts";
import { InsertQuotes, Quotes, SelectQuotes } from "@/db/schema/quotes";
import { generateUuid } from "@/lib/helpers";
import { count, desc, eq, getTableColumns } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type QuoteFields = Omit<
  InsertQuotes,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type QuoteActionResult = {
  quoteUuid?: string;
  error?: string;
  success?: boolean;
};

export type QuoteListItem = SelectQuotes & {
  companyName: SelectCompanies["companyName"] | null;
  contactFirstName: SelectContacts["firstName"] | null;
  contactLastName: SelectContacts["lastName"] | null;
};

export const getQuotes = async (): Promise<QuoteListItem[]> => {
  try {
    const rows = await db
      .select({
        ...getTableColumns(Quotes),
        companyName: Companies.companyName,
        contactFirstName: Contacts.firstName,
        contactLastName: Contacts.lastName,
      })
      .from(Quotes)
      .leftJoin(Companies, eq(Quotes.companyUuid, Companies.uuid))
      .leftJoin(Contacts, eq(Quotes.contactUuid, Contacts.uuid))
      .orderBy(desc(Quotes.createdAt));
    return rows;
  } catch {
    throw new Error("Failed to fetch quotes");
  }
};

export const getQuoteCountsByCompany = async (): Promise<
  Map<string, number>
> => {
  const rows = await db
    .select({ companyUuid: Quotes.companyUuid, value: count() })
    .from(Quotes)
    .groupBy(Quotes.companyUuid);
  return new Map(rows.map((row) => [row.companyUuid, row.value] as const));
};

export const createQuote = async (
  fields: QuoteFields,
): Promise<QuoteActionResult> => {
  const uuid = generateUuid();
  try {
    await db.insert(Quotes).values({ ...fields, uuid });
    revalidatePath("/quotes");
    return { success: true, quoteUuid: uuid };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create quote",
    };
  }
};
