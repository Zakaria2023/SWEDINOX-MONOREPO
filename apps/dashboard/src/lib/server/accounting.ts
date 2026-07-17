import "server-only";

import { InsertJournalEntries } from "@/db/schema/journal-entries";
import { generateUuid } from "@/lib/helpers";

// Placeholder GL account codes. These live here so the posting rules have a
// single source of truth; swap them for the real chart of accounts later.
const GL_ACCOUNTS = {
  salesRevenue: "8000",
  purchases: "7000",
} as const;

const toDateString = (value: Date | string | null | undefined): string | null =>
  value ? new Date(value).toISOString().split("T")[0] : null;

type InvoicePosting = {
  invoiceUuid: string;
  invoiceId: number | null;
  companyUuid: string | null;
  debCreditor: string | null;
  invoiceDate: Date | string | null;
  amountExclVat: number;
  vatAmount: number;
  userId: string | null;
  // When cancelling, the entry is booked with the opposite sign.
  reversal?: boolean;
};

// A sales invoice posts one row to the sales journal — revenue net of VAT,
// with the VAT shown separately and the debtor as the counter-account. A
// cancellation books the same row negated.
export const buildSalesInvoiceJournalEntry = (
  posting: InvoicePosting,
): InsertJournalEntries => {
  const sign = posting.reversal ? -1 : 1;
  const bookingDate = toDateString(posting.invoiceDate);
  return {
    uuid: generateUuid(),
    bookingDate,
    documentDate: bookingDate,
    documentNo: posting.invoiceId != null ? String(posting.invoiceId) : null,
    journal: "sales",
    account: GL_ACCOUNTS.salesRevenue,
    debCreditor: posting.debCreditor,
    description: posting.reversal ? "Sales invoice cancelled" : "Sales invoice",
    amount: (sign * posting.amountExclVat).toFixed(2),
    vat: (sign * posting.vatAmount).toFixed(2),
    companyUuid: posting.companyUuid,
    invoiceUuid: posting.invoiceUuid,
    createdByUserId: posting.userId,
  };
};

// A purchase invoice posts to the purchase journal with the creditor as the
// counter-account. `invoiceUuid` here is the purchase invoice's uuid and is
// linked via purchaseInvoiceUuid (invoiceUuid is reserved for sales invoices).
export const buildPurchaseInvoiceJournalEntry = (
  posting: InvoicePosting,
): InsertJournalEntries => {
  const sign = posting.reversal ? -1 : 1;
  const bookingDate = toDateString(posting.invoiceDate);
  return {
    uuid: generateUuid(),
    bookingDate,
    documentDate: bookingDate,
    documentNo: posting.invoiceId != null ? String(posting.invoiceId) : null,
    journal: "purchase",
    account: GL_ACCOUNTS.purchases,
    debCreditor: posting.debCreditor,
    description: posting.reversal
      ? "Purchase invoice cancelled"
      : "Purchase invoice",
    amount: (sign * posting.amountExclVat).toFixed(2),
    vat: (sign * posting.vatAmount).toFixed(2),
    companyUuid: posting.companyUuid,
    purchaseInvoiceUuid: posting.invoiceUuid,
    createdByUserId: posting.userId,
  };
};
