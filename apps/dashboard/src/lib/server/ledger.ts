import "server-only";

import { InsertJournalEntries } from "@/db/schema/journal-entries";
import { InsertLedgerAccounts } from "@/db/schema/ledger-accounts";
import { LedgerAccountType } from "@/lib/enums";
import {
  debitCredit,
  financialPeriodFor,
  generateUuid,
  postingBalance,
} from "@/lib/helpers";

export type PurchasePosting = {
  /** The PurchaseInvoices row being posted — an invoice or a credit note. */
  purchaseInvoiceUuid: string;
  invoiceId: number | null;
  companyUuid: string | null;
  debCreditor: string | null;
  invoiceDate: Date | string | null;
  amountExclVat: number;
  vatAmount: number;
  /** The supplier's credit-restriction surcharge, if their terms carry one. */
  creditRestriction?: number;
  /** Typed total less what the lines account for — booked to differences. */
  remainder?: number;
  userId: string | null;
  reversal?: boolean;
  description?: string;
};

export type SalesPosting = {
  /** The Invoices row being posted — an invoice or a credit note. */
  invoiceUuid: string;
  invoiceId: number | null;
  companyUuid: string | null;
  debCreditor: string | null;
  invoiceDate: Date | string | null;
  amountExclVat: number;
  vatAmount: number;
  /** The credit-restriction surcharge added to the invoice, if any. */
  creditRestriction?: number;
  userId: string | null;
  /** Books the same entry with every side reversed — used when cancelling. */
  reversal?: boolean;
  /** Overrides the default narration, e.g. when booking a correction. */
  description?: string;
};

export type SettlementPosting = {
  invoiceUuid: string | null;
  purchaseInvoiceUuid: string | null;
  documentNo: string | null;
  companyUuid: string | null;
  debCreditor: string | null;
  paymentDate: string;
  /** Signed: positive is money into the account, negative is out of it. */
  amount: number;
  /** The account the cash or the discount lands on. */
  account: string;
  description: string;
  userId: string | null;
};

/**
 * The general-ledger accounts this system posts to.
 *
 * Numbering follows Dutch practice, which the reference system also uses: 1xxx
 * balance-sheet accounts, 4xxx costs, 7xxx cost of sales, 8xxx revenue. The
 * previous two constants were labelled placeholders; these are the same numbers
 * with the counter-accounts they were always implying.
 */
export const LEDGER_ACCOUNTS = {
  bank: "1100",
  debtors: "1300",
  vatReclaimable: "1520",
  vatPayable: "1530",
  creditors: "1600",
  /** Differences between a supplier's typed total and what its lines explain. */
  differences: "1999",
  discountGranted: "4700",
  creditRestriction: "4750",
  purchases: "7000",
  salesRevenue: "8000",
} as const satisfies Record<string, string>;

/** Kept as named exports: these two account numbers pre-date the chart. */
export const SALES_REVENUE_ACCOUNT = LEDGER_ACCOUNTS.salesRevenue;
export const PURCHASES_ACCOUNT = LEDGER_ACCOUNTS.purchases;

type ChartEntry = {
  number: string;
  name: string;
  type: LedgerAccountType;
  isSubLedger?: boolean;
};

/**
 * What each account number means, for seeding the chart of accounts.
 *
 * Held beside the posting code on purpose: an account this system posts to but
 * cannot name is a gap, and keeping both in one file makes that gap obvious the
 * moment a new account is introduced.
 */
export const DEFAULT_CHART_OF_ACCOUNTS: ChartEntry[] = [
  { number: LEDGER_ACCOUNTS.bank, name: "Bank", type: "asset" },
  {
    number: LEDGER_ACCOUNTS.debtors,
    name: "Trade debtors",
    type: "asset",
    isSubLedger: true,
  },
  {
    number: LEDGER_ACCOUNTS.vatReclaimable,
    name: "VAT reclaimable",
    type: "asset",
  },
  { number: LEDGER_ACCOUNTS.vatPayable, name: "VAT payable", type: "liability" },
  {
    number: LEDGER_ACCOUNTS.creditors,
    name: "Trade creditors",
    type: "liability",
    isSubLedger: true,
  },
  {
    number: LEDGER_ACCOUNTS.differences,
    name: "Differences to be cleared",
    type: "liability",
  },
  {
    number: LEDGER_ACCOUNTS.discountGranted,
    name: "Early payment discount granted",
    type: "expense",
  },
  {
    number: LEDGER_ACCOUNTS.creditRestriction,
    name: "Credit restriction",
    type: "revenue",
  },
  { number: LEDGER_ACCOUNTS.purchases, name: "Purchases", type: "expense" },
  {
    number: LEDGER_ACCOUNTS.salesRevenue,
    name: "Sales revenue",
    type: "revenue",
  },
];

export const chartOfAccountsRows = (): InsertLedgerAccounts[] =>
  DEFAULT_CHART_OF_ACCOUNTS.map((account) => ({
    uuid: generateUuid(),
    number: account.number,
    name: account.name,
    type: account.type,
    isSubLedger: account.isSubLedger ?? false,
  }));

type LineDraft = {
  account: string;
  /** Signed: positive lands on the debit side, negative on the credit side. */
  amount: number;
  description?: string;
};

type EntryContext = {
  bookingDate: Date | string | null;
  documentNo: string | null;
  journal: string;
  description: string;
  debCreditor: string | null;
  companyUuid: string | null;
  invoiceUuid?: string | null;
  purchaseInvoiceUuid?: string | null;
  userId: string | null;
};

/**
 * Turns a set of signed drafts into balanced journal lines, refusing to return
 * anything that does not balance.
 *
 * Throwing inside the transaction is the point. An unbalanced entry is a bug in
 * the caller, and letting it reach the database means the ledger can never be
 * trusted again — every report built on it would need a caveat. Failing the
 * invoice is recoverable; a silently broken ledger is not.
 */
const buildEntry = (
  context: EntryContext,
  drafts: LineDraft[],
): InsertJournalEntries[] => {
  const bookingDate = context.bookingDate
    ? new Date(context.bookingDate).toISOString().split("T")[0]
    : null;
  const financialPeriod = financialPeriodFor(bookingDate);
  const entryUuid = generateUuid();

  // A zero line records nothing and only clutters the account it names.
  const lines = drafts.filter((draft) => Math.abs(draft.amount) >= 0.005);

  const rows = lines.map((draft) => {
    const { debit, credit } = debitCredit(draft.amount);
    return {
      uuid: generateUuid(),
      entryUuid,
      bookingDate,
      documentDate: bookingDate,
      financialYear: financialPeriod?.financialYear ?? null,
      period: financialPeriod?.period ?? null,
      documentNo: context.documentNo,
      journal: context.journal,
      account: draft.account,
      debCreditor: context.debCreditor,
      description: draft.description ?? context.description,
      debit: debit.toFixed(2),
      credit: credit.toFixed(2),
      amount: draft.amount.toFixed(2),
      vat: "0.00",
      companyUuid: context.companyUuid,
      invoiceUuid: context.invoiceUuid ?? null,
      purchaseInvoiceUuid: context.purchaseInvoiceUuid ?? null,
      createdByUserId: context.userId,
    } satisfies InsertJournalEntries;
  });

  const balance = postingBalance(
    rows.map((row) => ({
      account: row.account ?? "",
      debit: Number(row.debit),
      credit: Number(row.credit),
    })),
  );

  if (!balance.balanced) {
    throw new Error(
      `Refusing to post an unbalanced entry for ${context.description}: debits ${balance.totalDebit.toFixed(2)} against credits ${balance.totalCredit.toFixed(2)}.`,
    );
  }

  return rows;
};

/**
 * A sales document as a balanced entry: the debtor owes the whole invoice, and
 * that total is made up of revenue, any credit restriction, and the VAT owed to
 * the tax authority.
 *
 * A cancellation reverses every side; a credit note arrives with its amounts
 * already negative, which flips the sides on its own and needs no flag.
 */
export const buildSalesJournalEntry = (
  posting: SalesPosting,
): InsertJournalEntries[] => {
  const sign = posting.reversal ? -1 : 1;
  const revenue = sign * posting.amountExclVat;
  const restriction = sign * (posting.creditRestriction ?? 0);
  const vat = sign * posting.vatAmount;

  return buildEntry(
    {
      bookingDate: posting.invoiceDate,
      documentNo: posting.invoiceId != null ? String(posting.invoiceId) : null,
      journal: "sales",
      description:
        posting.description ??
        (posting.reversal ? "Sales invoice cancelled" : "Sales invoice"),
      debCreditor: posting.debCreditor,
      companyUuid: posting.companyUuid,
      invoiceUuid: posting.invoiceUuid,
      userId: posting.userId,
    },
    [
      // The debtor is owed everything the customer will pay.
      { account: LEDGER_ACCOUNTS.debtors, amount: revenue + restriction + vat },
      { account: LEDGER_ACCOUNTS.salesRevenue, amount: -revenue },
      { account: LEDGER_ACCOUNTS.creditRestriction, amount: -restriction },
      { account: LEDGER_ACCOUNTS.vatPayable, amount: -vat },
    ],
  );
};

/**
 * A purchase document as a balanced entry: the creditor is owed the whole
 * invoice, made up of the goods, any credit restriction, the VAT reclaimable,
 * and whatever the lines fail to explain.
 *
 * The remainder gets an account of its own rather than being folded into
 * purchases. A difference between a supplier's typed total and what their lines
 * add up to is something a bookkeeper has to clear, and burying it in cost of
 * sales is how it stops being clearable.
 */
export const buildPurchaseJournalEntry = (
  posting: PurchasePosting,
): InsertJournalEntries[] => {
  const sign = posting.reversal ? -1 : 1;
  const goods = sign * posting.amountExclVat;
  const restriction = sign * (posting.creditRestriction ?? 0);
  const vat = sign * posting.vatAmount;
  const remainder = sign * (posting.remainder ?? 0);

  return buildEntry(
    {
      bookingDate: posting.invoiceDate,
      documentNo: posting.invoiceId != null ? String(posting.invoiceId) : null,
      journal: "purchase",
      description:
        posting.description ??
        (posting.reversal ? "Purchase invoice cancelled" : "Purchase invoice"),
      debCreditor: posting.debCreditor,
      companyUuid: posting.companyUuid,
      purchaseInvoiceUuid: posting.purchaseInvoiceUuid,
      userId: posting.userId,
    },
    [
      { account: LEDGER_ACCOUNTS.purchases, amount: goods },
      { account: LEDGER_ACCOUNTS.creditRestriction, amount: restriction },
      { account: LEDGER_ACCOUNTS.vatReclaimable, amount: vat },
      { account: LEDGER_ACCOUNTS.differences, amount: remainder },
      {
        account: LEDGER_ACCOUNTS.creditors,
        amount: -(goods + restriction + vat + remainder),
      },
    ],
  );
};

/**
 * A settlement as a balanced pair: cash (or a discount) on one side, and the
 * sub-ledger the document belongs to on the other.
 *
 * Money moving is the only thing a settlement records — the VAT was booked when
 * the invoice was raised, so posting it again here would double it.
 */
export const buildSettlementEntry = (
  posting: SettlementPosting,
): InsertJournalEntries[] => {
  // Which sub-ledger is being cleared follows from which document was settled.
  const counterAccount = posting.invoiceUuid
    ? LEDGER_ACCOUNTS.debtors
    : LEDGER_ACCOUNTS.creditors;

  return buildEntry(
    {
      bookingDate: posting.paymentDate,
      documentNo: posting.documentNo,
      journal: "bank",
      description: posting.description,
      debCreditor: posting.debCreditor,
      companyUuid: posting.companyUuid,
      invoiceUuid: posting.invoiceUuid,
      purchaseInvoiceUuid: posting.purchaseInvoiceUuid,
      userId: posting.userId,
    },
    [
      { account: posting.account, amount: posting.amount },
      { account: counterAccount, amount: -posting.amount },
    ],
  );
};
