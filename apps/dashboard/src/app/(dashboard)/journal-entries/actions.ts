"use server";

import { describeError } from "@/lib/helpers";
import { db } from "@/db";
import {
  JournalEntries,
  SelectJournalEntries,
} from "@/db/schema/journal-entries";
import { Companies, SelectCompanies } from "@/db/schema/companies";
import {
  LedgerAccounts,
  SelectLedgerAccounts,
} from "@/db/schema/ledger-accounts";
import { asc, desc, eq, getTableColumns } from "drizzle-orm";

export type JournalEntryListItem = SelectJournalEntries & {
  companyName: SelectCompanies["companyName"] | null;
  accountName: SelectLedgerAccounts["name"] | null;
};

// Postings newest first, and within one document in the order its lines were
// written — a balanced entry only reads as one if its lines stay together.
export const getJournalEntries = async (): Promise<JournalEntryListItem[]> => {
  try {
    return await db
      .select({
        ...getTableColumns(JournalEntries),
        companyName: Companies.companyName,
        accountName: LedgerAccounts.name,
      })
      .from(JournalEntries)
      .leftJoin(Companies, eq(JournalEntries.companyUuid, Companies.uuid))
      .leftJoin(LedgerAccounts, eq(JournalEntries.account, LedgerAccounts.number))
      .orderBy(
        desc(JournalEntries.bookingDate),
        desc(JournalEntries.entryUuid),
        asc(JournalEntries.id),
      );
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch journal entries"));
  }
};
