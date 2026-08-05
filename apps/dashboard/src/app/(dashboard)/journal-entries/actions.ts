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

export type JournalEntryDetail = JournalEntryListItem & {
  accountType: SelectLedgerAccounts["type"] | null;
  /**
   * The other lines of the same document, so a posting can be read as the
   * balanced entry it is part of rather than as one side in isolation.
   */
  siblingLines: JournalEntryListItem[];
  /** Debits and credits across the whole entry, and whether they agree. */
  entryTotals: JournalEntryTotals;
};

export type JournalEntryTotals = {
  debit: number;
  credit: number;
  balanced: boolean;
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

/**
 * One posting line, together with the other lines of the same document.
 *
 * A single line is half a story: a sales invoice debits the debtor and credits
 * revenue and VAT, and only the group adds up. The whole entry is fetched so the
 * screen can show that it balances — and show that it does not, when it doesn't.
 *
 * A line with no `entryUuid` predates the double-sided ledger and has no group;
 * it stands alone rather than being matched to unrelated lines.
 */
export const getJournalEntryDetail = async (
  uuid: string,
): Promise<JournalEntryDetail | null> => {
  try {
    const [line] = await db
      .select({
        ...getTableColumns(JournalEntries),
        companyName: Companies.companyName,
        accountName: LedgerAccounts.name,
        accountType: LedgerAccounts.type,
      })
      .from(JournalEntries)
      .leftJoin(Companies, eq(JournalEntries.companyUuid, Companies.uuid))
      .leftJoin(
        LedgerAccounts,
        eq(JournalEntries.account, LedgerAccounts.number),
      )
      .where(eq(JournalEntries.uuid, uuid))
      .limit(1);

    if (!line) {
      return null;
    }

    const siblingLines = line.entryUuid
      ? await db
          .select({
            ...getTableColumns(JournalEntries),
            companyName: Companies.companyName,
            accountName: LedgerAccounts.name,
          })
          .from(JournalEntries)
          .leftJoin(Companies, eq(JournalEntries.companyUuid, Companies.uuid))
          .leftJoin(
            LedgerAccounts,
            eq(JournalEntries.account, LedgerAccounts.number),
          )
          .where(eq(JournalEntries.entryUuid, line.entryUuid))
          .orderBy(asc(JournalEntries.id))
      : [line];

    const debit = siblingLines.reduce(
      (sum, row) => sum + Number(row.debit),
      0,
    );
    const credit = siblingLines.reduce(
      (sum, row) => sum + Number(row.credit),
      0,
    );

    return {
      ...line,
      siblingLines,
      entryTotals: {
        debit,
        credit,
        // Compared to the cent, which is the precision the columns are stored at.
        balanced: Math.abs(debit - credit) < 0.005,
      },
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch journal entry"));
  }
};
