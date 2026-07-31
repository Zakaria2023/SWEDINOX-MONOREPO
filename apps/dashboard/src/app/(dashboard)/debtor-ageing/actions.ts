"use server";

import {
  ageingBucketFor,
  daysOverdue,
  describeError,
  summariseAgeing,
  todayDateString,
  type AgeingTotals,
} from "@/lib/helpers";
import {
  getOpenReceivableItems,
  type OpenReceivable,
} from "@/lib/server/receivables";
import { AgeingBucket } from "@/lib/enums";

export type AgeingItem = OpenReceivable & {
  /** Days past the due date; negative while still inside the term. */
  daysOverdue: number | null;
  bucket: AgeingBucket;
};

export type DebtorAgeing = {
  /** The day the report was run — every age on it is measured from here. */
  asOf: string;
  items: AgeingItem[];
  totals: AgeingTotals;
  /** The same arithmetic per debtor, for the summary above the detail. */
  byDebtor: {
    companyUuid: string;
    companyName: string | null;
    invoiceCount: number;
    totals: AgeingTotals;
  }[];
};

/**
 * The sales ledger split by how late each open item is.
 *
 * Age runs from the due date, not the invoice date: an invoice on 60-day terms
 * is not overdue in its second month, and one on 8-day terms is badly overdue by
 * then. The report is stamped with the day it was run because every figure on it
 * is relative to that day.
 */
export const getDebtorAgeing = async (): Promise<DebtorAgeing> => {
  try {
    const asOf = todayDateString();
    const open = await getOpenReceivableItems();

    const items: AgeingItem[] = open.map((row) => ({
      ...row,
      daysOverdue: daysOverdue(row.dueDate, asOf),
      bucket: ageingBucketFor(row.dueDate, asOf),
    }));

    const grouped = new Map<string, AgeingItem[]>();
    for (const item of items) {
      // An invoice with no company is still owed by someone; it is grouped
      // under a blank key rather than dropped, so the debtor totals add up to
      // the ledger total.
      const key = item.companyUuid ?? "";
      const existing = grouped.get(key);
      if (existing) {
        existing.push(item);
      } else {
        grouped.set(key, [item]);
      }
    }

    const byDebtor = [...grouped.entries()]
      .map(([companyUuid, rows]) => ({
        companyUuid,
        companyName: rows[0]?.companyName ?? null,
        invoiceCount: rows.length,
        totals: summariseAgeing(rows, asOf),
      }))
      // Largest debt first — the list is read to decide who to chase.
      .sort((a, b) => b.totals.total - a.totals.total);

    return {
      asOf,
      items,
      totals: summariseAgeing(items, asOf),
      byDebtor,
    };
  } catch (error) {
    throw new Error(describeError(error, "Failed to fetch debtor ageing"));
  }
};
