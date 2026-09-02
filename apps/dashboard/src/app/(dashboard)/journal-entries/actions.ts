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
import {
  dateRangeFilter,
  numberRangeFilter,
  relationFilter,
  runPaged,
  tableOrderBy,
  tableWhere,
  valueFilter,
} from "@/lib/server/table-query";
import {
  Paged,
  parseTableQuery,
  SearchParams,
  TableQuery,
} from "@/lib/table-query";
import { exportRows } from "@/lib/server/excel";
import { JOURNAL_ENTRY_COLUMNS } from "@/app/(dashboard)/journal-entries/columns";
import { asc, count, desc, eq, getTableColumns } from "drizzle-orm";

export type LedgerAccountRow = SelectLedgerAccounts;

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

const JOURNAL_SEARCH = [
  JournalEntries.documentNo,
  JournalEntries.description,
  JournalEntries.reference,
  JournalEntries.debCreditor,
  Companies.companyName,
] as const;

const JOURNAL_SORTABLE = {
  bookingDate: JournalEntries.bookingDate,
  documentNo: JournalEntries.documentNo,
  account: JournalEntries.account,
  company: Companies.companyName,
  amount: JournalEntries.amount,
};

// What a bookkeeper actually narrows by: which account, whose entry, which
// journal it was posted through, and over what period. account and booking_date
// carry their own indexes; company_uuid does too.
const JOURNAL_FILTERS = {
  account: valueFilter(JournalEntries.account),
  journal: valueFilter(JournalEntries.journal),
  company: relationFilter(JournalEntries.companyUuid),
  bookingDate: dateRangeFilter(JournalEntries.bookingDate),
  amount: numberRangeFilter(JournalEntries.amount),
};

/**
 * Postings newest first, and within one document in the order its lines were
 * written — a balanced entry only reads as one if its lines stay together.
 *
 * That ordering is why the fallback keeps all three of its terms: dropping to
 * booking date alone would interleave the lines of two documents posted on the
 * same day, and an entry whose halves are separated cannot be read at all.
 */
/**
 * The rows one view of the journal selects, as a window onto them. Shared by
 * the page and the export.
 */
const journalEntryRows =
  (query: TableQuery) =>
  (limit: number, offset: number): Promise<JournalEntryListItem[]> =>
    db
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
      .where(
        tableWhere({ query, search: JOURNAL_SEARCH, filters: JOURNAL_FILTERS }),
      )
      .orderBy(
        ...tableOrderBy(
          JOURNAL_SORTABLE,
          query,
          [
            desc(JournalEntries.bookingDate),
            desc(JournalEntries.entryUuid),
            asc(JournalEntries.id),
          ],
          JournalEntries.id,
        ),
      )
      .limit(limit)
      .offset(offset);

/** Every posting the current view matches, as a workbook. */
export const exportJournalEntries = async (
  params: SearchParams,
  columnKeys: string[],
): Promise<string> =>
  exportRows({
    name: "Journal Entries",
    columns: JOURNAL_ENTRY_COLUMNS,
    columnKeys,
    rows: journalEntryRows(parseTableQuery(params)),
  });

/** The chart of accounts, for the ledger-account filter on this overview. */
export const getLedgerAccounts = async (): Promise<LedgerAccountRow[]> => {
  try {
    return await db
      .select()
      .from(LedgerAccounts)
      .orderBy(asc(LedgerAccounts.number));
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch ledger accounts"));
  }
};

export const getJournalEntries = async (
  query: TableQuery,
): Promise<Paged<JournalEntryListItem>> => {
  try {
    const where = tableWhere({
      query,
      search: JOURNAL_SEARCH,
      filters: JOURNAL_FILTERS,
    });

    return await runPaged(query, {
      rows: journalEntryRows(query),

      count: async () => {
        const [row] = await db
          .select({ value: count() })
          .from(JournalEntries)
          .leftJoin(Companies, eq(JournalEntries.companyUuid, Companies.uuid))
          .where(where);
        return Number(row?.value ?? 0);
      },
    });
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

    const debit = siblingLines.reduce((sum, row) => sum + Number(row.debit), 0);
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
