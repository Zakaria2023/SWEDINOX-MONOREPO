"use server";

import { db } from "@/db";
import { JournalEntries } from "@/db/schema/journal-entries";
import {
  LedgerAccounts,
  SelectLedgerAccounts,
} from "@/db/schema/ledger-accounts";
import { describeError } from "@/lib/helpers";
import { chartOfAccountsRows } from "@/lib/server/ledger";
import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type TrialBalanceRow = {
  account: NonNullable<SelectLedgerAccounts["number"]>;
  accountName: SelectLedgerAccounts["name"] | null;
  accountType: SelectLedgerAccounts["type"] | null;
  totalDebit: number;
  totalCredit: number;
  /** Debit less credit — positive is a debit balance, negative a credit one. */
  balance: number;
  lineCount: number;
};

export type TrialBalance = {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  /** Zero on a healthy ledger. Anything else means an entry is one-sided. */
  difference: number;
  balanced: boolean;
  /** Postings sitting on an account the chart does not name. */
  unnamedAccounts: string[];
  /** True when the chart of accounts has not been created yet. */
  chartMissing: boolean;
};

export type SeedChartResult = { created?: number; error?: string };

/**
 * Totals every posting by account.
 *
 * This is the report the single-sided ledger could not produce. It is also the
 * only cheap way to know the accounting is sound: if the debits and credits do
 * not agree, something posted one side of an entry and not the other, and every
 * figure downstream is suspect.
 *
 * Accounts are read from the postings rather than from the chart, so a posting
 * to an account nobody has named still appears — and is called out — instead of
 * being silently dropped by an inner join.
 */
export const getTrialBalance = async (): Promise<TrialBalance> => {
  try {
    const rows = await db
      .select({
        account: JournalEntries.account,
        accountName: LedgerAccounts.name,
        accountType: LedgerAccounts.type,
        totalDebit: sql<string>`COALESCE(SUM(${JournalEntries.debit}), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(${JournalEntries.credit}), 0)`,
        lineCount: sql<number>`COUNT(*)`,
      })
      .from(JournalEntries)
      .leftJoin(
        LedgerAccounts,
        eq(JournalEntries.account, LedgerAccounts.number),
      )
      .groupBy(JournalEntries.account, LedgerAccounts.name, LedgerAccounts.type)
      .orderBy(asc(JournalEntries.account));

    const [chart] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(LedgerAccounts);

    const mapped: TrialBalanceRow[] = rows.map((row) => {
      const totalDebit = Number(row.totalDebit);
      const totalCredit = Number(row.totalCredit);
      return {
        account: row.account ?? "(none)",
        accountName: row.accountName,
        accountType: row.accountType,
        totalDebit,
        totalCredit,
        balance: totalDebit - totalCredit,
        lineCount: Number(row.lineCount),
      };
    });

    const totalDebit = mapped.reduce((sum, row) => sum + row.totalDebit, 0);
    const totalCredit = mapped.reduce((sum, row) => sum + row.totalCredit, 0);
    const difference = totalDebit - totalCredit;

    return {
      rows: mapped,
      totalDebit,
      totalCredit,
      difference,
      balanced: Math.abs(difference) < 0.005,
      unnamedAccounts: mapped
        .filter((row) => row.accountName === null)
        .map((row) => row.account),
      chartMissing: Number(chart?.count ?? 0) === 0,
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to build the trial balance"));
  }
};

export type LedgerAccountRow = SelectLedgerAccounts;

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

/**
 * Creates any account in the default chart that does not exist yet.
 *
 * Deliberately additive: an account already on file is left exactly as it is,
 * name and type included. Someone who has renamed 8000 to suit their own
 * bookkeeping should not have it overwritten by running this again, and a
 * posting already sitting on that account must keep meaning what it meant.
 */
export const seedChartOfAccounts = async (): Promise<SeedChartResult> => {
  try {
    const existing = await db
      .select({ number: LedgerAccounts.number })
      .from(LedgerAccounts);
    const known = new Set(existing.map((account) => account.number));

    const missing = chartOfAccountsRows().filter(
      (account) => !known.has(account.number),
    );

    if (missing.length === 0) {
      return { created: 0 };
    }

    await db.insert(LedgerAccounts).values(missing);

    revalidatePath("/trial-balance");
    revalidatePath("/journal-entries");
    return { created: missing.length };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create the chart of accounts",
    };
  }
};
