import "server-only";

import { InsertJournalEntries } from "@/db/schema/journal-entries";
import { InsertLedgerAccounts } from "@/db/schema/ledger-accounts";
import { LedgerAccountType, PaymentMethod } from "@/lib/enums";
import {
  debitCredit,
  financialPeriodFor,
  generateUuid,
  moneyString,
  postingBalance,
  settlementAccountFor,
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
  /**
   * How much of `amountExclVat` became stock. That part is an asset, not a
   * cost — it only becomes a cost when the goods are sold. Whatever is left
   * over (freight, handling, options) is a cost of buying and is expensed now.
   *
   * Left undefined, the whole invoice is treated as a cost, which is what a
   * document that receives no goods should do.
   */
  inventoryValue?: number;
  /**
   * Where the goods side lands. Defaults to inventory, which is right for a
   * receipt. A supplier's credit note for goods already sent back clears
   * `goodsReturnedNotCredited` instead — the stock left the shelf when it was
   * shipped, so crediting inventory again here would remove it twice.
   */
  goodsAccount?: string;
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
  /**
   * What the goods being billed cost us — the sum of the lines' cost amounts.
   *
   * Charged to cost of sales against the revenue it earned, in the same entry,
   * so a period's margin is the difference between two accounts rather than
   * something that has to be worked out from the order lines. Zero on a
   * document that bills no goods (a header correction, a surcharge-only
   * invoice).
   */
  costOfSales?: number;
  userId: string | null;
  /** Books the same entry with every side reversed — used when cancelling. */
  reversal?: boolean;
  /** Overrides the default narration, e.g. when booking a correction. */
  description?: string;
};

/**
 * Stock physically moving, with no invoice attached to it yet.
 *
 * Goods leave the warehouse at delivery and are billed later; goods come back
 * on a return and are credited later. Both are real changes to what the
 * business owns, so both have to move the inventory account when they happen —
 * not when the paperwork catches up.
 */
export type InventoryPosting = {
  bookingDate: Date | string | null;
  documentNo: string | null;
  description: string;
  companyUuid: string | null;
  debCreditor: string | null;
  /** Signed: positive is value entering inventory, negative is value leaving. */
  inventoryValue: number;
  /** The account the value is coming from, or going to. */
  counterAccount: string;
  reference?: string | null;
  userId: string | null;
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
  /** Notes and coin in the till. A cash payment never touches the bank. */
  cash: "1000",
  bank: "1100",
  /**
   * Card takings the acquirer is still holding. They are ours, but they are not
   * in the bank until the settlement lands, which is why they wait here.
   */
  cardClearing: "1150",
  debtors: "1300",
  vatReclaimable: "1520",
  vatPayable: "1530",
  creditors: "1600",
  /** Differences between a supplier's typed total and what its lines explain. */
  differences: "1999",
  /**
   * Settlements netted against another document rather than paid. An offset
   * clears one balance by moving it here, and the counter-document clears it
   * back out; a balance left standing is an offset only half done.
   */
  settlementOffsets: "1900",
  /** What the stock on the shelves is worth. Reconciles to the Stock table. */
  inventory: "3000",
  /**
   * Goods sent back to a supplier that they have not credited yet. A debit
   * balance here is money a supplier owes us for stock we no longer hold.
   */
  goodsReturnedNotCredited: "3100",
  /**
   * Our metal at an outside processor (C8). The reference books both legs of
   * external processing here — all 483 rows of its `Control Stock increase
   * ext. processing` export read `3100` — so the value leaves inventory on the
   * way out and comes back on the way in.
   */
  stockAtProcessor: "3100",
  /**
   * Goods that have shipped but not been billed yet — still ours in
   * accounting terms, no longer ours physically. A negative balance is the
   * mirror: goods a customer sent back that we have not credited yet.
   */
  goodsDeliveredNotInvoiced: "3200",
  /**
   * The mirror of the account above, on the buying side: goods the warehouse
   * has booked in but the supplier has not billed yet. Physically ours, and a
   * liability standing here until the purchase invoice clears it.
   */
  goodsReceivedNotInvoiced: "3300",
  discountGranted: "4700",
  creditRestriction: "4750",
  /** What the goods sold cost us, charged when the sale is invoiced. */
  costOfSales: "7000",
  /** Freight, handling and other costs of buying that never became stock. */
  purchaseCosts: "7100",
  /**
   * Stock that changed without a document behind it — a count difference,
   * damage, a write-off. The one inventory movement with no counterparty, so
   * the value has nowhere to go but straight to the result.
   */
  inventoryDifferences: "7200",
  salesRevenue: "8000",
} as const satisfies Record<string, string>;

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
  { number: LEDGER_ACCOUNTS.cash, name: "Cash in hand", type: "asset" },
  { number: LEDGER_ACCOUNTS.bank, name: "Bank", type: "asset" },
  {
    number: LEDGER_ACCOUNTS.cardClearing,
    name: "Card takings not yet settled",
    type: "asset",
  },
  {
    number: LEDGER_ACCOUNTS.settlementOffsets,
    name: "Settlement offsets",
    type: "liability",
  },
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
  {
    number: LEDGER_ACCOUNTS.vatPayable,
    name: "VAT payable",
    type: "liability",
  },
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
  { number: LEDGER_ACCOUNTS.inventory, name: "Inventory", type: "asset" },
  {
    number: LEDGER_ACCOUNTS.goodsReturnedNotCredited,
    name: "Goods returned to supplier, not yet credited",
    type: "asset",
  },
  {
    number: LEDGER_ACCOUNTS.goodsDeliveredNotInvoiced,
    name: "Goods delivered, not yet invoiced",
    type: "asset",
  },
  {
    number: LEDGER_ACCOUNTS.goodsReceivedNotInvoiced,
    name: "Goods received, not yet invoiced",
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
  {
    number: LEDGER_ACCOUNTS.costOfSales,
    name: "Cost of sales",
    type: "expense",
  },
  {
    number: LEDGER_ACCOUNTS.purchaseCosts,
    name: "Purchase costs and freight",
    type: "expense",
  },
  {
    number: LEDGER_ACCOUNTS.inventoryDifferences,
    name: "Inventory differences and write-offs",
    type: "expense",
  },
  {
    number: LEDGER_ACCOUNTS.salesRevenue,
    name: "Sales revenue",
    type: "revenue",
  },
];

/**
 * The account a settlement lands in, from how the money actually moved. Cash
 * goes to the till, a card to the acquirer's clearing account, an offset to the
 * offsets account because nothing arrived, and everything else to the bank.
 */
export const settlementAccountNumber = (
  method: PaymentMethod | null | undefined,
): string => {
  const key = settlementAccountFor(method);
  if (key === "cash") {
    return LEDGER_ACCOUNTS.cash;
  }
  if (key === "card_clearing") {
    return LEDGER_ACCOUNTS.cardClearing;
  }
  if (key === "offsets") {
    return LEDGER_ACCOUNTS.settlementOffsets;
  }
  return LEDGER_ACCOUNTS.bank;
};

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
  /** What the entry traces back to when it has no invoice to point at. */
  reference?: string | null;
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
      reference: context.reference ?? null,
      debit: moneyString(debit),
      credit: moneyString(credit),
      amount: moneyString(draft.amount),
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
      `Refusing to post an unbalanced entry for ${context.description}: debits ${moneyString(balance.totalDebit)} against credits ${moneyString(balance.totalCredit)}.`,
    );
  }

  return rows;
};

/**
 * A sales document as a balanced entry: the debtor owes the whole invoice, and
 * that total is made up of revenue, any credit restriction, and the VAT owed to
 * the tax authority. Alongside it, the cost of what was sold is charged against
 * the revenue that earned it.
 *
 * The cost side is a second pair inside the same entry, and it balances on its
 * own — cost of sales takes what the goods cost, and the account holding them
 * since delivery gives it up. Keeping it in the same entry is what makes a
 * cancellation reverse the margin along with the revenue, which is the whole
 * reason the two belong together.
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
  const cost = sign * (posting.costOfSales ?? 0);

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
      // And the goods stop being an asset and become a cost.
      { account: LEDGER_ACCOUNTS.costOfSales, amount: cost },
      { account: LEDGER_ACCOUNTS.goodsDeliveredNotInvoiced, amount: -cost },
    ],
  );
};

/**
 * A purchase document as a balanced entry: the creditor is owed the whole
 * invoice, made up of the goods, any credit restriction, the VAT reclaimable,
 * and whatever the lines fail to explain.
 *
 * Goods received are an asset, not a cost. Buying steel does not make the
 * business poorer — it swaps cash for steel, and the cost only lands when the
 * steel is sold. Expensing it at purchase instead puts the cost in whichever
 * month the goods arrived rather than the month they earned revenue, which
 * makes every monthly margin a function of when purchasing happened to buy.
 *
 * The remainder gets an account of its own rather than being folded into the
 * goods. A difference between a supplier's typed total and what their lines add
 * up to is something a bookkeeper has to clear, and burying it in inventory or
 * cost of sales is how it stops being clearable.
 */
export const buildPurchaseJournalEntry = (
  posting: PurchasePosting,
): InsertJournalEntries[] => {
  const sign = posting.reversal ? -1 : 1;
  const total = sign * posting.amountExclVat;
  const goods = sign * (posting.inventoryValue ?? posting.amountExclVat);
  // Whatever the invoice covered that never became stock is a cost of buying.
  const purchaseCosts = total - goods;
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
      {
        account: posting.goodsAccount ?? LEDGER_ACCOUNTS.inventory,
        amount: goods,
      },
      { account: LEDGER_ACCOUNTS.purchaseCosts, amount: purchaseCosts },
      { account: LEDGER_ACCOUNTS.creditRestriction, amount: restriction },
      { account: LEDGER_ACCOUNTS.vatReclaimable, amount: vat },
      { account: LEDGER_ACCOUNTS.differences, amount: remainder },
      {
        account: LEDGER_ACCOUNTS.creditors,
        amount: -(total + restriction + vat + remainder),
      },
    ],
  );
};

/**
 * Stock moving as a balanced pair: inventory on one side, and whichever account
 * is holding the value in the meantime on the other.
 *
 * Nothing is earned or lost here — value only changes hands between two
 * balance-sheet accounts, which is exactly what a delivery or a return is until
 * the invoice or credit note arrives to settle it. Both of those accounts should
 * clear to nothing once the paperwork follows, and a balance left sitting on one
 * of them is goods that moved and were never billed.
 */
export const buildInventoryMovementEntry = (
  posting: InventoryPosting,
): InsertJournalEntries[] =>
  buildEntry(
    {
      bookingDate: posting.bookingDate,
      documentNo: posting.documentNo,
      journal: "stock",
      description: posting.description,
      debCreditor: posting.debCreditor,
      companyUuid: posting.companyUuid,
      reference: posting.reference ?? null,
      userId: posting.userId,
    },
    [
      { account: LEDGER_ACCOUNTS.inventory, amount: posting.inventoryValue },
      { account: posting.counterAccount, amount: -posting.inventoryValue },
    ],
  );

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
