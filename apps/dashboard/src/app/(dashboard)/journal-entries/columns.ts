import { JournalEntryListItem } from "@/app/(dashboard)/journal-entries/actions";
import { dateCell, ExportColumn, textCell } from "@/lib/excel";

/**
 * The journal entries overview as a sheet — see app/(dashboard)/orders/columns.ts.
 */

export type JournalEntryColumnKey =
  | "bookingDate"
  | "documentNo"
  | "account"
  | "journal"
  | "externalAccount"
  | "description"
  | "reference"
  | "debit"
  | "credit"
  | "debCreditor"
  | "documentDate"
  | "explanation"
  | "transmissionDate";

// A posting has a debit or a credit, never both, and the screen leaves the
// other side blank rather than printing a zero. The sheet does the same: a
// column of zeroes reads as money that was posted.
const sideCell = (value: string | null) => {
  const amount = Number(value ?? 0);
  return amount === 0 ? null : amount;
};

export const JOURNAL_ENTRY_COLUMNS: Array<
  ExportColumn<JournalEntryListItem, JournalEntryColumnKey>
> = [
  {
    key: "bookingDate",
    label: "Booking date",
    defaultVisible: true,
    value: (row) => dateCell(row.bookingDate),
  },
  {
    key: "documentNo",
    label: "Document",
    defaultVisible: true,
    value: (row) => row.documentNo ?? `Posting #${row.id}`,
  },
  {
    key: "account",
    label: "Account",
    defaultVisible: true,
    value: (row) =>
      textCell([row.account, row.accountName].filter(Boolean).join(" ")),
  },
  {
    key: "journal",
    label: "Journal",
    defaultVisible: true,
    value: (row) => textCell(row.journal),
  },
  {
    key: "externalAccount",
    label: "External account",
    defaultVisible: true,
    value: (row) => textCell(row.externalAccount),
  },
  {
    key: "description",
    label: "Description",
    defaultVisible: true,
    value: (row) => textCell(row.description),
  },
  {
    key: "reference",
    label: "Reference",
    defaultVisible: true,
    value: (row) => textCell(row.reference),
  },
  {
    key: "debit",
    label: "Debit",
    defaultVisible: true,
    value: (row) => sideCell(row.debit),
  },
  {
    key: "credit",
    label: "Credit",
    defaultVisible: true,
    value: (row) => sideCell(row.credit),
  },
  {
    key: "debCreditor",
    label: "Deb/Creditor",
    defaultVisible: true,
    value: (row) => textCell(row.debCreditor ?? row.companyName),
  },
  {
    key: "documentDate",
    label: "Document date",
    defaultVisible: true,
    value: (row) => dateCell(row.documentDate),
  },
  {
    key: "explanation",
    label: "Explanation",
    defaultVisible: true,
    value: (row) => textCell(row.explanation),
  },
  {
    key: "transmissionDate",
    label: "Transmission date",
    defaultVisible: true,
    value: (row) => dateCell(row.transmissionDate),
  },
];
