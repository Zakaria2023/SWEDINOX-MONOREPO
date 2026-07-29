import "server-only";

import { InsertJournalEntries } from "@/db/schema/journal-entries";
import { generateUuid } from "@/lib/helpers";

export type SalesPosting = {
  /** The Invoices row being posted — an invoice or a credit note. */
  invoiceUuid: string;
  invoiceId: number | null;
  companyUuid: string | null;
  debCreditor: string | null;
  invoiceDate: Date | string | null;
  amountExclVat: number;
  vatAmount: number;
  userId: string | null;
  /** Books the same row with the opposite sign — used when cancelling. */
  reversal?: boolean;
  /** Overrides the default narration, e.g. when booking a correction. */
  description?: string;
};

/**
 * Placeholder GL account code for sales revenue; swap for the real chart of
 * accounts later. Held here so the invoice, its cancellation and the credit
 * note that reverses it can never drift onto different accounts.
 */
export const SALES_REVENUE_ACCOUNT = "8000";

/**
 * A sales document posts one row to the sales journal — revenue net of VAT,
 * with the VAT shown separately and the debtor as the counter-account. A
 * cancellation books the same row negated; a credit note arrives with its
 * amounts already negative and needs no reversal flag.
 */
export const buildSalesJournalEntry = (
  posting: SalesPosting,
): InsertJournalEntries => {
  const sign = posting.reversal ? -1 : 1;
  const bookingDate = posting.invoiceDate
    ? new Date(posting.invoiceDate).toISOString().split("T")[0]
    : null;

  return {
    uuid: generateUuid(),
    bookingDate,
    documentDate: bookingDate,
    documentNo: posting.invoiceId != null ? String(posting.invoiceId) : null,
    journal: "sales",
    account: SALES_REVENUE_ACCOUNT,
    debCreditor: posting.debCreditor,
    description:
      posting.description ??
      (posting.reversal ? "Sales invoice cancelled" : "Sales invoice"),
    amount: (sign * posting.amountExclVat).toFixed(2),
    vat: (sign * posting.vatAmount).toFixed(2),
    companyUuid: posting.companyUuid,
    invoiceUuid: posting.invoiceUuid,
    createdByUserId: posting.userId,
  };
};
