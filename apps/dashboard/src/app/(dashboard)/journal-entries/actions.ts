"use server";
import { describeError } from "@/lib/helpers";

import { db } from "@/db";
import {
  JournalEntries,
  SelectJournalEntries,
} from "@/db/schema/journal-entries";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import { desc, eq, getTableColumns } from "drizzle-orm";

export type JournalEntryListItem = SelectJournalEntries & {
  companyName: SelectCompanies["companyName"] | null;
};

export const getJournalEntries = async (): Promise<JournalEntryListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(JournalEntries),
        companyName: Companies.companyName,
      })
      .from(JournalEntries)
      .leftJoin(Companies, eq(JournalEntries.companyUuid, Companies.uuid))
      .orderBy(desc(JournalEntries.bookingDate));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch journal entries"));
  }
};
